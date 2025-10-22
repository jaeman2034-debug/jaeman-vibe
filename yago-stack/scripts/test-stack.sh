#!/bin/bash
# YAGO Stack 테스트 스크립트

echo "🧪 YAGO Stack 테스트를 시작합니다..."

BASE_URL="http://127.0.0.1"
TEMP_DIR="/tmp/yago-test"

# 임시 디렉터리 생성
mkdir -p $TEMP_DIR

echo ""
echo "1️⃣ OG 이미지 생성 테스트"
echo "================================"
curl -s "${BASE_URL}/og?title=YAGO%20VIBE&subtitle=자동%20OG%20테스트" -o "${TEMP_DIR}/og-test.png"
if [ -f "${TEMP_DIR}/og-test.png" ] && file "${TEMP_DIR}/og-test.png" | grep -q "PNG"; then
  echo "✅ OG 이미지 생성 성공: ${TEMP_DIR}/og-test.png"
else
  echo "❌ OG 이미지 생성 실패"
fi

echo ""
echo "2️⃣ 피드 엔드포인트 테스트"
echo "================================"
FEED_RESPONSE=$(curl -s "${BASE_URL}/feed.json")
if echo "$FEED_RESPONSE" | jq . > /dev/null 2>&1; then
  echo "✅ 피드 엔드포인트 정상 동작"
  echo "📄 피드 내용:"
  echo "$FEED_RESPONSE" | jq .
else
  echo "❌ 피드 엔드포인트 오류"
  echo "응답: $FEED_RESPONSE"
fi

echo ""
echo "3️⃣ 웹훅 포스트 발행 테스트"
echo "================================"
WEBHOOK_PAYLOAD='{
  "id": "test-001",
  "title": "YAGO VIBE — 테스트 포스트",
  "summary": "서버 부트스트랩 + OG 자동생성 + SNS 연동 테스트",
  "url": "https://example.com/blog/test-001"
}'

WEBHOOK_RESPONSE=$(curl -s -X POST "${BASE_URL}/webhook/post-published" \
  -H 'Content-Type: application/json' \
  -d "$WEBHOOK_PAYLOAD")

if echo "$WEBHOOK_RESPONSE" | jq . > /dev/null 2>&1; then
  echo "✅ 웹훅 포스트 발행 성공"
  echo "📄 응답:"
  echo "$WEBHOOK_RESPONSE" | jq .
  
  # OG 이미지 확인
  OG_URL=$(echo "$WEBHOOK_RESPONSE" | jq -r '.ogUrl')
  if [ "$OG_URL" != "null" ] && [ "$OG_URL" != "" ]; then
    echo "🖼️  생성된 OG 이미지: $OG_URL"
    curl -s "$OG_URL" -o "${TEMP_DIR}/webhook-og.png"
    if [ -f "${TEMP_DIR}/webhook-og.png" ] && file "${TEMP_DIR}/webhook-og.png" | grep -q "PNG"; then
      echo "✅ 웹훅 OG 이미지 생성 성공"
    else
      echo "❌ 웹훅 OG 이미지 생성 실패"
    fi
  fi
else
  echo "❌ 웹훅 포스트 발행 실패"
  echo "응답: $WEBHOOK_RESPONSE"
fi

echo ""
echo "4️⃣ 서비스 헬스체크"
echo "================================"
echo "OG 서비스:"
curl -s "${BASE_URL}/og/healthz" | jq . 2>/dev/null || echo "❌ OG 서비스 응답 없음"

echo "웹훅 서비스:"
curl -s "${BASE_URL}/webhook/healthz" | jq . 2>/dev/null || echo "❌ 웹훅 서비스 응답 없음"

echo ""
echo "5️⃣ 생성된 파일 확인"
echo "================================"
echo "OG 이미지 디렉터리:"
ls -la ./data/public/og/ 2>/dev/null || echo "OG 이미지 디렉터리가 없습니다"

echo ""
echo "🧹 테스트 파일 정리"
rm -rf $TEMP_DIR

echo ""
echo "🎉 테스트 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. n8n 워크플로우 설정 (옵션 A: SNS 자동배포)"
echo "2. Google Sites 미러 설정 (옵션 B: Sites 동시 퍼블리시)"
echo "3. 도메인 연결 및 TLS 설정"
