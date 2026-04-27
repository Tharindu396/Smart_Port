# ─── RDS PostgreSQL ──────────────────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name       = "smartport-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "smartport-db-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier        = "smartport-postgres"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = false   # set true for production HA
  publicly_accessible    = false
  skip_final_snapshot    = false
  final_snapshot_identifier = "smartport-postgres-final-snapshot"
  deletion_protection    = true

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  tags = { Name = "smartport-postgres" }
}

# ─── MSK (Managed Kafka) ─────────────────────────────────────────────────────
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "smartport-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 2

  broker_node_group_info {
    instance_type  = "kafka.t3.small"
    client_subnets = aws_subnet.private[*].id

    storage_info {
      ebs_storage_info {
        volume_size = 20
      }
    }

    security_groups = [aws_security_group.ecs.id]
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS_PLAINTEXT"
      in_cluster    = true
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.main.arn
    revision = aws_msk_configuration.main.latest_revision
  }

  tags = { Name = "smartport-kafka" }
}

resource "aws_msk_configuration" "main" {
  kafka_versions = ["3.5.1"]
  name           = "smartport-kafka-config"

  server_properties = <<-PROPS
    auto.create.topics.enable=true
    default.replication.factor=1
    min.insync.replicas=1
    num.partitions=3
    log.retention.hours=168
  PROPS
}
