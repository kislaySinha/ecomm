variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name — used as prefix for all resource names"
  type        = string
  default     = "amcart"
}

variable "environment" {
  description = "Environment label"
  type        = string
  default     = "prod"
}

# ── Database ──────────────────────────────────────────────────────
variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "amcart_admin"
}

variable "db_password" {
  description = "RDS master password (min 8 chars, no special chars that break connection strings)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# ── Auth ──────────────────────────────────────────────────────────
variable "jwt_secret_key" {
  description = "JWT secret shared across all microservices"
  type        = string
  sensitive   = true
  default     = "amcart-secret-key-change-in-production"
}

# ── ECS ───────────────────────────────────────────────────────────
variable "task_cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate task memory in MB"
  type        = number
  default     = 512
}

variable "service_desired_count" {
  description = "Number of ECS tasks per service"
  type        = number
  default     = 1
}

# ── Networking ────────────────────────────────────────────────────
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "rds_allowed_cidr" {
  description = "Extra CIDR allowed to connect to RDS on port 5432 (in addition to ECS tasks). Leave null to auto-detect this machine's current public IP."
  type        = string
  default     = null
}
