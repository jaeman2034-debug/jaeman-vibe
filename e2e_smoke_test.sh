#!/bin/bash

# E2E 스모크 테스트: Slack 승인 시스템 전체 흐름 점검

set -e

# 환경변수 확인
if [ -z "$INTERNAL_KEY" ]; then
    echo "❌ INTERNAL_KEY 환경변수가 설정되지 않았습니다"
    echo "export INTERNAL_KEY='your-internal-key'"
    exit 1
fi

if [ -z "$PROJECT_ID" ]; then
    echo "❌ PROJECT_ID 환경변수가 설정되지 않았습니다"
    echo "export PROJECT_ID='your-project-id'"
    exit 1
fi

if [ -z "$SLACK_APPROVER_CHANNEL" ]; then
    echo "❌ SLACK_APPROVER_CHANNEL 환경변수가 설정되지 않았습니다"
    echo "export SLACK_APPROVER_CHANNEL='C0123456789'"
    exit 1
fi

API_BASE="https://asia-northeast3-${PROJECT_ID}.cloudfunctions.net/slack"

echo "🚀 E2E 스모크 테스트 시작"
echo "API Base: $API_BASE"
echo "Channel: $SLACK_APPROVER_CHANNEL"
echo ""

# 테스트 데이터
TEST_REF_ID="smoke-test-$(date +%s)"
TEST_TITLE="🧪 E2E 스모크 테스트 - $(date '+%Y-%m-%d %H:%M:%S')"
TEST_SUMMARY="자동화된 E2E 테스트입니다. 안전하게 삭제해도 됩니다."

# 1. 헬스체크
echo "🏥 1. 헬스체크 테스트"
response=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 헬스체크 성공"
    region=$(echo "$body" | jq -r '.region // "N/A"')
    slack_ok=$(echo "$body" | jq -r '.slack // false')
    echo "  - 리전: $region"
    echo "  - Slack 설정: $slack_ok"
else
    echo "❌ 헬스체크 실패 (HTTP $http_code)"
    echo "응답: $body"
    exit 1
fi

echo ""

# 2. 기본 승인 요청
echo "📋 2. 기본 승인 요청 테스트"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d "{
    \"channel\": \"$SLACK_APPROVER_CHANNEL\",
    \"type\": \"smoke-test\",
    \"refId\": \"$TEST_REF_ID\",
    \"title\": \"$TEST_TITLE\",
    \"summary\": \"$TEST_SUMMARY\",
    \"url\": \"https://example.com/smoke-test\",
    \"image\": \"https://via.placeholder.com/300x200?text=Smoke+Test\",
    \"payload\": {
      \"testId\": \"$TEST_REF_ID\",
      \"timestamp\": \"$(date -Iseconds)\"
    }
  }" \
  "$API_BASE/internal/approval/notify")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 기본 승인 요청 성공"
    doc_id=$(echo "$body" | jq -r '.docId // "N/A"')
    channel=$(echo "$body" | jq -r '.channel // "N/A"')
    ts=$(echo "$body" | jq -r '.ts // "N/A"')
    echo "  - Doc ID: $doc_id"
    echo "  - Channel: $channel"
    echo "  - Timestamp: $ts"
    
    # Doc ID 저장 (나중에 사용)
    echo "$doc_id" > /tmp/smoke_test_doc_id
else
    echo "❌ 기본 승인 요청 실패 (HTTP $http_code)"
    echo "응답: $body"
    exit 1
fi

echo ""

# 3. 다중 결재 요청 테스트
echo "👥 3. 다중 결재 요청 테스트"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d "{
    \"channel\": \"$SLACK_APPROVER_CHANNEL\",
    \"type\": \"multi-approval-test\",
    \"refId\": \"$TEST_REF_ID-multi\",
    \"title\": \"$TEST_TITLE (다중 결재)\",
    \"summary\": \"$TEST_SUMMARY - 2명의 승인이 필요합니다\",
    \"required\": 2,
    \"ttlMinutes\": 60,
    \"approverAllowlist\": [\"U1234567890\", \"U0987654321\"],
    \"payload\": {
      \"testId\": \"$TEST_REF_ID-multi\",
      \"timestamp\": \"$(date -Iseconds)\"
    }
  }" \
  "$API_BASE/internal/approval/notify")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 다중 결재 요청 성공"
    doc_id_multi=$(echo "$body" | jq -r '.docId // "N/A"')
    echo "  - Doc ID: $doc_id_multi"
