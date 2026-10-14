# データベース（RDS for MySQL 8.4）。EC2 からだけ接続できる

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_db_subnet_group" "events" {
  name       = "events"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_security_group" "db" {
  name        = "events-db"
  description = "events database"
  vpc_id      = data.aws_vpc.default.id
}

# 3306 番は EC2 のセキュリティグループからだけ受け付ける
resource "aws_vpc_security_group_ingress_rule" "mysql_from_ec2" {
  security_group_id            = aws_security_group.db.id
  description                  = "MySQL from events EC2"
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
  referenced_security_group_id = aws_security_group.web.id
}

resource "aws_db_instance" "events" {
  identifier     = "events-db"
  engine         = "mysql"
  engine_version = "8.4"
  instance_class = "db.t4g.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "events"
  username = "events"
  # パスワードは RDS が作って Secrets Manager に保存する（Terraform にも state にも残らない）
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.events.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  multi_az               = false

  # 自動バックアップは 1 日分（kadai で 7 日にしようとしたら、無料プランの上限を超えるとして拒否された）
  backup_retention_period = 1
  # 課題用なので削除時の最終スナップショットは取らない
  skip_final_snapshot = true
  # 誤って RDS を消す apply（terraform destroy など）を止める。後片付けのときだけ false にする
  deletion_protection = var.rds_deletion_protection
  apply_immediately   = true
}

# EC2 のロールに、DB のパスワード（シークレット）を読む権限を付ける
resource "aws_iam_role_policy" "read_db_secret" {
  name = "read-db-secret"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = aws_db_instance.events.master_user_secret[0].secret_arn
    }]
  })
}
