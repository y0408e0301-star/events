#!/bin/bash
# 公開環境（EC2 と RDS）を止める。データは RDS に残る。起動は bash deploy/start.sh
# events フォルダで実行する（Windows では Git Bash）：bash deploy/stop.sh
# 止めても Elastic IP・EBS・RDS のストレージの分はかかる（docs/公開環境.md の「費用」）
set -euo pipefail

cd "$(dirname "$0")/.."

tf=deploy/terraform
instance_id=$(terraform -chdir=$tf output -raw instance_id)
db_id=$(terraform -chdir=$tf output -raw db_instance_id)

echo "== EC2（$instance_id）を止めます"
aws ec2 stop-instances --instance-ids "$instance_id" >/dev/null
aws ec2 wait instance-stopped --instance-ids "$instance_id"
echo "EC2 が止まりました"

db_status=$(aws rds describe-db-instances --db-instance-identifier "$db_id" \
  --query "DBInstances[0].DBInstanceStatus" --output text)
echo "== RDS（$db_id）: $db_status"
if [[ "$db_status" == available ]]; then
  aws rds stop-db-instance --db-instance-identifier "$db_id" >/dev/null
  # 止まりきるまで数分かかるが、待たなくてよい（止める処理は AWS 側で続く）
  echo "RDS を止めています（数分で stopped になります）"
fi
