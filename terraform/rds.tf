# ── Subnet group (uses public subnets so publicly_accessible=true works) ─
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnet-group"
  subnet_ids = aws_subnet.public[*].id

  tags = { Name = "${var.project}-db-subnet-group" }
}

# ── RDS instance ──────────────────────────────────────────────────
resource "aws_db_instance" "main" {
  identifier     = "${var.project}-postgres"
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.db_instance_class

  # Default database created on init — legacy monolith uses this
  db_name  = "amcart"
  username = var.db_username
  password = var.db_password

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Publicly accessible so the postgresql provider (running locally) can
  # create the amcart_auth and amcart_products databases during terraform apply.
  # The RDS security group restricts this to your IP only.
  publicly_accessible = true

  backup_retention_period = 0
  deletion_protection     = false
  skip_final_snapshot     = true
  apply_immediately       = true

  tags = { Name = "${var.project}-postgres" }
}

# ── Extra databases for microservices ─────────────────────────────
# The postgresql provider creates these after RDS is ready.
# auth-service connects to amcart_auth
resource "postgresql_database" "auth" {
  name       = "amcart_auth"
  depends_on = [aws_db_instance.main]
}

# product-service and search-service both connect to amcart_products
resource "postgresql_database" "products" {
  name       = "amcart_products"
  depends_on = [aws_db_instance.main]
}
