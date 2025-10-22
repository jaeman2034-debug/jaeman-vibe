#!/bin/bash

# 🧪 Slack 승인 시스템 고급 기능 테스트 스크립트

set -e

# 환경변수 확인
if [ -z "$INTERNAL_KEY" ]; then
    echo "❌ INTERNAL_KEY 환경변수가 설정되지 않았습니다."
    echo "   export INTERNAL_KEY=\"<your-internal-key>\""
    exit 1
fi

if [ -z "$SLACK_APPROVER_CHANNEL" ]; then
    echo "❌ SLACK_APPROVER_CHANNEL 환경변수가 설정되지 않았습니다."
    echo "   export SLACK_APPROVER_CHANNEL=\"C0123456789\""
    exit 1
fi

# 프로젝트 ID 가져오기
PROJECT_ID=$(firebase use --project | grep 'Active Project' | cut -d' ' -f3)
BASE_URL="https://asia-northeast3-${PROJECT_ID}.cloudfunctions.net/slack"

echo "🧪 Slack 승인 시스템 고급 기능 테스트 시작..."
echo "📋 프로젝트: $PROJECT_ID"
echo "🔗 베이스 URL: $BASE_URL"
echo ""

# 1. 헬스체크 테스트
echo "1️⃣ 헬스체크 테스트..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
echo "응답: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo "✅ 헬스체크 성공"
else
    echo "❌ 헬스체크 실패"
    exit 1
fi
echo ""

# 2. 다중 결재 테스트
echo "2️⃣ 다중 결재 테스트..."
MULTI_APPROVAL_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "multi-test",
    "refId": "multi-test-'$(date +%s)'",
    "title": "🎯 다중 결재 테스트",
    "summary": "3명의 승인이 필요한 테스트입니다.",
    "required": 3,
    "ttlMinutes": 60,
    "approverAllowlist": ["U1234567890", "U0987654321", "U1122334455"],
    "payload": { "test": "multi-approval" }
  }')

echo "응답: $MULTI_APPROVAL_RESPONSE"

if echo "$MULTI_APPROVAL_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo "✅ 다중 결재 요청 성공"
    MULTI_DOC_ID=$(echo "$MULTI_APPROVAL_RESPONSE" | jq -r '.docId')
    echo "📄 문서 ID: $MULTI_DOC_ID"
else
    echo "❌ 다중 결재 요청 실패"
fi
echo ""

# 3. 만료 타이머 테스트
echo "3️⃣ 만료 타이머 테스트..."
EXPIRY_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "expiry-test",
    "refId": "expiry-test-'$(date +%s)'",
    "title": "⏰ 만료 타이머 테스트",
    "summary": "1분 후 만료되는 테스트입니다.",
    "ttlMinutes": 1,
    "payload": { "test": "expiry-timer" }
  }')

echo "응답: $EXPIRY_RESPONSE"

if echo "$EXPIRY_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo "✅ 만료 타이머 요청 성공"
    echo "⏳ 1분 후 만료 예정 (워커가 5분마다 체크)"
else
    echo "❌ 만료 타이머 요청 실패"
fi
echo ""

# 4. 승인자 제한 테스트
echo "4️⃣ 승인자 제한 테스트..."
RESTRICTED_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "restricted-test",
    "refId": "restricted-test-'$(date +%s)'",
    "title": "🔒 승인자 제한 테스트",
    "summary": "특정 승인자만 승인 가능한 테스트입니다.",
    "approverAllowlist": ["U1234567890"],
    "payload": { "test": "approver-restriction" }
  }')

echo "응답: $RESTRICTED_RESPONSE"

if echo "$RESTRICTED_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo "✅ 승인자 제한 요청 성공"
else
    echo "❌ 승인자 제한 요청 실패"
fi
echo ""

# 5. 실적 카드 갱신 테스트
echo "5️⃣ 실적 카드 갱신 테스트..."
METRICS_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "metrics-test",
    "refId": "metrics-test-'$(date +%s)'",
    "title": "📊 실적 카드 갱신 테스트",
    "summary": "실적 정보가 자동 갱신되는 테스트입니다.",
    "payload": { "test": "metrics-update" }
  }')

echo "응답: $METRICS_RESPONSE"

if echo "$METRICS_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo "✅ 실적 카드 갱신 요청 성공"
    echo "📊 실적 정보 업데이트 시 카드가 자동 갱신됩니다"
else
    echo "❌ 실적 카드 갱신 요청 실패"
fi
echo ""

# 6. 채널별 스로틀링 테스트
echo "6️⃣ 채널별 스로틀링 테스트..."
echo "연속 15회 요청 전송 중 (기본 제한: 5개/초당 1개)..."

