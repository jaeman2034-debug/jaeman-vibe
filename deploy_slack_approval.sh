#!/bin/bash

# 🚀 Slack 승인→발행 시스템 배포 스크립트

set -e

echo "🚀 Slack 승인→발행 시스템 배포 시작..."

# 1. 환경변수 확인
echo "📋 환경변수 확인 중..."
if [ -z "$SLACK_BOT_TOKEN" ]; then
    echo "❌ SLACK_BOT_TOKEN이 설정되지 않았습니다."
    echo "   firebase functions:config:set slack.bot_token=\"xoxb-...\""
    exit 1
fi

if [ -z "$SLACK_SIGNING_SECRET" ]; then
    echo "❌ SLACK_SIGNING_SECRET이 설정되지 않았습니다."
    echo "   firebase functions:config:set slack.signing_secret=\"...\""
    exit 1
fi

if [ -z "$SLACK_APPROVER_CHANNEL" ]; then
    echo "❌ SLACK_APPROVER_CHANNEL이 설정되지 않았습니다."
    echo "   firebase functions:config:set slack.approver_channel=\"C0123456789\""
    exit 1
fi

if [ -z "$INTERNAL_KEY" ]; then
    echo "❌ INTERNAL_KEY가 설정되지 않았습니다."
    echo "   firebase functions:config:set internal.key=\"<랜덤키>\""
    exit 1
fi

echo "✅ 환경변수 확인 완료"

# 2. Firebase Functions Config 설정
echo "🔧 Firebase Functions Config 설정 중..."

# 기본 설정
firebase functions:config:set \
  slack.bot_token="$SLACK_BOT_TOKEN" \
  slack.signing_secret="$SLACK_SIGNING_SECRET" \
  slack.approver_channel="$SLACK_APPROVER_CHANNEL" \
  internal.key="$INTERNAL_KEY"

# 레이트리밋 설정 (기본값)
firebase functions:config:set \
  rate.capacity=5 \
  rate.refill_per_sec=1

# 재시도 설정 (기본값)
firebase functions:config:set \
  retry.max_attempts=6 \
  update.retry_max_attempts=8

echo "✅ Config 설정 완료"

# 3. n8n 웹훅 설정 (선택)
if [ ! -z "$N8N_WEBHOOK_APPROVED" ]; then
    echo "🔗 n8n 웹훅 설정 중..."
    firebase functions:config:set n8n.approved_webhook="$N8N_WEBHOOK_APPROVED"
    
    if [ ! -z "$N8N_WEBHOOK_APPROVED_FO" ]; then
        firebase functions:config:set n8n.approved_webhook_fo="$N8N_WEBHOOK_APPROVED_FO"
        echo "✅ n8n 웹훅 (페일오버 포함) 설정 완료"
    else
        echo "✅ n8n 웹훅 설정 완료"
    fi
else
    echo "⚠️  N8N_WEBHOOK_APPROVED가 설정되지 않았습니다. 승인 시 웹훅 호출이 건너뜁니다."
fi

# 4. 함수 배포
echo "🚀 함수 배포 중..."

# 메인 함수들 배포
firebase deploy --only functions:slack,functions:slackUpdateWorker,functions:webhookRetryWorker,functions:approvalExpiryWorker,functions:metricsUpdateWorker,functions:autoResubmitWorker,functions:generateSecurityRules

echo "✅ 함수 배포 완료"

# 5. 헬스체크 테스트
echo "🏥 헬스체크 테스트 중..."

# 잠시 대기 (배포 완료 대기)
sleep 10

# 헬스체크 실행
HEALTH_URL="https://asia-northeast3-$(firebase use --project | grep 'Active Project' | cut -d' ' -f3).cloudfunctions.net/slack/health"

echo "🔍 헬스체크 URL: $HEALTH_URL"

if curl -s "$HEALTH_URL" | jq -e '.ok' > /dev/null; then
    echo "✅ 헬스체크 성공"
    
    # 상세 상태 출력
    echo "📊 시스템 상태:"
    curl -s "$HEALTH_URL" | jq '.'
else
    echo "❌ 헬스체크 실패"
    echo "   URL: $HEALTH_URL"
    exit 1
fi

# 6. 테스트 승인 요청 (선택)
if [ "$1" = "--test" ]; then
    echo "🧪 테스트 승인 요청 전송 중..."
    
    TEST_URL="https://asia-northeast3-$(firebase use --project | grep 'Active Project' | cut -d' ' -f3).cloudfunctions.net/slack/internal/approval/notify"
    
    curl -X POST "$TEST_URL" \
      -H "Content-Type: application/json" \
      -H "x-internal-key: $INTERNAL_KEY" \
      -d '{
        "channel": "'"$SLACK_APPROVER_CHANNEL"'",
        "type": "test",
        "refId": "test-'$(date +%s)'",
        "title": "🚀 배포 테스트",
        "summary": "Slack 승인 시스템 배포가 완료되었습니다.",
        "url": "https://yagovibe.com",
        "payload": { "test": true, "timestamp": "'$(date -Iseconds)'" }
      }'
    
    echo "✅ 테스트 승인 요청 전송 완료"
    echo "   Slack 채널에서 승인/반려 버튼을 확인하세요."
fi

echo ""
echo "🎉 Slack 승인→발행 시스템 배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Slack 채널에서 승인/반려 버튼 테스트"
echo "2. 프론트엔드에서 requestApproval() 함수 연동"
echo "3. 모니터링 대시보드 설정"
echo ""
echo "🔗 유용한 링크:"
echo "- 헬스체크: $HEALTH_URL"
echo "- 설정 가이드: SLACK_APPROVAL_SETUP.md"
echo ""
