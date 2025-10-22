terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.30" }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Slack Webhook 알림 채널(Functions 릴레이 URL 사용)
resource "google_monitoring_notification_channel" "slack_webhook" {
  display_name = "Slack via Function (prod)"
  type         = "webhook"
  labels = {
    url = var.monitoring_relay_url
  }
  user_labels = { env = "prod" }
}

# (옵션) 이메일 채널
resource "google_monitoring_notification_channel" "email" {
  count        = var.email_address == "" ? 0 : 1
  display_name = "SRE Alerts (prod)"
  type         = "email"
  labels = {
    email_address = var.email_address
  }
  user_labels = { env = "prod" }
}
