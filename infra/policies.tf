# Pending fanout >= 5 (5m)
resource "google_monitoring_alert_policy" "pending_fanout" {
  display_name = "[VIBE] Pending fanout ≥ 5 (5m)"
  combiner     = "OR"
  documentation { content = "outbox 생성 후 5분 이내 ACK가 없는 건수가 5개 이상입니다. n8n / fanoutAck / 네트워크 확인." }

  conditions {
    display_name = "pending_fanout >= 5"
    condition_monitoring_query_language {
      query = <<-EOT
        fetch global
        | metric 'custom.googleapis.com/vibe/pending_fanout'
        | group_by 5m, [value_pending_fanout_mean: mean(value.pending_fanout)]
        | condition gt(value_pending_fanout_mean, 5)
      EOT
    }
  }

  notification_channels = compact([
    google_monitoring_notification_channel.slack_webhook.id,
    (var.email_address == "" ? null : google_monitoring_notification_channel.email[0].id)
  ])

  alert_strategy {
    auto_close                 = "3600s"
    notification_rate_limit { period = "300s" }
  }

  enabled = true
}

# Fanout FCM failures >= 1 (10m, 2x)
resource "google_monitoring_alert_policy" "failed_fcm" {
  display_name = "[VIBE] Fanout FCM failures detected (>=1, 10m, 2x)"
  combiner     = "OR"
  documentation { content = "최근 10분 동안 FCM 팬아웃 실패가 연속 감지되었습니다. sendFcm/FCM 키/토큰 점검." }

  conditions {
    display_name = "failed_fcm >= 1 (2x)"
    condition_monitoring_query_language {
      query = <<-EOT
        fetch global
        | metric 'custom.googleapis.com/vibe/fanout_failed_fcm'
        | group_by 5m, [sum_fails: sum(value.fanout_failed_fcm)]
        | condition gt(sum_fails, 0, 2)
      EOT
    }
  }

  notification_channels = compact([
    google_monitoring_notification_channel.slack_webhook.id,
    (var.email_address == "" ? null : google_monitoring_notification_channel.email[0].id)
  ])

  alert_strategy {
    auto_close                 = "3600s"
    notification_rate_limit { period = "600s" }
  }

  enabled = true
}
