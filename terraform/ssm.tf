# Secrets stored in SSM Parameter Store (SecureString).
# ECS task definitions reference these by ARN — values never appear
# in plaintext in the AWS console or task definition JSON.

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project}/jwt_secret_key"
  type  = "SecureString"
  value = var.jwt_secret_key
}

# Full DATABASE_URL per service — built from RDS address at apply time
resource "aws_ssm_parameter" "db_url_auth" {
  name  = "/${var.project}/db_url/auth"
  type  = "SecureString"
  value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/amcart_auth"

  depends_on = [aws_db_instance.main, postgresql_database.auth]
}

resource "aws_ssm_parameter" "db_url_products" {
  name  = "/${var.project}/db_url/products"
  type  = "SecureString"
  value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/amcart_products"

  depends_on = [aws_db_instance.main, postgresql_database.products]
}

resource "aws_ssm_parameter" "db_url_legacy" {
  name  = "/${var.project}/db_url/legacy"
  type  = "SecureString"
  value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/amcart"

  depends_on = [aws_db_instance.main]
}
