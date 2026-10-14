# 毎日 5:00（日本時間）に EC2 と RDS を止める（EventBridge Scheduler）
# 公開環境は見せるときだけ deploy/start.sh で起動する。止め忘れと、RDS が停止して 7 日たつと自動で起動することへの対策

resource "aws_iam_role" "scheduler" {
  name = "events-scheduler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# 止める権限だけ。対象は events の EC2 と RDS に限る
resource "aws_iam_role_policy" "scheduler_stop" {
  name = "stop-events"
  role = aws_iam_role.scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ec2:StopInstances"
        Resource = aws_instance.events.arn
      },
      {
        Effect   = "Allow"
        Action   = "rds:StopDBInstance"
        Resource = aws_db_instance.events.arn
      },
    ]
  })
}

resource "aws_scheduler_schedule" "stop_ec2" {
  name                         = "events-stop-ec2"
  schedule_expression          = "cron(0 5 * * ? *)"
  schedule_expression_timezone = "Asia/Tokyo"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:ec2:stopInstances"
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ InstanceIds = [aws_instance.events.id] })

    # 止まっているときも成功するので、やり直しは要らない
    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}

resource "aws_scheduler_schedule" "stop_rds" {
  name                         = "events-stop-rds"
  schedule_expression          = "cron(0 5 * * ? *)"
  schedule_expression_timezone = "Asia/Tokyo"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:rds:stopDBInstance"
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ DbInstanceIdentifier = aws_db_instance.events.identifier })

    # すでに止まっているときはエラーになるが、止まっているので問題ない。やり直しはしない
    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}
