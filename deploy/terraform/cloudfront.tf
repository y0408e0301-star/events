# 公開用の URL（CloudFront）。ブラウザからは HTTPS で受け、EC2 の 80 番（nginx）へ HTTP で渡す
# 証明書は CloudFront の既定のもの（*.cloudfront.net）を使う

# AWS が用意しているキャッシュ・転送の設定
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

# Host 以外のヘッダー・クエリ文字列・Cookie をすべて EC2 へ渡す
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_distribution" "events" {
  enabled         = true
  comment         = "events"
  is_ipv6_enabled = true
  # 日本を含む中で一番安い価格帯
  price_class = "PriceClass_200"

  origin {
    origin_id   = "ec2"
    domain_name = aws_eip.events.public_dns

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # ビルドで作られる JS・CSS。ファイル名に中身のハッシュが入っているのでキャッシュする
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = "ec2"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
    compress               = true
  }

  # 画面（DB の中身を表示する）と API はキャッシュしない。すべてのメソッド、クエリ文字列（絞り込みの条件）、
  # Next.js の画面遷移に使うヘッダーをそのまま EC2 へ渡す
  default_cache_behavior {
    target_origin_id         = "ec2"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    compress                 = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