else
    echo "❌ 다중 결재 요청 실패 (HTTP $http_code)"
    echo "응답: $body"
fi

echo ""

# 4. 다단계 결재 요청 테스트
echo "🔄 4. 다단계 결재 요청 테스트"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d "{
    \"channel\": \"$SLACK_APPROVER_CHANNEL\",
    \"type\": \"multi-stage-test\",
    \"refId\": \"$TEST_REF_ID-stages\",
    \"title\": \"$TEST_TITLE (다단계 결재)\",
    \"summary\": \"$TEST_SUMMARY - 3단계 승인 프로세스\",
    \"stages\": [
      {
        \"name\": \"1차 검토\",
        \"required\": 1,
        \"approverAllowlist\": [\"U1234567890\"]
      },
      {
        \"name\": \"2차 승인\",
        \"required\": 1,
        \"approverAllowlist\": [\"U0987654321\"]
      },
      {
        \"name\": \"최종 승인\",
        \"required\": 1,
        \"approverAllowlist\": [\"U1122334455\"]
      }
    ],
    \"maxResubmits\": 2,
    \"payload\": {
      \"testId\": \"$TEST_REF_ID-stages\",
      \"timestamp\": \"$(date -Iseconds)\"
    }
  }" \
  "$API_BASE/internal/approval/notify")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 다단계 결재 요청 성공"
    doc_id_stages=$(echo "$body" | jq -r '.docId // "N/A"')
    echo "  - Doc ID: $doc_id_stages"
else
    echo "❌ 다단계 결재 요청 실패 (HTTP $http_code)"
    echo "응답: $body"
fi

echo ""

# 5. 운영 대시보드 테스트
echo "🎛️ 5. 운영 대시보드 테스트"
response=$(curl -s -w "\n%{http_code}" -X GET \
  -H "x-internal-key: $INTERNAL_KEY" \
  "$API_BASE/admin/dashboard")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 운영 대시보드 접근 성공"
    approvals_count=$(echo "$body" | jq -r '.data.approvals | length // 0')
    metrics_ok=$(echo "$body" | jq -r '.data.metrics.okCount // 0')
    echo "  - 승인 요청 수: $approvals_count"
    echo "  - 성공 요청: $metrics_ok"
else
    echo "❌ 운영 대시보드 접근 실패 (HTTP $http_code)"
    echo "응답: $body"
fi

echo ""

# 6. 채널별 스로틀링 테스트
echo "⚙️ 6. 채널별 스로틀링 테스트"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{"capacity": 10, "refillPerSec": 2}' \
  "$API_BASE/admin/throttle/$SLACK_APPROVER_CHANNEL")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 스로틀링 설정 성공"
    echo "  - 용량: 10, 재충전: 2/초"
else
    echo "❌ 스로틀링 설정 실패 (HTTP $http_code)"
    echo "응답: $body"
fi

echo ""

# 7. 큐 상태 확인
echo "📊 7. 큐 상태 확인"
response=$(curl -s -w "\n%{http_code}" -X GET \
  -H "x-internal-key: $INTERNAL_KEY" \
  "$API_BASE/admin/dashboard")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 큐 상태 확인 성공"
    webhook_pending=$(echo "$body" | jq -r '.data.queueStats.webhook_retry.pending // 0')
    slack_pending=$(echo "$body" | jq -r '.data.queueStats.slack_update.pending // 0')
    echo "  - 웹훅 재시도 대기: $webhook_pending"
    echo "  - Slack 업데이트 대기: $slack_pending"
else
    echo "❌ 큐 상태 확인 실패 (HTTP $http_code)"
fi

echo ""

# 8. 레이트리밋 테스트
echo "🚦 8. 레이트리밋 테스트"
echo "연속 10회 요청 테스트 중..."

