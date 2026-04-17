terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.21"
    }
    http = {
      source  = "hashicorp/http"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Used to create extra databases (amcart_auth, amcart_products) on RDS
provider "postgresql" {
  host            = aws_db_instance.main.address
  port            = 5432
  database        = "postgres"
  username        = var.db_username
  password        = var.db_password
  sslmode         = "require"
  connect_timeout = 15
  superuser       = false
}

# Used to auto-detect your current public IP for RDS access during init
data "http" "my_ip" {
  url = "https://checkip.amazonaws.com"
}
