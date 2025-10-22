# Cloud Monitoring 알림 채널 생성 스크립트 (PowerShell)

param(
    [string]$ProjectId = ""
)

Write-Host "🔔 Cloud Monitoring 알림 채널 생성 시작..." -ForegroundColor Green

# 프로젝트 ID 확인
if ([string]::IsNullOrEmpty($ProjectId)) {
    $ProjectId = firebase use --current
    if ([string]::IsNullOrEmpty($ProjectId)) {
        Write-Host "❌ 프로젝트 ID를 제공하세요: .\create_notification_channels.ps1 -ProjectId <PROJECT_ID>" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📋 프로젝트: $ProjectId" -ForegroundColor Cyan

# 액세스 토큰 획득
Write-Host "🔑 액세스 토큰 획득 중..." -ForegroundColor Yellow
$AccessToken = gcloud auth print-access-token
if ([string]::IsNullOrEmpty($AccessToken)) {
    Write-Host "❌ gcloud 인증이 필요합니다: gcloud auth login" -ForegroundColor Red
    exit 1
}

# Functions URL 생성
$FunctionsUrl = "https://asia-northeast3-$ProjectId.cloudfunctions.net/monitoringToSlack"
Write-Host "🔗 Functions URL: $FunctionsUrl" -ForegroundColor Cyan

# 1. Slack 웹훅 채널 생성
Write-Host "📱 Slack 웹훅 채널 생성 중..." -ForegroundColor Yellow

# channel_webhook.json의 URL을 실제 Functions URL로 치환
$WebhookJson = Get-Content "channel_webhook.json" -Raw
$WebhookJson = $WebhookJson -replace "<PROJECT_ID>", $ProjectId
$WebhookJson | Out-File "channel_webhook_temp.json" -Encoding UTF8

$SlackResponse = Invoke-RestMethod -Uri "https://monitoring.googleapis.com/v3/projects/$ProjectId/notificationChannels" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $AccessToken"
        "Content-Type" = "application/json"
    } `
    -Body $WebhookJson

$SlackResponse | ConvertTo-Json -Depth 10 | Out-File "slack_channel.json" -Encoding UTF8

# 생성된 Slack 채널 ID 확인
$SlackChannelId = $SlackResponse.name
if ($SlackChannelId) {
    Write-Host "✅ Slack 채널 생성 완료: $SlackChannelId" -ForegroundColor Green
} else {
    Write-Host "❌ Slack 채널 생성 실패" -ForegroundColor Red
    $SlackResponse | ConvertTo-Json
}

# 2. 이메일 채널 생성 (선택사항)
Write-Host "📧 이메일 채널 생성 중..." -ForegroundColor Yellow

$EmailJson = Get-Content "channel_email.json" -Raw
$EmailResponse = Invoke-RestMethod -Uri "https://monitoring.googleapis.com/v3/projects/$ProjectId/notificationChannels" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $AccessToken"
        "Content-Type" = "application/json"
    } `
    -Body $EmailJson

$EmailResponse | ConvertTo-Json -Depth 10 | Out-File "email_channel.json" -Encoding UTF8

# 생성된 이메일 채널 ID 확인
$EmailChannelId = $EmailResponse.name
if ($EmailChannelId) {
    Write-Host "✅ 이메일 채널 생성 완료: $EmailChannelId" -ForegroundColor Green
} else {
    Write-Host "❌ 이메일 채널 생성 실패" -ForegroundColor Red
    $EmailResponse | ConvertTo-Json
}

# 3. 정책 JSON 파일 업데이트
Write-Host "📝 정책 JSON 파일 업데이트 중..." -ForegroundColor Yellow

if ($SlackChannelId) {
    # Slack 채널 ID로 정책 파일 업데이트
    $PendingPolicy = Get-Content "policy_pending_fanout.json" -Raw
    $PendingPolicy = $PendingPolicy -replace '\$\{NOTIF_CHANNEL_ID\}', $SlackChannelId
    $PendingPolicy | Out-File "policy_pending_fanout_updated.json" -Encoding UTF8

    $FailedPolicy = Get-Content "policy_fanout_failed_fcm.json" -Raw
    $FailedPolicy = $FailedPolicy -replace '\$\{NOTIF_CHANNEL_ID\}', $SlackChannelId
    $FailedPolicy | Out-File "policy_fanout_failed_fcm_updated.json" -Encoding UTF8

    Write-Host "✅ 정책 파일 업데이트 완료:" -ForegroundColor Green
    Write-Host "   - policy_pending_fanout_updated.json" -ForegroundColor Cyan
    Write-Host "   - policy_fanout_failed_fcm_updated.json" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "🚀 다음 명령어로 정책을 생성하세요:" -ForegroundColor Yellow
    Write-Host "gcloud monitoring policies create --policy-from-file=policy_pending_fanout_updated.json" -ForegroundColor White
    Write-Host "gcloud monitoring policies create --policy-from-file=policy_fanout_failed_fcm_updated.json" -ForegroundColor White
}

# 4. 환경변수 설정 안내
Write-Host ""
Write-Host "🔧 Functions 환경변수 설정 안내:" -ForegroundColor Yellow
Write-Host "다음 명령어로 SLACK_WEBHOOK_URL을 설정하세요:" -ForegroundColor White
Write-Host "firebase functions:secrets:set SLACK_WEBHOOK_URL" -ForegroundColor White
Write-Host ""
Write-Host "Slack Incoming Webhook URL 형식:" -ForegroundColor White
Write-Host "https://hooks.slack.com/services/XXXX/YYYY/ZZZZ" -ForegroundColor White

# 정리
Remove-Item "channel_webhook_temp.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ 알림 채널 생성 완료!" -ForegroundColor Green
Write-Host "📋 생성된 채널:" -ForegroundColor Cyan
Write-Host "   - Slack: $SlackChannelId" -ForegroundColor White
Write-Host "   - Email: $EmailChannelId" -ForegroundColor White
