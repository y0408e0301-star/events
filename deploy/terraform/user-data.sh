#!/bin/bash
# EC2 の初回起動時に 1 回だけ実行される。進み具合は /var/log/cloud-init-output.log で見られる
# Node.js・nginx などは deploy/server/setup.sh（デプロイのたびに実行）で入れる
set -eux

# メモリ 1 GB を補うスワップ 2 GB
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap defaults 0 0' >> /etc/fstab
