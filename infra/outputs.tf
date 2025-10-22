output "slack_channel_id" {
  value = google_monitoring_notification_channel.slack_webhook.id
  description = "Slack 웹훅 알림 채널 ID"
}

output "policy_pending_id" {
  value = google_monitoring_alert_policy.pending_fanout.name
  description = "Pending fanout 알림 정책 ID"
}

output "policy_failed_id" {
  value = google_monitoring_alert_policy.failed_fcm.name
  description = "Failed FCM 알림 정책 ID"
}
