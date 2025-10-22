#!/bin/bash
# 🎙️ YAGO VIBE AI 재고/조회/판매 알림 어시스턴트 테스트 스크립트

echo "🎙️ YAGO VIBE AI 재고/조회/판매 알림 어시스턴트 테스트"
echo "=================================================="

# n8n 웹훅 URL (실제 URL로 변경하세요)
WEBHOOK_URL="https://your-n8n-domain.com/webhook/voice-report"

echo "📡 웹훅 URL: $WEBHOOK_URL"
echo ""

# 1. 전체 재고 보고서 테스트
echo "🚀 1. 전체 재고 보고서 테스트..."
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "daily-inventory-summary"
  }' \
  -w "\n\n⏱️ 응답 시간: %{time_total}초\n" \
  -s

echo ""
echo "✅ 전체 재고 보고서 테스트 완료!"
echo ""

# 2. 실시간 상태 조회 테스트
echo "🚀 2. 실시간 상태 조회 테스트..."
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "realtime-stats"
  }' \
  -w "\n\n⏱️ 응답 시간: %{time_total}초\n" \
  -s

echo ""
echo "✅ 실시간 상태 조회 테스트 완료!"
echo ""

# 3. 트렌드 분석 테스트
echo "🚀 3. 트렌드 분석 테스트..."
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "trend-analysis"
  }' \
  -w "\n\n⏱️ 응답 시간: %{time_total}초\n" \
  -s

echo ""
echo "✅ 트렌드 분석 테스트 완료!"
echo ""

echo "📋 예상 응답 형식:"
echo "{"
echo "  \"message\": \"형님, 현재 등록된 상품은 총 8개입니다. 활성 상품은 6개, 거래 완료된 상품은 2개입니다. AI가 자동 생성한 상품은 5개, 음성으로 등록된 상품은 3개입니다. 가장 인기 있는 카테고리는 축구화로 3개가 등록되어 있습니다.\","
echo "  \"timestamp\": \"2025-10-15T09:00:00Z\","
echo "  \"stats\": {"
echo "    \"totalItems\": 8,"
echo "    \"activeItems\": 6,"
echo "    \"soldItems\": 2,"
echo "    \"aiGeneratedItems\": 5,"
echo "    \"voiceEnabledItems\": 3,"
echo "    \"categoryStats\": {"
echo "      \"축구화\": 3,"
echo "      \"운동화\": 2,"
echo "      \"유니폼\": 1,"
echo "      \"글러브\": 1,"
echo "      \"기타\": 1"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "🎙️ AI 재고 어시스턴트 특징:"
echo "- 매일 오전 9시 자동 실행"
echo "- Firestore 데이터 실시간 분석"
echo "- OpenAI GPT로 자연스러운 한국어 요약"
echo "- 모든 보고서를 음성으로 자동 안내"
echo "- 실시간 상태 조회 및 트렌드 분석"
echo ""
echo "🔊 음성 보고서 시나리오:"
echo "1. '형님, 현재 등록된 상품은 총 8개입니다.'"
echo "2. '활성 상품은 6개, 거래 완료된 상품은 2개입니다.'"
echo "3. 'AI가 자동 생성한 상품은 5개, 음성으로 등록된 상품은 3개입니다.'"
echo "4. '가장 인기 있는 카테고리는 축구화로 3개가 등록되어 있습니다.'"
echo ""
echo "📋 다음 단계:"
echo "1. 응답이 정상적으로 오는지 확인"
echo "2. .env.local에서 VITE_OPENAI_PROXY_URL 업데이트"
echo "3. /voice-report 페이지에서 실제 테스트"
echo "4. 음성 보고서가 정상 작동하는지 확인"
echo "5. 실시간 상태 조회가 작동하는지 확인"
echo "6. 트렌드 분석이 작동하는지 확인"
echo "7. 완전 자율형 AI 운영 비서 시스템 동작 확인"
echo ""
echo "🎯 스케줄링 설정:"
echo "- 매일 오전 9시: 0 9 * * *"
echo "- 매일 오후 6시: 0 18 * * *"
echo "- 주 1회 (월요일): 0 9 * * 1"
echo "- 상품 등록 후 1시간: 웹훅 트리거 사용"
