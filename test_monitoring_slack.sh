#!/bin/bash

# monitoringToSlack 함수 테스트 스크립트

PROJECT_ID=${1:-$(firebase use --current)}
if [ -z "$PROJECT_ID" ]; then
  echo "❌ 프로젝트 ID를 제공하세요: $0 <PROJECT_ID>"
  exit 1
fi

FUNCTION_URL="https://asia-northeast3-${PROJECT_ID}.cloudfunctions.net/monitoringToSlack"

echo "🧪 monitoringToSlack 함수 테스트 시작..."
echo "📋 프로젝트: $PROJECT_ID"
echo "🔗 함수 URL: $FUNCTION_URL"
echo ""

# 1. OPEN 상태 테스트
echo "🔥 1. OPEN 상태 테스트..."
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d @monitoring_sample_open.json \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "⏳ 2초 대기 중..."
sleep 2

# 2. 중복 전송 테스트 (rate-limited 확인)
echo "🔄 2. 중복 전송 테스트 (rate-limited 확인)..."
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d @monitoring_sample_open.json \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "⏳ 3초 대기 중..."
sleep 3

# 3. CLOSED 상태 테스트
echo "✅ 3. CLOSED 상태 테스트..."
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d @monitoring_sample_closed.json \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "✅ 테스트 완료!"
echo ""
echo "📱 Slack에서 다음을 확인하세요:"
echo "   - 🔥 ALERT OPEN 메시지 (빨간색)"
echo "   - ✅ RESOLVED 메시지 (초록색)"
echo "   - 중복 메시지는 rate-limited로 스킵됨"
