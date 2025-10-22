#!/bin/bash
# 🎤 YAGO VIBE 완전 대화형 AI 음성 비서 테스트 스크립트

echo "🎤 YAGO VIBE 완전 대화형 AI 음성 비서 테스트"
echo "============================================="

# n8n 웹훅 URL (실제 URL로 변경하세요)
WEBHOOK_URL="https://your-n8n-domain.com/webhook/yago-voice-assistant"

echo "📡 웹훅 URL: $WEBHOOK_URL"
echo ""

# 테스트 시나리오들
declare -a test_scenarios=(
    "오늘 등록된 상품 몇 개야?"
    "새 상품 등록해줘"
    "마켓 보여줘"
    "재고 보고서 알려줘"
    "축구화 찾아줘"
    "어제 등록한 상품은?"
    "현재 활성 상품 몇 개야?"
)

echo "🚀 완전 대화형 AI 음성 비서 테스트 시작..."
echo ""

# 각 시나리오별 테스트
for i in "${!test_scenarios[@]}"; do
    scenario="${test_scenarios[$i]}"
    echo "📝 테스트 $((i+1)): \"$scenario\""
    echo ""
    
    curl -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"$scenario\",
        \"items\": [
          {
            \"id\": \"item1\",
            \"title\": \"나이키 축구화\",
            \"price\": 60000,
            \"category\": \"축구화\",
            \"status\": \"active\",
            \"createdAt\": \"2025-10-15T10:00:00Z\"
          },
          {
            \"id\": \"item2\",
            \"title\": \"아디다스 유니폼\",
            \"price\": 45000,
            \"category\": \"유니폼\",
            \"status\": \"active\",
            \"createdAt\": \"2025-10-15T11:00:00Z\"
          }
        ],
        \"todayItems\": [
          {
            \"id\": \"item1\",
            \"title\": \"나이키 축구화\",
            \"createdAt\": \"2025-10-15T10:00:00Z\"
          }
        ],
        \"activeItems\": [
          {
            \"id\": \"item1\",
            \"title\": \"나이키 축구화\",
            \"status\": \"active\"
          },
          {
            \"id\": \"item2\",
            \"title\": \"아디다스 유니폼\",
            \"status\": \"active\"
          }
        ],
        \"mode\": \"voice-assistant\"
      }" \
      -w "\n\n⏱️ 응답 시간: %{time_total}초\n" \
      -s
    
    echo ""
    echo "✅ 테스트 $((i+1)) 완료!"
    echo "----------------------------------------"
    echo ""
done

echo "📋 예상 응답 형식:"
echo "{"
echo "  \"reply\": \"형님, 오늘 등록된 상품은 1개입니다. 전체 활성 상품은 2개입니다.\","
echo "  \"action\": \"navigate_upload\","
echo "  \"timestamp\": \"2025-10-15T14:30:00Z\""
echo "}"
echo ""
echo "🎙️ 완전 대화형 AI 음성 비서 특징:"
echo "- AI가 먼저 말 걸고 대화를 주도"
echo "- 사용자의 의도를 정확하게 파악"
echo "- 맥락을 이해하여 자연스러운 응답"
echo "- 필요시 자동으로 관련 페이지 이동"
echo "- 실시간 Firestore 데이터 반영"
echo "- 끊김 없는 대화 흐름 유지"
echo ""
echo "🔊 대화 시나리오 예시:"
echo "1. '안녕하세요' → '안녕하세요 형님! 무엇을 도와드릴까요?'"
echo "2. '새 상품 등록해줘' → '새 상품 등록을 도와드리겠습니다. 등록 페이지로 이동할까요?'"
echo "3. '오늘 등록된 상품 몇 개야?' → '오늘 등록된 상품은 1개입니다.'"
echo "4. '마켓 보여줘' → '마켓 페이지로 이동할까요?'"
echo "5. '재고 보고서 알려줘' → '재고 보고서를 확인해드리겠습니다.'"
echo ""
echo "⚡ 지원하는 액션:"
echo "- navigate_upload: 상품 등록 페이지로 이동"
echo "- navigate_market: 마켓 페이지로 이동"
echo "- navigate_report: 재고 보고서 페이지로 이동"
echo "- search_items: 상품 검색 페이지로 이동"
echo ""
echo "📋 다음 단계:"
echo "1. 응답이 정상적으로 오는지 확인"
echo "2. .env.local에서 VITE_OPENAI_PROXY_URL 업데이트"
echo "3. /voice-assistant 페이지에서 실제 테스트"
echo "4. 음성 대화가 정상 작동하는지 확인"
echo "5. 자동 액션 실행이 작동하는지 확인"
echo "6. 대화 맥락 이해가 정상 작동하는지 확인"
echo "7. 완전 대화형 AI 음성 비서 시스템 동작 확인"
echo ""
echo "🎯 사용자 경험:"
echo "- 페이지 접속 시 자동 인사말"
echo "- 음성으로 자연스러운 대화"
echo "- AI가 의도를 파악하여 적절한 응답"
echo "- 필요시 자동으로 관련 페이지 이동"
echo "- 끊김 없는 대화 흐름 유지"
