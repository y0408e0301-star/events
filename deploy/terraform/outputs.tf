output "instance_id" {
  description = "EC2 の ID（deploy/start.sh・stop.sh が使う）"
  value       = aws_instance.events.id
}

output "public_ip" {
  value = aws_eip.events.public_ip
}

output "public_dns" {
  description = "CloudFront の接続先。deploy.sh はここへ SSH する"
  value       = aws_eip.events.public_dns
}

output "url" {
  description = "公開 URL（CloudFront）"
  value       = "https://${aws_cloudfront_distribution.events.domain_name}"
}

output "db_endpoint" {
  description = "RDS の接続先（EC2 からだけ届く）"
  value       = aws_db_instance.events.address
}

output "db_instance_id" {
  description = "RDS の識別子（deploy/start.sh・stop.sh が使う）"
  value       = aws_db_instance.events.identifier
}

output "db_secret_arn" {
  description = "DB のユーザー名とパスワードが入ったシークレット"
  value       = aws_db_instance.events.master_user_secret[0].secret_arn
}

output "ssh_command" {
  value = "ssh -i ${local_sensitive_file.ssh_private_key.filename} ec2-user@${aws_eip.events.public_dns}"
}
