#!/bin/bash

# Slack 승인 시스템 운영 대시보드 테스트 스크립트

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

API_BASE="https://asia-northeast3-${PROJECT_ID}.cloudfunctions.net/slack"

echo "🚀 Slack 승인 시스템 운영 대시보드 테스트 시작"
echo "API Base: $API_BASE"
echo ""

# 1. 대시보드 데이터 조회
echo "📊 1. 대시보드 데이터 조회 테스트"
response=$(curl -s -w "\n%{http_code}" -X GET \
  -H "x-internal-key: $INTERNAL_KEY" \
  "$API_BASE/admin/dashboard")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 대시보드 데이터 조회 성공"
    echo "응답: $(echo "$body" | jq -r '.ok // "N/A"')"
    
    # 데이터 구조 확인
    approvals_count=$(echo "$body" | jq -r '.data.approvals | length // 0')
    metrics_ok=$(echo "$body" | jq -r '.data.metrics.okCount // 0')
    metrics_err=$(echo "$body" | jq -r '.data.metrics.errCount // 0')
    
    echo "  - 승인 요청 수: $approvals_count"
    echo "  - 성공 요청: $metrics_ok"
    echo "  - 실패 요청: $metrics_err"
else
    echo "❌ 대시보드 데이터 조회 실패 (HTTP $http_code)"
    echo "응답: $body"
    exit 1
fi

echo ""

# 2. 채널별 스로틀링 설정 테스트
echo "⚙️ 2. 채널별 스로틀링 설정 테스트"
test_channel="C1234567890"

response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{"capacity": 10, "refillPerSec": 2}' \
  "$API_BASE/admin/throttle/$test_channel")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 스로틀링 설정 업데이트 성공"
    echo "응답: $(echo "$body" | jq -r '.message // "N/A"')"
else
    echo "❌ 스로틀링 설정 업데이트 실패 (HTTP $http_code)"
    echo "응답: $body"
fi

echo ""

# 3. 큐 재시도 테스트
echo "🔄 3. 큐 재시도 테스트"

# 웹훅 재시도 큐
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{"limit": 5}' \
  "$API_BASE/admin/retry/webhook_retry")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 웹훅 재시도 큐 테스트 성공"
    processed=$(echo "$body" | jq -r '.processed // 0')
    total=$(echo "$body" | jq -r '.total // 0')
    echo "  - 처리된 항목: $processed/$total"
else
    echo "❌ 웹훅 재시도 큐 테스트 실패 (HTTP $http_code)"
    echo "응답: $body"
fi

# Slack 업데이트 큐
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{"limit": 5}' \
  "$API_BASE/admin/retry/slack_update")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ Slack 업데이트 큐 테스트 성공"
    processed=$(echo "$body" | jq -r '.processed // 0')
    total=$(echo "$body" | jq -r '.total // 0')
    echo "  - 처리된 항목: $processed/$total"
else
    echo "❌ Slack 업데이트 큐 테스트 실패 (HTTP $http_code)"
    echo "응답: $body"
fi

echo ""

# 4. 헬스체크 테스트
echo "🏥 4. 헬스체크 테스트"
response=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/health")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ 헬스체크 성공"
    region=$(echo "$body" | jq -r '.region // "N/A"')
    slack_ok=$(echo "$body" | jq -r '.slack // false')
    signing_ok=$(echo "$body" | jq -r '.signing // false')
    
    echo "  - 리전: $region"
    echo "  - Slack 설정: $slack_ok"
    echo "  - 서명 검증: $signing_ok"
else
    echo "❌ 헬스체크 실패 (HTTP $http_code)"
    echo "응답: $body"
fi

echo ""

# 5. 운영 대시보드 접근 테스트
echo "🎛️ 5. 운영 대시보드 접근 테스트"
echo "대시보드 URL: $API_BASE/admin/dashboard"
echo "헤더: x-internal-key: $INTERNAL_KEY"

echo ""
echo "✅ 모든 테스트 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 운영 대시보드에 접속하여 데이터 확인"
echo "2. 채널별 스로틀링 설정 조정"
echo "3. 큐 상태 모니터링"
echo "4. 승인 항목 재오픈 테스트"
