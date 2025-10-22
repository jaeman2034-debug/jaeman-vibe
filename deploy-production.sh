#!/bin/bash

# ===========================
# 🚀 야고 비서 완전 자동화 배포 스크립트
# ===========================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 함수
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🎙️ 야고 비서 완전 자동화 배포를 시작합니다..."

# 1️⃣ 환경변수 확인
log_info "환경변수 확인 중..."

required_vars=(
  "FIREBASE_PROJECT_ID"
  "KAKAO_JS_KEY"
  "KAKAO_MOBILITY_KEY"
  "FIREBASE_API_KEY"
  "FIREBASE_AUTH_DOMAIN"
  "FIREBASE_STORAGE_BUCKET"
  "FIREBASE_MESSAGING_SENDER_ID"
  "FIREBASE_APP_ID"
  "EXPO_TOKEN"
  "OPENAI_API_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    log_error "환경변수 $var가 설정되지 않았습니다."
    exit 1
  fi
done

log_success "환경변수 확인 완료"

# 2️⃣ Firebase Functions 배포
log_info "Firebase Functions 배포 중..."

cd functions

# 의존성 설치
npm ci

# Firebase 설정
firebase use $FIREBASE_PROJECT_ID

# API 키 설정
firebase functions:config:set \
  kakao.key="$KAKAO_MOBILITY_KEY" \
  openai.key="$OPENAI_API_KEY" \
  n8n.webhook="$N8N_WEBHOOK_URL"

# Functions 배포
firebase deploy --only functions,firestore,storage

log_success "Firebase Functions 배포 완료"

# 3️⃣ 웹 빌드 및 호스팅
log_info "웹 빌드 및 호스팅 중..."

cd ..

# 웹 의존성 설치
npm ci

# 웹 빌드
npm run build

# 웹 호스팅 배포
firebase deploy --only hosting

log_success "웹 호스팅 배포 완료"

# 4️⃣ 모바일 앱 빌드
log_info "모바일 앱 빌드 중..."

cd mobile

# 모바일 의존성 설치
npm ci

# Expo 로그인
echo "$EXPO_TOKEN" | npx expo login --non-interactive

# EAS 빌드 설정
npx eas build:configure

# EAS Secrets 설정
npx eas secret:create --scope project --name KAKAO_JS_KEY --value "$KAKAO_JS_KEY"
npx eas secret:create --scope project --name FUNCTIONS_PROXY --value "https://asia-northeast3-$FIREBASE_PROJECT_ID.cloudfunctions.net/getKakaoDirections"

# Android 빌드
log_info "Android 빌드 시작..."
npx eas build --platform android --profile production --non-interactive

# iOS 빌드
log_info "iOS 빌드 시작..."
npx eas build --platform ios --profile production --non-interactive

log_success "모바일 앱 빌드 완료"

# 5️⃣ 스토어 제출 (선택사항)
if [ "$SUBMIT_TO_STORE" = "true" ]; then
  log_info "스토어 제출 중..."
  
  npx eas submit --platform android --latest --non-interactive
  npx eas submit --platform ios --latest --non-interactive
  
  log_success "스토어 제출 완료"
fi

# 6️⃣ OTA 업데이트 (핫픽스)
if [ ! -z "$HOTFIX_MESSAGE" ]; then
  log_info "OTA 핫픽스 배포 중..."
  
  npx eas update --channel stable --message "$HOTFIX_MESSAGE"
  
  log_success "OTA 핫픽스 배포 완료"
fi

# 7️⃣ 배포 완료
log_success "🎉 야고 비서 완전 자동화 배포가 완료되었습니다!"

echo ""
echo "📱 배포 정보:"
echo "   - Firebase Functions: https://asia-northeast3-$FIREBASE_PROJECT_ID.cloudfunctions.net/getKakaoDirections"
echo "   - 웹 호스팅: https://$FIREBASE_PROJECT_ID.web.app"
echo "   - EAS 빌드: https://expo.dev/accounts/$(npx expo whoami)/projects/yago-assistant"
echo "   - Firebase Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID"

echo ""
echo "🔧 다음 단계:"
echo "   1. EAS 빌드 완료 후 다운로드 링크 확인"
echo "   2. 앱 설치 및 테스트"
echo "   3. n8n 워크플로우 활성화"
echo "   4. Slack/Telegram 알림 설정"

echo ""
log_success "배포 완료! 🚀"
