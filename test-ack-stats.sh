#!/bin/bash

# ACK 집계 함수 테스트 스크립트
# 사용법: ./test-ack-stats.sh <FUNCTIONS_HOST> [MINUTES]

FUNCTIONS_HOST=$1
MINUTES=${2:-15}

if [ -z "$FUNCTIONS_HOST" ]; then
    echo "사용법: $0 <FUNCTIONS_HOST> [MINUTES]"
    echo "예시: $0 https://asia-northeast3-your-project.cloudfunctions.net 60"
    exit 1
fi

echo "🔍 ACK 집계 함수 테스트"
echo "Functions Host: $FUNCTIONS_HOST"
echo "집계 구간: ${MINUTES}분"
echo ""

# ACK 집계 테스트
echo "1️⃣ ACK 집계 데이터 조회..."
RESPONSE=$(curl -s "$FUNCTIONS_HOST/ackz?m=$MINUTES")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ ACK 집계 조회 성공"
    echo ""
    echo "📊 집계 결과:"
    echo "$RESPONSE" | jq '.'
    
    # 성공률 확인
    RATE=$(echo "$RESPONSE" | jq -r '.ackRate // 0')
    P90=$(echo "$RESPONSE" | jq -r '.p90Sec // null')
    TOTAL=$(echo "$RESPONSE" | jq -r '.total // 0')
    
    echo ""
    echo "📈 핵심 지표:"
    echo "  - 성공률: $(echo "scale=1; $RATE * 100" | bc)%"
    echo "  - P90 지연: ${P90}s"
    echo "  - 총 건수: $TOTAL"
    
    # SLA 체크
    RATE_PCT=$(echo "scale=0; $RATE * 100" | bc)
    if [ "$RATE_PCT" -ge 90 ] && ([ "$P90" = "null" ] || [ "${P90%.*}" -le 60 ]); then
        echo "  - SLA 상태: ✅ 정상"
    elif [ "$RATE_PCT" -lt 50 ]; then
        echo "  - SLA 상태: ❌ 오류"
    else
        echo "  - SLA 상태: ⚠️ 경고"
    fi
else
    echo "❌ ACK 집계 조회 실패: $RESPONSE"
fi

echo ""
echo "🎯 테스트 완료!"
