#!/bin/bash
# 止めてある公開環境（RDS と EC2）を起動し、公開 URL で動くまで待つ
# events フォルダで実行する（Windows では Git Bash）：bash deploy/start.sh
# RDS の起動に 5〜10 分かかる。毎日 5:00（日本時間）に自動で止まる（deploy/terraform/scheduler.tf）
set -euo pipefail

cd "$(dirname "$0")/.."

tf=deploy/terraform
instance_id=$(terraform -chdir=$tf output -raw instance_id)
db_id=$(terraform -chdir=$tf output -raw db_instance_id)
url=$(terraform -chdir=$tf output -raw url)

# サーバーは起動時に DB の接続情報を読むので、RDS を先に起動する
db_status=$(aws rds describe-db-instances --db-instance-identifier "$db_id" \
  --query "DBInstances[0].DBInstanceStatus" --output text)
echo "== RDS（$db_id）: $db_status"
if [[ "$db_status" == stopped ]]; then
  aws rds start-db-instance --db-instance-identifier "$db_id" >/dev/null
fi
if [[ "$db_status" != available ]]; then
  echo "起動を待っています（5〜10 分）"
  aws rds wait db-instance-available --db-instance-identifier "$db_id"
fi
echo "RDS が起動しました"

echo "== EC2（$instance_id）"
aws ec2 start-instances --instance-ids "$instance_id" >/dev/null
aws ec2 wait instance-running --instance-ids "$instance_id"
echo "EC2 が起動しました"

echo "== 公開 URL で確認（$url）"
for _ in $(seq 1 60); do
  if [[ "$(curl -s "$url/api/health")" == '{"status":"ok"}' ]]; then
    echo "== 動いています: $url"
    exit 0
  fi
  sleep 5
done
echo "5 分たってもサーバーが応答しません。docs/公開環境.md の「困ったとき」を見てください" >&2
exit 1
