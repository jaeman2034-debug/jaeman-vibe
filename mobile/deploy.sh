#!/bin/bash

# ===========================
# 🚀 야고 비서 원클릭 배포 스크립트
# ===========================

echo "🎙️ 야고 비서 원클릭 배포를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 에러 처리
set -e

# 함수 정의
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1️⃣ 환경 확인
log_info "환경 확인 중..."

# Node.js 버전 확인
if ! command -v node &> /dev/null; then
    log_error "Node.js가 설치되지 않았습니다."
    exit 1
fi

# Firebase CLI 확인
if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI가 설치되지 않았습니다. 'npm install -g firebase-tools'를 실행하세요."
    exit 1
fi

# Expo CLI 확인
if ! command -v expo &> /dev/null; then
    log_error "Expo CLI가 설치되지 않았습니다. 'npm install -g @expo/cli'를 실행하세요."
    exit 1
fi

log_success "환경 확인 완료"

# 2️⃣ Firebase Functions 배포
log_info "Firebase Functions 배포 중..."

cd ../functions

# 의존성 설치
log_info "Functions 의존성 설치 중..."
npm install

# Firebase Functions 설정 확인
if [ -z "$FIREBASE_PROJECT_ID" ]; then
    log_warning "FIREBASE_PROJECT_ID 환경변수가 설정되지 않았습니다."
    read -p "Firebase 프로젝트 ID를 입력하세요: " FIREBASE_PROJECT_ID
    export FIREBASE_PROJECT_ID
fi

# Firebase 프로젝트 설정
firebase use $FIREBASE_PROJECT_ID

# Kakao API 키 설정 확인
if [ -z "$KAKAO_MOBILITY_KEY" ]; then
    log_warning "KAKAO_MOBILITY_KEY 환경변수가 설정되지 않았습니다."
    read -p "Kakao Mobility API 키를 입력하세요: " KAKAO_MOBILITY_KEY
fi

# Firebase Functions 설정
firebase functions:config:set kakao.key="$KAKAO_MOBILITY_KEY"

# n8n 웹훅 설정 (선택사항)
if [ ! -z "$N8N_WEBHOOK_URL" ]; then
    firebase functions:config:set n8n.webhook="$N8N_WEBHOOK_URL"
    log_info "n8n 웹훅 설정 완료"
fi

# Functions 배포
log_info "Firebase Functions 배포 중..."
firebase deploy --only functions:getKakaoDirections

log_success "Firebase Functions 배포 완료"

# 3️⃣ 모바일 앱 빌드 준비
log_info "모바일 앱 빌드 준비 중..."

cd ../mobile

# 의존성 설치
log_info "모바일 앱 의존성 설치 중..."
npm install

# Expo 로그인 확인
log_info "Expo 로그인 상태 확인 중..."
if ! expo whoami &> /dev/null; then
    log_warning "Expo에 로그인되지 않았습니다."
    expo login
fi

log_success "Expo 로그인 완료: $(expo whoami)"

# 4️⃣ 환경변수 설정
log_info "환경변수 설정 중..."

# app.json에서 Firebase Functions URL 업데이트
FUNCTIONS_URL="https://asia-northeast3-$FIREBASE_PROJECT_ID.cloudfunctions.net/getKakaoDirections"
sed -i.bak "s|YOUR_PROJECT_ID|$FIREBASE_PROJECT_ID|g" app.json

log_info "Functions URL: $FUNCTIONS_URL"

# Kakao JavaScript 키 설정 확인
if [ -z "$KAKAO_JS_KEY" ]; then
    log_warning "KAKAO_JS_KEY 환경변수가 설정되지 않았습니다."
    read -p "Kakao JavaScript API 키를 입력하세요: " KAKAO_JS_KEY
fi

# app.json에서 Kakao 키 업데이트
sed -i.bak "s|YOUR_KAKAO_JS_KEY|$KAKAO_JS_KEY|g" app.json

# Firebase 설정 업데이트
if [ ! -z "$FIREBASE_API_KEY" ]; then
    sed -i.bak "s|YOUR_FIREBASE_API_KEY|$FIREBASE_API_KEY|g" app.json
fi

if [ ! -z "$FIREBASE_AUTH_DOMAIN" ]; then
    sed -i.bak "s|YOUR_FIREBASE_AUTH_DOMAIN|$FIREBASE_AUTH_DOMAIN|g" app.json
fi

if [ ! -z "$FIREBASE_PROJECT_ID" ]; then
    sed -i.bak "s|YOUR_FIREBASE_PROJECT_ID|$FIREBASE_PROJECT_ID|g" app.json
fi

if [ ! -z "$FIREBASE_STORAGE_BUCKET" ]; then
    sed -i.bak "s|YOUR_FIREBASE_STORAGE_BUCKET|$FIREBASE_STORAGE_BUCKET|g" app.json
fi

