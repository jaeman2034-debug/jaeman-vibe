#!/bin/bash

# N8N 워크플로우 + Meetup 상세 페이지 테스트 스크립트

BASE_URL="http://127.0.0.1"
echo "🧪 YAGO Stack 테스트 시작..."

# 1. 예약 생성 테스트
echo "📝 1. 예약 생성 테스트"
RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/reserve" \
  -H 'Content-Type: application/json' \
  -d '{"meetupId":"test-meetup-1","user":{"name":"테스터","uid":"test-user-123"}}')

echo "응답: $RESPONSE"

# JSON에서 reservationId 추출
RESERVATION_ID=$(echo $RESPONSE | jq -r '.reservationId')
QR_URL=$(echo $RESPONSE | jq -r '.qrPngUrl')
CHECKIN_URL=$(echo $RESPONSE | jq -r '.checkinUrl')

if [ "$RESERVATION_ID" != "null" ] && [ "$RESERVATION_ID" != "" ]; then
  echo "✅ 예약 생성 성공: $RESERVATION_ID"
  echo "🔗 QR URL: $QR_URL"
  echo "🔗 체크인 URL: $CHECKIN_URL"
else
  echo "❌ 예약 생성 실패"
  exit 1
fi

# 2. QR 이미지 확인
echo ""
echo "📱 2. QR 이미지 확인"
QR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$QR_URL")
if [ "$QR_STATUS" = "200" ]; then
  echo "✅ QR 이미지 생성 성공"
  echo "🔗 브라우저에서 열기: $QR_URL"
else
  echo "❌ QR 이미지 생성 실패 (HTTP $QR_STATUS)"
fi

# 3. 체크인 테스트
echo ""
echo "🎫 3. 체크인 테스트"
# URL에서 id와 sig 추출
CHECKIN_ID=$(echo $CHECKIN_URL | grep -o 'id=[^&]*' | cut -d'=' -f2)
CHECKIN_SIG=$(echo $CHECKIN_URL | grep -o 'sig=[^&]*' | cut -d'=' -f2)

CHECKIN_RESPONSE=$(curl -s "$BASE_URL/checkin?id=$CHECKIN_ID&sig=$CHECKIN_SIG")
echo "체크인 응답: $CHECKIN_RESPONSE"

CHECKIN_OK=$(echo $CHECKIN_RESPONSE | jq -r '.ok')
if [ "$CHECKIN_OK" = "true" ]; then
  echo "✅ 체크인 성공"
else
  echo "❌ 체크인 실패"
fi

# 4. SNS 포스팅 테스트
echo ""
echo "📢 4. SNS 포스팅 테스트"
SNS_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/post-published" \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "test-post-'$(date +%s)'",
    "title": "야고스포츠 테스트 모임",
    "summary": "축구 모임 테스트입니다",
    "url": "https://example.com/meetup/test"
  }')

echo "SNS 응답: $SNS_RESPONSE"

SNS_OK=$(echo $SNS_RESPONSE | jq -r '.id')
if [ "$SNS_OK" != "null" ] && [ "$SNS_OK" != "" ]; then
  echo "✅ SNS 포스팅 워크플로우 트리거 성공"
else
  echo "❌ SNS 포스팅 워크플로우 트리거 실패"
fi

# 5. 팀 블로그 생성 테스트
echo ""
echo "📝 5. 팀 블로그 생성 테스트"
BLOG_RESPONSE=$(curl -s -X POST "$BASE_URL/team-blog-create" \
  -H 'Content-Type: application/json' \
  -d '{
    "clubId": "test-club-'$(date +%s)'",
    "clubName": "테스트 FC",
    "sport": "soccer",
    "region": "서울 강남구",
    "description": "테스트용 축구 클럽입니다"
  }')

echo "팀 블로그 응답: $BLOG_RESPONSE"

BLOG_OK=$(echo $BLOG_RESPONSE | jq -r '.ok')
if [ "$BLOG_OK" = "true" ]; then
  echo "✅ 팀 블로그 생성 워크플로우 트리거 성공"
else
  echo "❌ 팀 블로그 생성 워크플로우 트리거 실패"
fi

echo ""
echo "🎉 테스트 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저에서 QR 이미지 확인: $QR_URL"
echo "2. 체크인 URL 테스트: $CHECKIN_URL"
echo "3. N8N 워크플로우가 실행되었는지 확인"
echo "4. Notion 데이터베이스에 페이지가 생성되었는지 확인"
