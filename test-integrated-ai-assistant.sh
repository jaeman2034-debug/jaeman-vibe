#!/bin/bash
# 🚀 YAGO VIBE 통합형 AI 비서 테스트 스크립트

echo "🚀 YAGO VIBE 통합형 AI 비서 테스트"
echo "=================================="

# n8n 웹훅 URL (실제 URL로 변경하세요)
WEBHOOK_URL="https://your-n8n-domain.com/webhook/yago-voice-assistant"

echo "📡 웹훅 URL: $WEBHOOK_URL"
echo ""

# 테스트 시나리오들
declare -a test_scenarios=(
    "야고야 안녕"
    "야고야 고마워"
    "야고야 새 상품 등록해줘"
    "야고야 재고 보고서 알려줘"
    "야고야 오늘 등록된 상품 몇 개야?"
    "야고야 마켓 보여줘"
    "야고야 축구화 찾아줘"
    "야고야 근처 운동화 보여줘"
    "야고야 통계 분석해줘"
    "야고야 어제 판매된 상품 알려줘"
    "야고야 상품 목록 보여줘"
    "야고야 주변 신발 찾아줘"
)

echo "🚀 통합형 AI 비서 테스트 시작..."
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
          },
          {
            \"id\": \"item3\",
            \"title\": \"풋살화\",
            \"price\": 35000,
            \"category\": \"축구화\",
            \"status\": \"sold\",
            \"createdAt\": \"2025-10-14T15:00:00Z\"
          },
          {
            \"id\": \"item4\",
            \"title\": \"나이키 운동화\",
            \"price\": 80000,
            \"category\": \"운동화\",
            \"status\": \"active\",
            \"createdAt\": \"2025-10-15T12:00:00Z\"
          }
        ],
        \"todayItems\": [
          {
            \"id\": \"item1\",
            \"title\": \"나이키 축구화\",
            \"createdAt\": \"2025-10-15T10:00:00Z\"
          },
          {
            \"id\": \"item2\",
            \"title\": \"아디다스 유니폼\",
            \"createdAt\": \"2025-10-15T11:00:00Z\"
          },
          {
            \"id\": \"item4\",
            \"title\": \"나이키 운동화\",
            \"createdAt\": \"2025-10-15T12:00:00Z\"
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
          },
          {
            \"id\": \"item4\",
            \"title\": \"나이키 운동화\",
            \"status\": \"active\"
          }
        ],
        \"mode\": \"integrated-assistant\"
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
echo "  \"reply\": \"안녕하세요 형님! 야고 AI 비서입니다! 무엇을 도와드릴까요?\","
echo "  \"emotion\": \"happy\","
echo "  \"intent\": \"greeting\","
echo "  \"timestamp\": \"2025-10-15T15:30:00Z\""
echo "}"
echo ""
echo "🚀 통합형 AI 비서 특징:"
echo "- 기존 기능을 완전히 보존하면서 3D 아바타 통합"
echo "- '야고야 불러보기' 버튼으로 3D 아바타 등장"
echo "- 3D 아바타가 실시간으로 반응"
echo "- 감정에 따라 색상과 표정 변화"
echo "- AI가 말할 때 입 모양 동기화"
echo "- 실시간 상태 표시 (듣는 중, 말하는 중, 생각하는 중)"
echo "- 모든 대화가 Firestore에 자동 저장"
echo "- 감정 분석으로 적절한 반응"
echo "- 의도 인식으로 적절한 액션 제안"
echo ""
echo "🎭 아바타 감정 시스템:"
echo "- 기쁨 (happy): 노란색 😊"
echo "- 흥분 (excited): 주황색 🤩"
echo "- 슬픔 (sad): 회색 😢"
echo "- 중립 (neutral): 파란색 😐"
echo ""
echo "🎯 의도 인식 시스템:"
echo "- navigate_upload: 상품 등록 페이지로 이동"
echo "- navigate_market: 마켓 페이지로 이동"
echo "- navigate_report: 보고서 페이지로 이동"
echo "- show_stats: 통계 정보 표시"
echo "- greeting: 인사말 응답"
echo "- gratitude: 감사 표현 응답"
echo "- clarification: 명확화 요청"
echo "- search_items: 상품 검색"
echo "- nearby_search: 주변 상품 검색"
echo ""
echo "💫 3D 아바타 기술:"
echo "- Three.js로 구현된 실시간 3D 캐릭터"
echo "- 말할 때 입 모양이 실시간으로 움직임"
echo "- 감정에 따라 아바타 색상 변화"
echo "- 말할 때 아바타가 빛나는 발광 효과"
echo "- 말풍선 이모지로 대화 상태 표시"
echo "- 감정별 미세한 움직임 애니메이션"
echo ""
echo "🔊 아바타 반응 시나리오:"
echo "1. '야고야 안녕' → 기쁜 표정으로 '안녕하세요 형님! 야고 AI 비서입니다!'"
echo "2. '야고야 고마워' → 기쁜 표정으로 '천만에요 형님! 언제든지 도와드릴게요!'"
echo "3. '야고야 새 상품 등록해줘' → 기쁜 표정으로 '새 상품 등록을 도와드리겠습니다!'"
echo "4. '야고야 재고 보고서 알려줘' → 흥분한 표정으로 '재고 보고서를 확인해드리겠습니다!'"
echo "5. '야고야 오늘 등록된 상품 몇 개야?' → 중립 표정으로 '오늘 등록된 상품은 3개입니다.'"
echo "6. '야고야 마켓 보여줘' → 기쁜 표정으로 '마켓 페이지로 이동할까요?'"
echo "7. '야고야 축구화 찾아줘' → 흥분한 표정으로 '축구화를 찾고 계시는군요!'"
echo "8. '야고야 근처 운동화 보여줘' → 흥분한 표정으로 '주변 상품을 찾아드리겠습니다!'"
echo "9. '야고야 통계 분석해줘' → 흥분한 표정으로 '통계 분석을 도와드리겠습니다!'"
echo ""
echo "📋 다음 단계:"
echo "1. 응답이 정상적으로 오는지 확인"
echo "2. .env.local에서 VITE_OPENAI_PROXY_URL 업데이트"
echo "3. /ai-assistant 페이지에서 실제 테스트"
echo "4. '야고야 불러보기' 버튼 클릭하여 3D 아바타 등장 확인"
echo "5. 3D 아바타가 정상 렌더링되는지 확인"
echo "6. 음성 인식과 아바타 반응이 동기화되는지 확인"
echo "7. 감정 분석이 정상 작동하는지 확인"
echo "8. 의도 인식이 정상 작동하는지 확인"
echo "9. 대화 로그가 Firestore에 저장되는지 확인"
echo "10. 기존 기능이 완전히 보존되는지 확인"
echo "11. 완전 통합형 AI 비서 시스템 동작 확인"
echo ""
echo "🎯 사용자 경험:"
echo "- 페이지 접속 시 기존 기능 유지, '야고야 불러보기' 버튼 표시"
echo "- 버튼 클릭 시 3D 아바타 등장, 자동으로 인사말과 함께 기쁜 표정으로 반응"
echo "- 음성 입력 시 아바타가 듣는 상태로 변화"
echo "- AI 응답 시 아바타가 말할 때 입이 움직임"
echo "- 감정에 따라 아바타 색상과 표정이 실시간으로 변함"
echo "- 모든 상태를 시각적으로 확인 가능"
echo "- 마치 실제 캐릭터와 대화하는 것 같은 몰입감"
echo "- 사용자의 의도를 정확히 파악하여 적절한 액션 제안"
echo "- 기존 기능을 완전히 보존하면서 3D 아바타 통합"
