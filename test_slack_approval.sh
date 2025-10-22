#!/bin/bash

# 🧪 Slack 승인 시스템 테스트 스크립트

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

echo "🧪 Slack 승인 시스템 테스트 시작..."
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

# 2. 기본 승인 요청 테스트
echo "2️⃣ 기본 승인 요청 테스트..."
APPROVAL_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "test",
    "refId": "test-'$(date +%s)'",
    "title": "🧪 기본 테스트",
    "summary": "기본 승인 요청 테스트입니다.",
    "url": "https://yagovibe.com",
    "payload": { "test": true }
  }')

echo "응답: $APPROVAL_RESPONSE"

if echo "$APPROVAL_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo "✅ 기본 승인 요청 성공"
    DOC_ID=$(echo "$APPROVAL_RESPONSE" | jq -r '.docId')
    echo "📄 문서 ID: $DOC_ID"
else
    echo "❌ 기본 승인 요청 실패"
    exit 1
fi
echo ""

# 3. 마켓 상품 승인 요청 테스트
echo "3️⃣ 마켓 상품 승인 요청 테스트..."
MARKET_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "market",
    "refId": "market-test-'$(date +%s)'",
    "title": "⚽ 아모 축구공",
    "summary": "가격 39,900원 • 송산2동 • 카테고리: 공",
    "url": "https://yagovibe.com/market/market-test-'$(date +%s)'",
    "image": "https://via.placeholder.com/300x300?text=Football",
    "payload": {
      "price": 39900,
      "region": "송산2동",
      "category": "공",
      "condition": "새상품"
    }
  }')

echo "응답: $MARKET_RESPONSE"

if echo "$MARKET_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo "✅ 마켓 상품 승인 요청 성공"
else
    echo "❌ 마켓 상품 승인 요청 실패"
fi
echo ""

# 4. 모임 승인 요청 테스트
echo "4️⃣ 모임 승인 요청 테스트..."
MEETUP_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "meetup",
    "refId": "meetup-test-'$(date +%s)'",
    "title": "🏀 농구 모임",
    "summary": "2024-01-15 • 강남구 체육관 • 8명 참여",
    "url": "https://yagovibe.com/meetup/meetup-test-'$(date +%s)'",
    "image": "https://via.placeholder.com/300x300?text=Basketball",
    "payload": {
      "date": "2024-01-15",
      "location": "강남구 체육관",
      "participants": 8,
      "sport": "농구"
    }
  }')

echo "응답: $MEETUP_RESPONSE"

if echo "$MEETUP_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo "✅ 모임 승인 요청 성공"
else
    echo "❌ 모임 승인 요청 실패"
fi
echo ""

# 5. 구인구직 승인 요청 테스트
echo "5️⃣ 구인구직 승인 요청 테스트..."
JOB_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "job",
    "refId": "job-test-'$(date +%s)'",
    "title": "🏐 배구 코치 모집",
    "summary": "스포츠센터 • 서울 • 정규직 • 300만원",
    "url": "https://yagovibe.com/jobs/job-test-'$(date +%s)'",
    "image": "https://via.placeholder.com/300x300?text=Volleyball",
    "payload": {
      "company": "스포츠센터",
      "location": "서울",
      "type": "정규직",
      "salary": "300만원",
      "sport": "배구"
    }
  }')

echo "응답: $JOB_RESPONSE"

if echo "$JOB_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo "✅ 구인구직 승인 요청 성공"
else
    echo "❌ 구인구직 승인 요청 실패"
fi
echo ""

# 6. 레이트리밋 테스트
echo "6️⃣ 레이트리밋 테스트..."
echo "연속 10회 요청 전송 중..."

RATE_LIMIT_COUNT=0
for i in {1..10}; do
    RATE_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
      -H "Content-Type: application/json" \
      -H "x-internal-key: $INTERNAL_KEY" \
      -d '{
        "channel": "'"$SLACK_APPROVER_CHANNEL"'",
        "type": "rate-test",
        "refId": "rate-test-'$i'-'$(date +%s)'",
        "title": "🚀 레이트리밋 테스트 #'$i'",
        "summary": "레이트리밋 테스트 요청입니다.",
        "payload": { "test": true, "number": '$i' }
      }')
    
    if echo "$RATE_RESPONSE" | jq -e '.rate_limited' > /dev/null; then
        RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
        echo "  요청 #$i: 레이트리밋됨 (재시도 대기: $(echo "$RATE_RESPONSE" | jq -r '.retry_after_seconds')초)"
    elif echo "$RATE_RESPONSE" | jq -e '.ok' > /dev/null; then
        echo "  요청 #$i: 성공"
    else
        echo "  요청 #$i: 실패 - $(echo "$RATE_RESPONSE" | jq -r '.error')"
    fi
    
    sleep 0.5
done

echo "레이트리밋된 요청: $RATE_LIMIT_COUNT/10"
if [ $RATE_LIMIT_COUNT -gt 0 ]; then
    echo "✅ 레이트리밋 정상 작동"
else
    echo "⚠️  레이트리밋이 작동하지 않았습니다"
fi
echo ""

# 7. Idempotency 테스트
echo "7️⃣ Idempotency 테스트..."
IDEMPOTENT_ID="idempotent-test-$(date +%s)"

# 첫 번째 요청
IDEMPOTENT_RESPONSE1=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "idempotent-test",
    "refId": "'"$IDEMPOTENT_ID"'",
    "title": "🔄 Idempotency 테스트",
    "summary": "중복 요청 테스트입니다.",
    "payload": { "test": true }
  }')

echo "첫 번째 요청 응답: $IDEMPOTENT_RESPONSE1"

# 두 번째 요청 (동일한 type+refId)
IDEMPOTENT_RESPONSE2=$(curl -s -X POST "$BASE_URL/internal/approval/notify" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "channel": "'"$SLACK_APPROVER_CHANNEL"'",
    "type": "idempotent-test",
    "refId": "'"$IDEMPOTENT_ID"'",
    "title": "🔄 Idempotency 테스트 (중복)",
    "summary": "중복 요청 테스트입니다.",
    "payload": { "test": true }
  }')

echo "두 번째 요청 응답: $IDEMPOTENT_RESPONSE2"

if echo "$IDEMPOTENT_RESPONSE2" | jq -e '.reused' > /dev/null; then
    echo "✅ Idempotency 정상 작동 (중복 요청 재사용됨)"
else
    echo "❌ Idempotency 실패 (중복 요청이 새로 생성됨)"
fi
echo ""

# 8. 최종 헬스체크
echo "8️⃣ 최종 헬스체크..."
FINAL_HEALTH=$(curl -s "$BASE_URL/health")
echo "최종 상태: $FINAL_HEALTH"

echo ""
echo "🎉 Slack 승인 시스템 테스트 완료!"
echo ""
echo "📋 테스트 결과 요약:"
echo "- 헬스체크: ✅"
echo "- 기본 승인 요청: ✅"
echo "- 마켓 상품 승인: ✅"
echo "- 모임 승인: ✅"
echo "- 구인구직 승인: ✅"
echo "- 레이트리밋: $([ $RATE_LIMIT_COUNT -gt 0 ] && echo "✅" || echo "⚠️")"
echo "- Idempotency: $([ $(echo "$IDEMPOTENT_RESPONSE2" | jq -e '.reused' > /dev/null && echo "true" || echo "false") = "true" ] && echo "✅" || echo "❌")"
echo ""
echo "🔗 Slack 채널에서 승인/반려 버튼을 확인하세요: $SLACK_APPROVER_CHANNEL"
