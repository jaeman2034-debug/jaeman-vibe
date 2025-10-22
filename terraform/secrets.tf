# Terraform 시크릿 관리
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 변수 정의
variable "project_id" {
  description = "GCP 프로젝트 ID"
  type        = string
}

variable "region" {
  description = "GCP 리전"
  type        = string
  default     = "asia-northeast3"
}

variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Secret Manager 시크릿 정의
resource "google_secret_manager_secret" "slack_bot_token" {
  secret_id = "slack-bot-token-${var.environment}"
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    service     = "slack-approval"
  }
}

resource "google_secret_manager_secret" "slack_signing_secret" {
  secret_id = "slack-signing-secret-${var.environment}"
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    service     = "slack-approval"
  }
}

resource "google_secret_manager_secret" "slack_signing_secret_old" {
  secret_id = "slack-signing-secret-old-${var.environment}"
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    service     = "slack-approval"
  }
}

resource "google_secret_manager_secret" "internal_key" {
  secret_id = "internal-key-${var.environment}"
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    service     = "slack-approval"
  }
}

resource "google_secret_manager_secret" "internal_hmac_secret" {
  secret_id = "internal-hmac-secret-${var.environment}"
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    service     = "slack-approval"
  }
}

resource "google_secret_manager_secret" "n8n_webhook_approved" {
  secret_id = "n8n-webhook-approved-${var.environment}"
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    service     = "slack-approval"
  }
}

resource "google_secret_manager_secret" "n8n_webhook_approved_fo" {
  secret_id = "n8n-webhook-approved-fo-${var.environment}"
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    service     = "slack-approval"
  }
}

resource "google_secret_manager_secret" "sentry_dsn" {
  secret_id = "sentry-dsn-${var.environment}"
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    service     = "slack-approval"
  }
}

resource "google_secret_manager_secret" "bigquery_dataset" {
  secret_id = "bigquery-dataset-${var.environment}"
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    service     = "slack-approval"
  }
}

# Firebase Functions IAM 바인딩
resource "google_project_iam_member" "functions_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${var.project_id}@appspot.gserviceaccount.com"
}

# Cloud Functions 환경변수 설정
resource "google_cloudfunctions2_function" "slack_approval" {
  name     = "slack-approval-${var.environment}"
  location = var.region
  project  = var.project_id

  build_config {
    runtime     = "nodejs18"
    entry_point = "slack"
    source {
      storage_source {
        bucket = "slack-approval-source-${var.environment}"
        object = "functions.zip"
      }
    }
  }

  service_config {
    max_instance_count = 100
    min_instance_count = 0
    available_memory   = "256M"
    timeout_seconds    = 60
    environment_variables = {
      NODE_ENV = var.environment
    }
    secret_environment_variables {
      key     = "SLACK_BOT_TOKEN"
      secret  = google_secret_manager_secret.slack_bot_token.secret_id
      version = "latest"
    }
    secret_environment_variables {
      key     = "SLACK_SIGNING_SECRET"
      secret  = google_secret_manager_secret.slack_signing_secret.secret_id
      version = "latest"
    }
    secret_environment_variables {
      key     = "SLACK_SIGNING_SECRET_OLD"
      secret  = google_secret_manager_secret.slack_signing_secret_old.secret_id
      version = "latest"
    }
    secret_environment_variables {
      key     = "INTERNAL_KEY"
      secret  = google_secret_manager_secret.internal_key.secret_id
      version = "latest"
    }
    secret_environment_variables {
      key     = "INTERNAL_HMAC_SECRET"
      secret  = google_secret_manager_secret.internal_hmac_secret.secret_id
      version = "latest"
    }
    secret_environment_variables {
      key     = "N8N_WEBHOOK_APPROVED"
      secret  = google_secret_manager_secret.n8n_webhook_approved.secret_id
      version = "latest"
    }
    secret_environment_variables {
      key     = "N8N_WEBHOOK_APPROVED_FO"
      secret  = google_secret_manager_secret.n8n_webhook_approved_fo.secret_id
      version = "latest"
    }
    secret_environment_variables {
      key     = "SENTRY_DSN"
      secret  = google_secret_manager_secret.sentry_dsn.secret_id
      version = "latest"
    }
    secret_environment_variables {
      key     = "BIGQUERY_DATASET"
      secret  = google_secret_manager_secret.bigquery_dataset.secret_id
      version = "latest"
    }
  }
}

# 출력값
output "secrets" {
  description = "생성된 시크릿 정보"
  value = {
    slack_bot_token = google_secret_manager_secret.slack_bot_token.secret_id
    slack_signing_secret = google_secret_manager_secret.slack_signing_secret.secret_id
    slack_signing_secret_old = google_secret_manager_secret.slack_signing_secret_old.secret_id
    internal_key = google_secret_manager_secret.internal_key.secret_id
    internal_hmac_secret = google_secret_manager_secret.internal_hmac_secret.secret_id
    n8n_webhook_approved = google_secret_manager_secret.n8n_webhook_approved.secret_id
    n8n_webhook_approved_fo = google_secret_manager_secret.n8n_webhook_approved_fo.secret_id
    sentry_dsn = google_secret_manager_secret.sentry_dsn.secret_id
    bigquery_dataset = google_secret_manager_secret.bigquery_dataset.secret_id
  }
}

output "function_url" {
  description = "Cloud Functions URL"
  value       = google_cloudfunctions2_function.slack_approval.service_config[0].uri
}
