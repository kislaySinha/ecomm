output "alb_dns" {
  description = "ALB DNS name — use as VITE_API_URL when building the frontend"
  value       = "http://${aws_lb.main.dns_name}"
}

output "cloudfront_url" {
  description = "CloudFront URL for the React frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket to upload the React build to"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "Used to invalidate CloudFront cache after frontend deploy"
  value       = aws_cloudfront_distribution.frontend.id
}

output "rds_endpoint" {
  description = "RDS host (for manual DB admin)"
  value       = aws_db_instance.main.address
}

output "ecr_urls" {
  description = "ECR repository URLs — docker tag + push to these"
  value = {
    for k, v in aws_ecr_repository.services : k => v.repository_url
  }
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "aws_region" {
  value = var.aws_region
}
