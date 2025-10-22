#!/bin/bash
# 🏷️ YAGO VIBE AI 설명 + 해시태그 + 카테고리 분류 테스트 스크립트

echo "🤖 YAGO VIBE 완전 자율형 AI 등록 시스템 테스트"
echo "=============================================="

# n8n 웹훅 URL (실제 URL로 변경하세요)
WEBHOOK_URL="https://your-n8n-domain.com/webhook/ai-describe-tags-category"

# 테스트 이미지 URL (실제 이미지 URL로 변경하세요)
TEST_IMAGE="https://example.com/test-sports-shoe.jpg"

echo "📡 웹훅 URL: $WEBHOOK_URL"
echo "🖼️ 테스트 이미지: $TEST_IMAGE"
echo ""

# cURL 테스트 실행
echo "🚀 AI 설명 + 해시태그 + 카테고리 분류 테스트 시작..."
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$TEST_IMAGE\"
  }" \
  -w "\n\n⏱️ 응답 시간: %{time_total}초\n" \
  -s

echo ""
echo "✅ 테스트 완료!"
echo ""
echo "📋 예상 응답 형식:"
echo "{"
echo "  \"description\": \"깔끔한 상태의 나이키 축구화, 통기성과 쿠션감이 우수합니다.\","
echo "  \"tags\": [\"#나이키\", \"#축구화\", \"#운동화\", \"#스포츠\", \"#남성패션\"],"
echo "  \"category\": \"축구화\""
echo "}"
echo ""
echo "🏷️ 지원 카테고리:"
echo "- 운동화, 축구화, 유니폼, 글러브, 라켓, 헬멧, 기타"
echo ""
echo "📋 다음 단계:"
echo "1. 응답이 정상적으로 오는지 확인"
echo "2. .env.local에서 VITE_OPENAI_PROXY_URL 업데이트"
echo "3. /upload-ai 페이지에서 실제 테스트"
echo "4. 설명, 해시태그, 카테고리가 모두 자동 생성되는지 확인"
echo "5. 완전 자율형 등록 시스템 동작 확인"
