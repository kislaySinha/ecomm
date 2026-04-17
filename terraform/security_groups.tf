locals {
  # Auto-detect current machine's public IP if rds_allowed_cidr not set
  rds_admin_cidr = var.rds_allowed_cidr != null ? var.rds_allowed_cidr : "${chomp(data.http.my_ip.response_body)}/32"
}

# ── ALB ───────────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "${var.project}-alb-sg"
  description = "Allow HTTP from anywhere"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-alb-sg" }
}

# ── ECS Tasks ─────────────────────────────────────────────────────
resource "aws_security_group" "ecs" {
  name        = "${var.project}-ecs-sg"
  description = "Allow inbound from ALB on service ports"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8000
    to_port         = 8004
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "ALB to microservices"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow outbound (ECR pull, RDS, CloudWatch)"
  }

  tags = { Name = "${var.project}-ecs-sg" }
}

# ── RDS ───────────────────────────────────────────────────────────
resource "aws_security_group" "rds" {
  name        = "${var.project}-rds-sg"
  description = "PostgreSQL access from ECS tasks and admin IP"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
    description     = "ECS microservice tasks"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.rds_admin_cidr]
    description = "Admin / Terraform postgresql provider"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-rds-sg" }
}
