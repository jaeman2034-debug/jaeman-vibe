#!/bin/bash

# 이중허용 시크릿 검증 테스트 스크립트
# 사용법: ./test-secret-rotation.sh <FUNCTIONS_HOST> <N8N_SHARED_SECRET> <N8N_SHARED_SECRET_OLD>

FUNCTIONS_HOST=$1
NEW_SECRET=$2
OLD_SECRET=$3

if [ -z "$FUNCTIONS_HOST" ] || [ -z "$NEW_SECRET" ] || [ -z "$OLD_SECRET" ]; then
    echo "사용법: $0 <FUNCTIONS_HOST> <N8N_SHARED_SECRET> <N8N_SHARED_SECRET_OLD>"
    echo "예시: $0 https://asia-northeast3-your-project.cloudfunctions.net abc123 def456"
    exit 1
fi

echo "🔍 이중허용 시크릿 검증 테스트"
echo "Functions Host: $FUNCTIONS_HOST"
echo ""

# 새 키로 테스트
echo "1️⃣ 새 키로 fanoutAck 테스트..."
RESPONSE1=$(curl -s -X POST "$FUNCTIONS_HOST/fanoutAck" \
  -H "Content-Type: application/json" \
  -H "x-auth: $NEW_SECRET" \
  -d '{"eventId":"E1","outboxId":"X","channel":"email","ok":true}')

if echo "$RESPONSE1" | grep -q '"ok":true'; then
    echo "✅ 새 키 테스트 성공"
else
    echo "❌ 새 키 테스트 실패: $RESPONSE1"
fi

echo ""

# 구 키로 테스트 (회전 윈도우 동안만 허용)
echo "2️⃣ 구 키로 fanoutAck 테스트..."
RESPONSE2=$(curl -s -X POST "$FUNCTIONS_HOST/fanoutAck" \
  -H "Content-Type: application/json" \
  -H "x-auth: $OLD_SECRET" \
  -d '{"eventId":"E1","outboxId":"X","channel":"email","ok":true}')

if echo "$RESPONSE2" | grep -q '"ok":true'; then
    echo "✅ 구 키 테스트 성공 (이중허용 정상)"
else
    echo "❌ 구 키 테스트 실패: $RESPONSE2"
fi

echo ""

# 잘못된 키로 테스트
echo "3️⃣ 잘못된 키로 fanoutAck 테스트..."
RESPONSE3=$(curl -s -X POST "$FUNCTIONS_HOST/fanoutAck" \
  -H "Content-Type: application/json" \
  -H "x-auth: invalid-key" \
  -d '{"eventId":"E1","outboxId":"X","channel":"email","ok":true}')

if echo "$RESPONSE3" | grep -q '"error":"UNAUTHORIZED"'; then
    echo "✅ 잘못된 키 거부 정상"
else
    echo "❌ 잘못된 키 거부 실패: $RESPONSE3"
fi

echo ""
echo "🎯 테스트 완료!"
