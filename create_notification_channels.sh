#!/bin/bash

# Cloud Monitoring 알림 채널 생성 스크립트

echo "🔔 Cloud Monitoring 알림 채널 생성 시작..."

# 변수 설정
PROJECT_ID=${1:-$(firebase use --current)}
if [ -z "$PROJECT_ID" ]; then
  echo "❌ 프로젝트 ID를 제공하세요: $0 <PROJECT_ID>"
  exit 1
fi

echo "📋 프로젝트: $PROJECT_ID"

# 액세스 토큰 획득
echo "🔑 액세스 토큰 획득 중..."
ACCESS_TOKEN="$(gcloud auth print-access-token)"
if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ gcloud 인증이 필요합니다: gcloud auth login"
  exit 1
fi

# Functions URL 생성
FUNCTIONS_URL="https://asia-northeast3-${PROJECT_ID}.cloudfunctions.net/monitoringToSlack"
echo "🔗 Functions URL: $FUNCTIONS_URL"

# 1. Slack 웹훅 채널 생성
echo "📱 Slack 웹훅 채널 생성 중..."
# channel_webhook.json의 URL을 실제 Functions URL로 치환
sed "s/<PROJECT_ID>/$PROJECT_ID/g" channel_webhook.json > channel_webhook_temp.json

curl -sS -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/notificationChannels" \
  -d @channel_webhook_temp.json | tee slack_channel.json

# 생성된 Slack 채널 ID 확인
SLACK_CHANNEL_ID=$(cat slack_channel.json | sed -n 's/.*"name": "\(projects[^"]*\)".*/\1/p')
if [ -n "$SLACK_CHANNEL_ID" ]; then
  echo "✅ Slack 채널 생성 완료: $SLACK_CHANNEL_ID"
else
  echo "❌ Slack 채널 생성 실패"
  cat slack_channel.json
fi

# 2. 이메일 채널 생성 (선택사항)
echo "📧 이메일 채널 생성 중..."
curl -sS -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/notificationChannels" \
  -d @channel_email.json | tee email_channel.json

# 생성된 이메일 채널 ID 확인
EMAIL_CHANNEL_ID=$(cat email_channel.json | sed -n 's/.*"name": "\(projects[^"]*\)".*/\1/p')
if [ -n "$EMAIL_CHANNEL_ID" ]; then
  echo "✅ 이메일 채널 생성 완료: $EMAIL_CHANNEL_ID"
else
  echo "❌ 이메일 채널 생성 실패"
  cat email_channel.json
fi

# 3. 정책 JSON 파일 업데이트
echo "📝 정책 JSON 파일 업데이트 중..."

if [ -n "$SLACK_CHANNEL_ID" ]; then
  # Slack 채널 ID로 정책 파일 업데이트
  sed "s/\${NOTIF_CHANNEL_ID}/$SLACK_CHANNEL_ID/g" policy_pending_fanout.json > policy_pending_fanout_updated.json
  sed "s/\${NOTIF_CHANNEL_ID}/$SLACK_CHANNEL_ID/g" policy_fanout_failed_fcm.json > policy_fanout_failed_fcm_updated.json
  
  echo "✅ 정책 파일 업데이트 완료:"
  echo "   - policy_pending_fanout_updated.json"
  echo "   - policy_fanout_failed_fcm_updated.json"
  
  echo ""
  echo "🚀 다음 명령어로 정책을 생성하세요:"
  echo "gcloud monitoring policies create --policy-from-file=policy_pending_fanout_updated.json"
  echo "gcloud monitoring policies create --policy-from-file=policy_fanout_failed_fcm_updated.json"
fi

# 4. 환경변수 설정 안내
echo ""
echo "🔧 Functions 환경변수 설정 안내:"
echo "다음 명령어로 SLACK_WEBHOOK_URL을 설정하세요:"
echo "firebase functions:secrets:set SLACK_WEBHOOK_URL"
echo ""
echo "Slack Incoming Webhook URL 형식:"
echo "https://hooks.slack.com/services/XXXX/YYYY/ZZZZ"

# 정리
rm -f channel_webhook_temp.json

echo ""
echo "✅ 알림 채널 생성 완료!"
echo "📋 생성된 채널:"
echo "   - Slack: $SLACK_CHANNEL_ID"
echo "   - Email: $EMAIL_CHANNEL_ID"
