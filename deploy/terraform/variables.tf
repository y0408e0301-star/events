variable "region" {
  description = "AWS のリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "instance_type" {
  description = "EC2 のインスタンスタイプ。無料プランの対象（t4g.micro など）から選ぶ"
  type        = string
  default     = "t4g.micro"
}

variable "rds_deletion_protection" {
  description = "RDS の削除保護。true の間は RDS を消す apply（terraform destroy など）が失敗する。後片付けのときだけ false にして apply する"
  type        = bool
  default     = true
}

variable "ssh_cidr" {
  description = "SSH（22 番）を許可する接続元。自分のグローバル IP を /32 で書く（例：terraform.tfvars に ssh_cidr = \"203.0.113.10/32\"）。IP は curl https://checkip.amazonaws.com で調べられる"
  type        = string
}
