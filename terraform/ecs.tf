# ── ECS Cluster ───────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ── CloudWatch Log Groups (7-day retention to control cost) ───────
resource "aws_cloudwatch_log_group" "auth" {
  name              = "/ecs/${var.project}/auth-service"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "product" {
  name              = "/ecs/${var.project}/product-service"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "search" {
  name              = "/ecs/${var.project}/search-service"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "legacy" {
  name              = "/ecs/${var.project}/legacy-app"
  retention_in_days = 7
}

# ── Helper: common log config ─────────────────────────────────────
locals {
  common_env_vars = [
    { name = "ALGORITHM",                   value = "HS256" },
    { name = "ACCESS_TOKEN_EXPIRE_MINUTES", value = "60"   },
  ]

  common_secrets = [
    { name = "SECRET_KEY", valueFrom = aws_ssm_parameter.jwt_secret.arn }
  ]
}

# ── Auth Service ──────────────────────────────────────────────────
resource "aws_ecs_task_definition" "auth" {
  family                   = "${var.project}-auth"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "auth-service"
    image     = "${aws_ecr_repository.services["auth-service"].repository_url}:latest"
    essential = true

    portMappings = [{ containerPort = 8001, protocol = "tcp" }]

    environment = local.common_env_vars
    secrets = concat(local.common_secrets, [
      { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.db_url_auth.arn }
    ])

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.auth.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "auth" {
  name            = "${var.project}-auth"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.auth.arn
  desired_count   = var.service_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.auth.arn
    container_name   = "auth-service"
    container_port   = 8001
  }

  deployment_circuit_breaker {
    enable   = false
    rollback = false
  }

  depends_on = [aws_lb_listener_rule.auth]
}

# ── Product Service ───────────────────────────────────────────────
resource "aws_ecs_task_definition" "product" {
  family                   = "${var.project}-product"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "product-service"
    image     = "${aws_ecr_repository.services["product-service"].repository_url}:latest"
    essential = true

    portMappings = [{ containerPort = 8002, protocol = "tcp" }]

    environment = local.common_env_vars
    secrets = concat(local.common_secrets, [
      { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.db_url_products.arn }
    ])

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.product.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "product" {
  name            = "${var.project}-product"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.product.arn
  desired_count   = var.service_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.product.arn
    container_name   = "product-service"
    container_port   = 8002
  }

  deployment_circuit_breaker {
    enable   = false
    rollback = false
  }

  depends_on = [aws_lb_listener_rule.products]
}

# ── Search Service ────────────────────────────────────────────────
resource "aws_ecs_task_definition" "search" {
  family                   = "${var.project}-search"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "search-service"
    image     = "${aws_ecr_repository.services["search-service"].repository_url}:latest"
    essential = true

    portMappings = [{ containerPort = 8003, protocol = "tcp" }]

    environment = local.common_env_vars
    secrets = concat(local.common_secrets, [
      # Search service reads from amcart_products (same DB as product-service)
      { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.db_url_products.arn }
    ])

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.search.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "search" {
  name            = "${var.project}-search"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.search.arn
  desired_count   = var.service_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.search.arn
    container_name   = "search-service"
    container_port   = 8003
  }

  deployment_circuit_breaker {
    enable   = false
    rollback = false
  }

  depends_on = [aws_lb_listener_rule.search]
}

# ── Legacy App (cart, orders, wishlist, reviews, payment) ─────────
resource "aws_ecs_task_definition" "legacy" {
  family                   = "${var.project}-legacy"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "legacy-app"
    image     = "${aws_ecr_repository.services["legacy-app"].repository_url}:latest"
    essential = true

    portMappings = [{ containerPort = 8000, protocol = "tcp" }]

    environment = local.common_env_vars
    secrets = concat(local.common_secrets, [
      { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.db_url_legacy.arn }
    ])

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.legacy.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "legacy" {
  name            = "${var.project}-legacy"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.legacy.arn
  desired_count   = var.service_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.legacy.arn
    container_name   = "legacy-app"
    container_port   = 8000
  }

  deployment_circuit_breaker {
    enable   = false
    rollback = false
  }

  depends_on = [aws_lb_listener.http]
}
