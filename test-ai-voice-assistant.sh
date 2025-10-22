#!/bin/bash
# 🎤 YAGO VIBE AI 음성 마켓 어시스턴트 테스트 스크립트

echo "🎤 YAGO VIBE AI 음성 마켓 어시스턴트 테스트"
echo "=========================================="

# n8n 웹훅 URL (실제 URL로 변경하세요)
WEBHOOK_URL="https://your-n8n-domain.com/webhook/ai-describe-tags-category-voice"

# 테스트 이미지 URL (실제 이미지 URL로 변경하세요)
TEST_IMAGE="https://example.com/test-sports-shoe.jpg"

# 테스트 음성 텍스트
TEST_VOICE="이건 나이키 축구화야, 거의 새거고 쿠션감 좋아"

echo "📡 웹훅 URL: $WEBHOOK_URL"
echo "🖼️ 테스트 이미지: $TEST_IMAGE"
echo "🎤 테스트 음성 텍스트: $TEST_VOICE"
echo ""

# cURL 테스트 실행
echo "🚀 AI 음성 + 이미지 통합 분석 + TTS 피드백 테스트 시작..."
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$TEST_IMAGE\",
    \"voiceText\": \"$TEST_VOICE\",
    \"mode\": \"describe-tags-category-voice\"
  }" \
  -w "\n\n⏱️ 응답 시간: %{time_total}초\n" \
  -s

echo ""
echo "✅ 테스트 완료!"
echo ""
echo "📋 예상 응답 형식:"
echo "{"
echo "  \"description\": \"거의 새것 같은 나이키 축구화, 쿠션감이 우수하고 착용감이 좋습니다.\","
echo "  \"tags\": [\"#나이키\", \"#축구화\", \"#쿠션감\", \"#새것\", \"#스포츠\"],"
echo "  \"category\": \"축구화\","
echo "  \"voiceProcessed\": true"
echo "}"
echo ""
echo "🎙️ 음성 어시스턴트 특징:"
echo "- 음성 내용이 설명에 반영됨"
echo "- 음성 내용에 맞는 해시태그 생성"
echo "- 음성 설명을 바탕으로 카테고리 분류"
echo "- 모든 단계별 음성 피드백 제공"
echo "- 등록 완료 시 음성으로 안내"
echo ""
echo "🔊 TTS 피드백 시나리오:"
echo "1. '음성 인식을 시작합니다. 상품에 대해 말씀해주세요.'"
echo "2. '음성 입력을 인식했습니다. 이미지를 업로드해주세요.'"
echo "3. 'AI가 상품을 분석 중입니다. 잠시만 기다려주세요.'"
echo "4. 'AI 분석이 완료되었습니다. 축구화 카테고리로 분류되었습니다.'"
echo "5. '상품을 등록 중입니다. 잠시만 기다려주세요.'"
echo "6. '상품 등록이 완료되었습니다! 마켓 페이지로 이동합니다.'"
echo ""
echo "📋 다음 단계:"
echo "1. 응답이 정상적으로 오는지 확인"
echo "2. .env.local에서 VITE_OPENAI_PROXY_URL 업데이트"
echo "3. /upload-voice-tts 페이지에서 실제 테스트"
echo "4. 음성 인식이 정상 작동하는지 확인"
echo "5. 음성 + 이미지 통합 분석이 작동하는지 확인"
echo "6. TTS 피드백이 정상 작동하는지 확인"
echo "7. 완전 자율형 음성 어시스턴트 시스템 동작 확인"
