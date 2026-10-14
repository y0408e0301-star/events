#!/bin/bash
# EC2 で nginx と Next.js（systemd）を動かす準備をする。何度実行してもよい
# このフォルダ（deploy/server）を EC2 にコピーし、root で実行する
#
#   sudo bash setup.sh <DB_HOST> <DB_SECRET_ARN>
#
# DB_HOST・DB_SECRET_ARN は deploy/terraform の terraform output db_endpoint・db_secret_arn
# アプリはここでは置かない（deploy.sh が /opt/events/app/ に置く）
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "使い方: sudo bash $0 <DB_HOST> <DB_SECRET_ARN>" >&2
  exit 2
fi

cd "$(dirname "$0")"

# Node.js 24（開発・CI と同じ）、nginx、シークレットの JSON を読む jq
dnf install -y nodejs24 nginx jq
# nodejs24 は node-24 という名前で入るので、node でも呼べるようにする（events.service が /usr/bin/node を使う）
if [[ ! -e /usr/bin/node ]]; then
  ln -s "$(command -v node-24)" /usr/bin/node
fi
node --version

# サーバーを動かすユーザー（ログインはできない）
id events &>/dev/null || useradd --system --no-create-home --shell /sbin/nologin events

install -d -m 755 /opt/events /opt/events/bin /opt/events/static /opt/events/migrate
install -m 755 db-secret.sh /opt/events/bin/db-secret.sh

# RDS のサーバー証明書を確かめるための CA（全リージョン分）。AWS が更新するので毎回取り直す
curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /opt/events/rds-ca.pem.new
mv /opt/events/rds-ca.pem.new /opt/events/rds-ca.pem
chmod 644 /opt/events/rds-ca.pem

install -d -m 755 /etc/events
cat >/etc/events/events.conf <<EOF
DB_HOST=$1
DB_SECRET_ARN=$2
EOF
chmod 644 /etc/events/events.conf

install -m 644 nginx.conf /etc/nginx/conf.d/events.conf
install -m 644 events.service events-db-secret-check.service events-db-secret-check.timer /etc/systemd/system/
systemctl daemon-reload

nginx -t
systemctl enable --now nginx
systemctl reload nginx
systemctl enable --now events-db-secret-check.timer
# アプリを置いてから systemctl restart events で起動する。ここでは EC2 の起動時に自動で起動する設定だけにする
systemctl enable events
