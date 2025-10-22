variable "project_id" {
  type        = string
  description = "GCP 프로젝트 ID"
}

variable "region" {
  type        = string
  default     = "asia-northeast3"
  description = "GCP 리전"
}

variable "monitoring_relay_url" {
  type        = string
  description = "Functions monitoringToSlack 퍼블릭 URL"
}

variable "email_address" {
  type        = string
  default     = ""
  description = "이메일 알림 주소 (선택사항)"
}
