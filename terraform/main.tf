# ─── Terraform Backend & Provider ────────────────────────────────────────────
terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }

  # Remote state in S3 + DynamoDB locking
  backend "s3" {
    bucket         = "smartport-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "smartport-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "SmartPort"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