if [ ! -z "$FIREBASE_MESSAGING_SENDER_ID" ]; then
    sed -i.bak "s|YOUR_FIREBASE_MESSAGING_SENDER_ID|$FIREBASE_MESSAGING_SENDER_ID|g" app.json
fi

if [ ! -z "$FIREBASE_APP_ID" ]; then
    sed -i.bak "s|YOUR_FIREBASE_APP_ID|$FIREBASE_APP_ID|g" app.json
fi

log_success "환경변수 설정 완료"

# 5️⃣ EAS 빌드 설정
log_info "EAS 빌드 설정 중..."

# EAS 설정 초기화
npx eas build:configure

log_success "EAS 빌드 설정 완료"

# 6️⃣ 빌드 옵션 선택
log_info "빌드 옵션을 선택하세요:"
echo "1) 개발 빌드 (테스트용)"
echo "2) 프리뷰 빌드 (내부 배포)"
echo "3) 프로덕션 빌드 (스토어 제출용)"
echo "4) 모든 플랫폼 빌드"
echo "5) iOS만 빌드"
echo "6) Android만 빌드"

read -p "선택 (1-6): " BUILD_OPTION

case $BUILD_OPTION in
    1)
        log_info "개발 빌드 시작..."
        npx eas build --platform all --profile development
        ;;
    2)
        log_info "프리뷰 빌드 시작..."
        npx eas build --platform all --profile preview
        ;;
    3)
        log_info "프로덕션 빌드 시작..."
        npx eas build --platform all --profile production
        ;;
    4)
        log_info "모든 플랫폼 빌드 시작..."
        npx eas build --platform all --profile preview
        ;;
    5)
        log_info "iOS 빌드 시작..."
        npx eas build --platform ios --profile preview
        ;;
    6)
        log_info "Android 빌드 시작..."
        npx eas build --platform android --profile preview
        ;;
    *)
        log_error "잘못된 선택입니다."
        exit 1
        ;;
esac

log_success "빌드 완료!"

# 7️⃣ 스토어 제출 (선택사항)
read -p "스토어에 자동 제출하시겠습니까? (y/N): " SUBMIT_TO_STORE

if [[ $SUBMIT_TO_STORE =~ ^[Yy]$ ]]; then
    log_info "스토어 제출 준비 중..."
    
    # iOS 제출
    if [[ $BUILD_OPTION == "1" || $BUILD_OPTION == "2" || $BUILD_OPTION == "3" || $BUILD_OPTION == "4" || $BUILD_OPTION == "5" ]]; then
        log_info "iOS 스토어 제출 중..."
        npx eas submit --platform ios --latest
    fi
    
    # Android 제출
    if [[ $BUILD_OPTION == "1" || $BUILD_OPTION == "2" || $BUILD_OPTION == "3" || $BUILD_OPTION == "4" || $BUILD_OPTION == "6" ]]; then
        log_info "Android 스토어 제출 중..."
        npx eas submit --platform android --latest
    fi
    
    log_success "스토어 제출 완료!"
fi

# 8️⃣ 웹 호스팅 (선택사항)
read -p "웹 버전도 배포하시겠습니까? (y/N): " DEPLOY_WEB

if [[ $DEPLOY_WEB =~ ^[Yy]$ ]]; then
    log_info "웹 버전 빌드 중..."
    
    # 웹 빌드
    npx expo export --platform web
    
    # Firebase 호스팅 배포
    cd ../
    if [ ! -f "firebase.json" ]; then
        log_info "Firebase 호스팅 초기화 중..."
        firebase init hosting
    fi
    
    log_info "Firebase 호스팅 배포 중..."
    firebase deploy --only hosting
    
    log_success "웹 버전 배포 완료!"
fi

# 9️⃣ 배포 완료
log_success "🎉 야고 비서 원클릭 배포가 완료되었습니다!"
echo ""
echo "📱 앱 정보:"
echo "   - Firebase Functions: https://asia-northeast3-$FIREBASE_PROJECT_ID.cloudfunctions.net/getKakaoDirections"
echo "   - EAS 빌드: https://expo.dev/accounts/$(expo whoami)/projects/yago-assistant"
if [[ $DEPLOY_WEB =~ ^[Yy]$ ]]; then
    echo "   - 웹 버전: https://$FIREBASE_PROJECT_ID.web.app"
fi
echo ""
echo "🔧 다음 단계:"
echo "   1. EAS 빌드 완료 후 다운로드 링크 확인"
echo "   2. 앱 설치 및 테스트"
echo "   3. 스토어 제출 (프로덕션 빌드인 경우)"
echo "   4. 사용자 피드백 수집"
echo ""
echo "📞 지원:"
echo "   - Firebase Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID"
echo "   - Expo Dashboard: https://expo.dev/accounts/$(expo whoami)/projects/yago-assistant"
echo ""
log_success "배포 완료! 🚀"