success_count=0
rate_limited_count=0

for i in {1..10}; do
    response=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -H "x-internal-key: $INTERNAL_KEY" \
      -d "{
        \"channel\": \"$SLACK_APPROVER_CHANNEL\",
        \"type\": \"rate-limit-test\",
        \"refId\": \"$TEST_REF_ID-rate-$i\",
        \"title\": \"레이트리밋 테스트 $i\",
        \"summary\": \"연속 요청 테스트\"
      }" \
      "$API_BASE/internal/approval/notify")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 200 ]; then
        success_count=$((success_count + 1))
    elif [ "$http_code" -eq 429 ]; then
        rate_limited_count=$((rate_limited_count + 1))
    fi
    
    sleep 0.1
done

echo "  - 성공: $success_count"
echo "  - 레이트리밋: $rate_limited_count"

if [ "$rate_limited_count" -gt 0 ]; then
    echo "✅ 레이트리밋 정상 작동"
else
    echo "⚠️ 레이트리밋이 작동하지 않을 수 있습니다"
fi

echo ""

# 9. Idempotency 테스트
echo "🔄 9. Idempotency 테스트"
echo "동일한 refId로 2회 요청 테스트..."

# 첫 번째 요청
response1=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d "{
    \"channel\": \"$SLACK_APPROVER_CHANNEL\",
    \"type\": \"idempotency-test\",
    \"refId\": \"$TEST_REF_ID-idem\",
    \"title\": \"Idempotency 테스트\",
    \"summary\": \"중복 요청 테스트\"
  }" \
  "$API_BASE/internal/approval/notify")

http_code1=$(echo "$response1" | tail -n1)
body1=$(echo "$response1" | head -n -1)

# 두 번째 요청 (동일한 refId)
response2=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d "{
    \"channel\": \"$SLACK_APPROVER_CHANNEL\",
    \"type\": \"idempotency-test\",
    \"refId\": \"$TEST_REF_ID-idem\",
    \"title\": \"Idempotency 테스트\",
    \"summary\": \"중복 요청 테스트\"
  }" \
  "$API_BASE/internal/approval/notify")

http_code2=$(echo "$response2" | tail -n1)
body2=$(echo "$response2" | head -n -1)

if [ "$http_code1" -eq 200 ] && [ "$http_code2" -eq 200 ]; then
    doc_id1=$(echo "$body1" | jq -r '.docId // "N/A"')
    doc_id2=$(echo "$body2" | jq -r '.docId // "N/A"')
    reused=$(echo "$body2" | jq -r '.reused // false')
    
    if [ "$doc_id1" = "$doc_id2" ] && [ "$reused" = "true" ]; then
        echo "✅ Idempotency 정상 작동"
        echo "  - 첫 번째 Doc ID: $doc_id1"
        echo "  - 두 번째 Doc ID: $doc_id2 (재사용됨)"
    else
        echo "❌ Idempotency 실패"
    fi
else
    echo "❌ Idempotency 테스트 실패"
    echo "  - 첫 번째 요청: HTTP $http_code1"
    echo "  - 두 번째 요청: HTTP $http_code2"
fi

echo ""

# 10. 정리
echo "🧹 10. 테스트 정리"
echo "테스트로 생성된 승인 요청들을 확인하세요:"
echo "  - 기본 승인: $TEST_REF_ID"
echo "  - 다중 결재: $TEST_REF_ID-multi"
echo "  - 다단계 결재: $TEST_REF_ID-stages"
echo "  - Idempotency: $TEST_REF_ID-idem"
echo ""
echo "Slack 채널($SLACK_APPROVER_CHANNEL)에서 승인 카드들을 확인하고 수동으로 승인/반려 테스트를 진행하세요."

echo ""
echo "✅ E2E 스모크 테스트 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Slack 채널에서 승인 카드 확인"
echo "2. 수동 승인/반려 테스트"
echo "3. App Home 탭에서 '내 승인 인박스' 확인"
echo "4. 운영 대시보드에서 실시간 모니터링"
echo "5. BigQuery에서 데이터 적재 확인"
