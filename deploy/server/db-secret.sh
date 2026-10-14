#!/bin/bash
# DB の接続情報を Secrets Manager（RDS が作ったシークレット）から読み、Next.js とマイグレーションに渡す
# EC2 の /opt/events/bin/db-secret.sh に置き、root で実行する
#
#   db-secret.sh write   /run/events/env に DATABASE_URL・MIGRATE_DATABASE_URL を書く（events.service の起動前）
#   db-secret.sh check   パスワードが変わっていたらサーバーを再起動する（events-db-secret-check.timer）
#
# 接続先は /etc/events/events.conf（setup.sh が作る）の DB_HOST と DB_SECRET_ARN
set -euo pipefail

source /etc/events/events.conf

env_file=/run/events/env
# ARN（arn:aws:secretsmanager:<リージョン>:...）からリージョンを取り出す
region=$(cut -d: -f4 <<<"$DB_SECRET_ARN")

secret=$(aws secretsmanager get-secret-value --region "$region" --secret-id "$DB_SECRET_ARN" \
  --query SecretString --output text)
# パスワードに記号が入っても URL が壊れないよう、エンコードしておく
username=$(jq -r '.username | @uri' <<<"$secret")
password=$(jq -r '.password | @uri' <<<"$secret")
base="mysql://${username}:${password}@${DB_HOST}:3306/events"

case "${1:-}" in
  write)
    mkdir -p "$(dirname "$env_file")"
    # パスワードを含むので root だけが読めるようにする（systemd が root のうちに読んで Next.js に渡す）
    umask 077
    cat >"$env_file" <<EOF
# Next.js（Prisma の MariaDB ドライバー）。TLS で接続し、証明書は NODE_EXTRA_CA_CERTS の RDS の CA で確かめる
DATABASE_URL=${base}?ssl=true
# prisma migrate deploy（deploy.sh）。TLS で接続し、証明書を RDS の CA で確かめる
MIGRATE_DATABASE_URL=${base}?sslaccept=strict&sslcert=/opt/events/rds-ca.pem
EOF
    ;;
  check)
    if ! systemctl is-active --quiet events; then
      exit 0
    fi
    if ! grep -qF ":${password}@" "$env_file"; then
      echo "DB のパスワードが変わったのでサーバーを再起動する"
      systemctl restart events
    fi
    ;;
  *)
    echo "使い方: $0 write|check" >&2
    exit 2
    ;;
esac
