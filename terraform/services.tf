# ─── ECS Task Definitions & Services ─────────────────────────────────────────
#
# Each microservice is deployed as a separate ECS Fargate task + service,
# registered behind its own ALB target group.
# ─────────────────────────────────────────────────────────────────────────────

locals {
  ecr_base = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"

  # Shared environment variables available to all services
  common_env = [
    { name = "DB_HOST",     value = aws_db_instance.postgres.address },
    { name = "DB_PORT",     value = "5432" },
    { name = "DB_USER",     value = var.db_username },
    { name = "DB_NAME",     value = var.db_name },
    { name = "DB_SSLMODE",  value = "require" },
    { name = "REDIS_ADDR",  value = "${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379" },
    { name = "KAFKA_BROKERS", value = aws_msk_cluster.kafka.bootstrap_brokers },
    { name = "NODE_ENV",    value = "production" },
  ]
}

# ─── notification-service ─────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "notification_service" {
  family                   = "smartport-notification-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "notification-service"
    image     = "${local.ecr_base}/smartport/notification-service:${var.image_tag}"
    essential = true

    portMappings = [{ containerPort = 3004, protocol = "tcp" }]

    environment = concat(local.common_env, [
      { name = "PORT",           value = "3004" },
      { name = "KAFKA_GROUP_ID", value = "notification-service" },
      { name = "SMTP_HOST",      value = "smtp.gmail.com" },
      { name = "SMTP_PORT",      value = "587" },
      { name = "SMTP_SECURE",    value = "false" },
    ])

    secrets = [
      { name = "DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password::" },
      { name = "SMTP_USER",   valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:smtp_user::" },
      { name = "SMTP_PASS",   valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:smtp_pass::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/smartport/notification-service"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:3004/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 15
    }
  }])

  tags = { Name = "smartport-notification-service" }
}

resource "aws_ecs_service" "notification_service" {
  name            = "smartport-notification-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.notification_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services["notification-service"].arn
    container_name   = "notification-service"
    container_port   = 3004
  }

  depends_on = [aws_lb_listener.https]
  tags       = { Name = "smartport-notification-service" }
}

# ─── vessel-tracking-service ──────────────────────────────────────────────────
resource "aws_ecs_task_definition" "vessel_tracking_service" {
  family                   = "smartport-vessel-tracking-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "vessel-tracking-service"
    image     = "${local.ecr_base}/smartport/vessel-tracking-service:${var.image_tag}"
    essential = true

    portMappings = [{ containerPort = 8001, protocol = "tcp" }]

    environment = concat(local.common_env, [
      { name = "PORT",         value = "8001" },
      { name = "FRONTEND_URL", value = "https://${var.domain_name}" },
    ])

    secrets = [
      { name = "DB_PASSWORD",  valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password::" },
      { name = "AIS_API_KEY",  valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:ais_api_key::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/smartport/vessel-tracking-service"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "smartport-vessel-tracking-service" }
}

resource "aws_ecs_service" "vessel_tracking_service" {
  name            = "smartport-vessel-tracking-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.vessel_tracking_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services["vessel-tracking-service"].arn
    container_name   = "vessel-tracking-service"
    container_port   = 8001
  }

  depends_on = [aws_lb_listener.https]
  tags       = { Name = "smartport-vessel-tracking-service" }
}

# ─── berthing-service ─────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "berthing_service" {
  family                   = "smartport-berthing-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "berthing-service"
    image     = "${local.ecr_base}/smartport/berthing-service:${var.image_tag}"
    essential = true

    portMappings = [{ containerPort = 8002, protocol = "tcp" }]

    environment = concat(local.common_env, [
      { name = "PORT",         value = "8002" },
      { name = "FRONTEND_URL", value = "https://${var.domain_name}" },
    ])

    secrets = [
      { name = "DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/smartport/berthing-service"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "smartport-berthing-service" }
}

resource "aws_ecs_service" "berthing_service" {
  name            = "smartport-berthing-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.berthing_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services["berthing-service"].arn
    container_name   = "berthing-service"
    container_port   = 8002
  }

  depends_on = [aws_lb_listener.https]
  tags       = { Name = "smartport-berthing-service" }
}

# ─── invoice-service ──────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "invoice_service" {
  family                   = "smartport-invoice-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "invoice-service"
    image     = "${local.ecr_base}/smartport/invoice-service:${var.image_tag}"
    essential = true

    portMappings = [{ containerPort = 3001, protocol = "tcp" }]

    environment = concat(local.common_env, [
      { name = "PORT",             value = "3001" },
      { name = "KAFKA_GROUP_ID",   value = "invoice-service" },
    ])

    secrets = [
      { name = "DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/smartport/invoice-service"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "smartport-invoice-service" }
}

resource "aws_ecs_service" "invoice_service" {
  name            = "smartport-invoice-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.invoice_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services["invoice-service"].arn
    container_name   = "invoice-service"
    container_port   = 3001
  }

  depends_on = [aws_lb_listener.https]
  tags       = { Name = "smartport-invoice-service" }
}

# ─── logistics-service ────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "logistics_service" {
  family                   = "smartport-logistics-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "logistics-service"
    image     = "${local.ecr_base}/smartport/logistics-service:${var.image_tag}"
    essential = true

    portMappings = [{ containerPort = 3002, protocol = "tcp" }]

    environment = concat(local.common_env, [
      { name = "PORT", value = "3002" },
    ])

    secrets = [
      { name = "DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/smartport/logistics-service"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "smartport-logistics-service" }
}

resource "aws_ecs_service" "logistics_service" {
  name            = "smartport-logistics-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.logistics_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services["logistics-service"].arn
    container_name   = "logistics-service"
    container_port   = 3002
  }

  depends_on = [aws_lb_listener.https]
  tags       = { Name = "smartport-logistics-service" }
}

# ─── nest-services ────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "nest_services" {
  family                   = "smartport-nest-services"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "nest-services"
    image     = "${local.ecr_base}/smartport/nest-services:${var.image_tag}"
    essential = true

    portMappings = [{ containerPort = 3003, protocol = "tcp" }]

    environment = concat(local.common_env, [
      { name = "PORT", value = "3003" },
    ])

    secrets = [
      { name = "DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/smartport/nest-services"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "smartport-nest-services" }
}

resource "aws_ecs_service" "nest_services" {
  name            = "smartport-nest-services"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.nest_services.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services["nest-services"].arn
    container_name   = "nest-services"
    container_port   = 3003
  }

  depends_on = [aws_lb_listener.https]
  tags       = { Name = "smartport-nest-services" }
}

# ─── frontend ─────────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "frontend" {
  family                   = "smartport-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = "${local.ecr_base}/smartport/frontend:${var.image_tag}"
    essential = true

    portMappings = [{ containerPort = 3000, protocol = "tcp" }]

    environment = [
      { name = "NODE_ENV",              value = "production" },
      { name = "NEXT_PUBLIC_API_URL",   value = "https://${var.domain_name}" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/smartport/frontend"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "smartport-frontend" }
}

resource "aws_ecs_service" "frontend" {
  name            = "smartport-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services["frontend"].arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https]
  tags       = { Name = "smartport-frontend" }
}

# ─── Secrets Manager ──────────────────────────────────────────────────────────
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "smartport/app-secrets"
  description             = "SmartPort application secrets"
  recovery_window_in_days = 7

  tags = { Name = "smartport-app-secrets" }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    db_password = var.db_password
    smtp_pass   = var.smtp_pass
    ais_api_key = var.ais_api_key
    smtp_user   = "noreply@${var.domain_name}"
  })
}
