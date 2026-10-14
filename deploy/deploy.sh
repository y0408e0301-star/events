#!/bin/bash
# 公開環境（CloudFront → EC2 → RDS）に、手元のコミット済みのコードを反映する
# events フォルダで実行する（Windows では Git Bash）
#
#   bash deploy/deploy.sh
#
# 1. 手元でビルドする（Next.js の standalone 出力。node_modules ごと 1 つのフォルダにまとまる）
# 2. EC2 へ転送し、deploy/server/setup.sh でサーバーの設定も最新にする
# 3. DB にマイグレーションを当て（prisma migrate deploy）、アプリを入れ替えて再起動し、公開 URL で動作を確かめる
#
# 接続先（EC2・RDS・公開 URL）と SSH の鍵は deploy/terraform（terraform apply 済み）から読む
set -euo pipefail

cd "$(dirname "$0")/.."

tf=deploy/terraform
key=$tf/events.pem
remote=/tmp/events-deploy
work=.next/deploy

# まだコミットしていない変更は反映しない（どのコミットを公開したか分かるようにする）
if [[ -n "$(git status --porcelain)" ]]; then
  echo "コミットしていない変更があります。コミットしてから実行してください" >&2
  git status --short >&2
  exit 1
fi
branch=$(git branch --show-current)
if [[ "$branch" != main ]]; then
  echo "注意: main ではなく $branch を反映します"
fi
commit=$(git rev-parse --short HEAD)

ec2_dns=$(terraform -chdir=$tf output -raw public_dns)
db_host=$(terraform -chdir=$tf output -raw db_endpoint)
db_secret_arn=$(terraform -chdir=$tf output -raw db_secret_arn)
url=$(terraform -chdir=$tf output -raw url)
host=ec2-user@$ec2_dns
ssh_opts=(-i "$key" -o StrictHostKeyChecking=accept-new)

echo "== ビルド（$branch $commit）"
# テスト・lint は CI（GitHub Actions）で実行済みなので、ここではビルドだけする
npm ci
npm run build

# 転送するものを 1 つのフォルダにまとめる
rm -rf "$work"
mkdir -p "$work/migrate"
cp -r .next/standalone "$work/app"
# 手元の .env（開発用の接続先）は送らない。公開環境の接続先は db-secret.sh が渡す
rm -f "$work/app/.env"
cp -r .next/static "$work/static"
# マイグレーション用（prisma migrate deploy）。Prisma CLI は EC2 で入れる（DB を操作する部分が OS ごとに違うため）
cp -r prisma prisma.config.ts "$work/migrate/"
node -e '
  const v = (name) => require(`./node_modules/${name}/package.json`).version;
  const pkg = { private: true, dependencies: { prisma: v("prisma"), dotenv: v("dotenv") } };
  require("fs").writeFileSync(process.argv[1], JSON.stringify(pkg, null, 2));
' "$work/migrate/package.json"
cp -r deploy/server "$work/server"
tar -czf "$work.tar.gz" -C "$work" .

echo "== EC2 へ転送（$ec2_dns）"
ssh "${ssh_opts[@]}" "$host" "rm -rf $remote && mkdir -p $remote"
scp "${ssh_opts[@]}" -q "$work.tar.gz" "$host:$remote/release.tar.gz"
rm -rf "$work" "$work.tar.gz"

echo "== サーバーの設定・マイグレーション・入れ替え・再起動"
ssh "${ssh_opts[@]}" "$host" "sudo bash -s" <<EOF
set -euo pipefail
cd $remote
tar -xzf release.tar.gz
bash server/setup.sh '$db_host' '$db_secret_arn' >/dev/null

echo "マイグレーションを当てます"
rm -rf /opt/events/migrate/prisma
cp -r migrate/. /opt/events/migrate/
cd /opt/events/migrate
npm install --omit=dev --no-audit --no-fund --loglevel=error
/opt/events/bin/db-secret.sh write
DATABASE_URL=\$(sed -n 's/^MIGRATE_DATABASE_URL=//p' /run/events/env) npx prisma migrate deploy
cd $remote

# 新しい JS・CSS を足す（前のデプロイの分は消さない。nginx.conf を参照）
cp -r static/. /opt/events/static/
# アプリは別のフォルダに置いてから入れ替える（途中の状態を見せない）
rm -rf /opt/events/app.new /opt/events/app.old
cp -r app /opt/events/app.new
# Next.js が .next/cache に書き込むので、アプリはサーバーのユーザーのものにする
chown -R events:events /opt/events/app.new
if [[ -d /opt/events/app ]]; then mv /opt/events/app /opt/events/app.old; fi
mv /opt/events/app.new /opt/events/app
rm -rf /opt/events/app.old
echo '$commit' >/opt/events/COMMIT

systemctl restart events
for i in \$(seq 1 30); do
  if curl -sf http://127.0.0.1:3000/api/health >/dev/null; then
    echo "サーバーが起動しました"
    rm -rf $remote
    exit 0
  fi
  sleep 2
done
echo "サーバーが 1 分以内に起動しませんでした。ログ（journalctl -u events）:" >&2
journalctl -u events -n 50 --no-pager >&2
exit 1
EOF

echo "== 公開 URL で確認（$url）"
health=$(curl -sf "$url/api/health") || {
  echo "公開 URL からサーバーに届きません" >&2
  exit 1
}
page=$(curl -s -o /dev/null -w "%{http_code}" "$url/")
echo "/api/health: $health"
echo "画面: $page"
if [[ "$page" != 200 ]]; then
  echo "画面が開けません" >&2
  exit 1
fi
echo "== 完了: $url（$commit）"