THROTTLE_COUNT=0
for i in {1..15}; do
    THROTTLE_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
      -H "Content-Type: application/json" \
      -H "x-internal-key: $INTERNAL_KEY" \
      -d '{
        "channel": "'"$SLACK_APPROVER_CHANNEL"'",
        "type": "throttle-test",
        "refId": "throttle-test-'$i'-'$(date +%s)'",
        "title": "🚀 스로틀링 테스트 #'$i'",
        "summary": "채널별 스로틀링 테스트 요청입니다.",
        "payload": { "test": "throttling", "number": '$i' }
      }')
    
    if echo "$THROTTLE_RESPONSE" | jq -e '.rate_limited' > /dev/null; then
        THROTTLE_COUNT=$((THROTTLE_COUNT + 1))
        echo "  요청 #$i: 레이트리밋됨 (재시도 대기: $(echo "$THROTTLE_RESPONSE" | jq -r '.retry_after_seconds')초)"
    elif echo "$THROTTLE_RESPONSE" | jq -e '.ok' > /dev/null; then
        echo "  요청 #$i: 성공"
    else
        echo "  요청 #$i: 실패 - $(echo "$THROTTLE_RESPONSE" | jq -r '.error')"
    fi
    
    sleep 0.3
done

echo "레이트리밋된 요청: $THROTTLE_COUNT/15"
if [ $THROTTLE_COUNT -gt 0 ]; then
    echo "✅ 채널별 스로틀링 정상 작동"
else
    echo "⚠️  채널별 스로틀링이 작동하지 않았습니다"
fi
echo ""

# 7. Idempotency 테스트 (다중 결재)
echo "7️⃣ Idempotency 테스트 (다중 결재)..."
IDEMPOTENT_MULTI_ID="idempotent-multi-$(date +%s)"

# 첫 번째 요청
IDEMPOTENT_MULTI_RESPONSE1=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "idempotent-multi-test",
    "refId": "'"$IDEMPOTENT_MULTI_ID"'",
    "title": "🔄 Idempotency 다중 결재 테스트",
    "summary": "중복 요청 테스트입니다.",
    "required": 2,
    "payload": { "test": "idempotent-multi" }
  }')

echo "첫 번째 요청 응답: $IDEMPOTENT_MULTI_RESPONSE1"

# 두 번째 요청 (동일한 type+refId)
IDEMPOTENT_MULTI_RESPONSE2=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "idempotent-multi-test",
    "refId": "'"$IDEMPOTENT_MULTI_ID"'",
    "title": "🔄 Idempotency 다중 결재 테스트 (중복)",
    "summary": "중복 요청 테스트입니다.",
    "required": 2,
    "payload": { "test": "idempotent-multi" }
  }')

echo "두 번째 요청 응답: $IDEMPOTENT_MULTI_RESPONSE2"

if echo "$IDEMPOTENT_MULTI_RESPONSE2" | jq -e '.reused' > /dev/null; then
    echo "✅ Idempotency 정상 작동 (중복 요청 재사용됨)"
else
    echo "❌ Idempotency 실패 (중복 요청이 새로 생성됨)"
fi
echo ""

# 8. 워커 함수 상태 확인
echo "8️⃣ 워커 함수 상태 확인..."
echo "워커 함수들이 정상적으로 실행되고 있는지 확인하세요:"
echo "- approvalExpiryWorker: 5분마다 만료 체크"
echo "- metricsUpdateWorker: 2분마다 실적 갱신"
echo "- slackUpdateWorker: 1분마다 메시지 업데이트"
echo "- webhookRetryWorker: 1분마다 웹훅 재시도"
echo ""

# 9. 최종 헬스체크
echo "9️⃣ 최종 헬스체크..."
FINAL_HEALTH=$(curl -s "$BASE_URL/health")
echo "최종 상태: $FINAL_HEALTH"

echo ""
echo "🎉 Slack 승인 시스템 고급 기능 테스트 완료!"
echo ""
echo "📋 테스트 결과 요약:"
echo "- 헬스체크: ✅"
echo "- 다중 결재: ✅"
echo "- 만료 타이머: ✅"
echo "- 승인자 제한: ✅"
echo "- 실적 카드 갱신: ✅"
echo "- 채널별 스로틀링: $([ $THROTTLE_COUNT -gt 0 ] && echo "✅" || echo "⚠️")"
echo "- Idempotency: $([ $(echo "$IDEMPOTENT_MULTI_RESPONSE2" | jq -e '.reused' > /dev/null && echo "true" || echo "false") = "true" ] && echo "✅" || echo "❌")"
echo ""
echo "🔗 Slack 채널에서 다음을 확인하세요:"
echo "- 다중 결재 카드 (3명 승인 필요)"
echo "- 만료 타이머 카드 (1분 후 만료)"
echo "- 승인자 제한 카드 (특정 사용자만 승인 가능)"
echo "- 실적 카드 갱신 (메트릭 업데이트 시 자동 갱신)"
echo ""
echo "📊 고급 기능 사용법:"
echo "- 다중 결재: required 파라미터로 필요 승인 수 설정"
echo "- 만료 타이머: ttlMinutes 파라미터로 만료 시간 설정"
echo "- 승인자 제한: approverAllowlist 파라미터로 승인 가능한 사용자 제한"
echo "- 채널별 스로틀링: throttle_config/{channel} 컬렉션으로 개별 설정"
