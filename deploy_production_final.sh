#!/bin/bash

# 🚀 프로덕션 최종 배포 스크립트

echo "🎯 프로덕션 최종 배포 시작..."

# 1. Functions 의존성 설치
echo "📦 Functions 의존성 설치 중..."
cd functions
npm install @firebase/rules-unit-testing ts-node typescript

# 2. Firestore 규칙 테스트
echo "🧪 Firestore 규칙 테스트 실행..."
npm run test:rules

# 3. Functions 빌드 및 배포
echo "🔧 Functions 빌드 및 배포 중..."
npm run build
firebase deploy --only functions

cd ..

# 4. Web 빌드 및 배포
echo "🌐 Web 빌드 및 배포 중..."
npm run build
firebase deploy --only hosting

# 5. Firestore 인덱스 배포
echo "📊 Firestore 인덱스 배포 중..."
firebase deploy --only firestore:indexes

# 6. 환경변수 설정 안내
echo ""
echo "🔧 환경변수 설정 안내:"
echo "다음 명령어로 환경변수를 설정하세요:"
echo ""
echo "# App Check"
echo "firebase functions:config:set recaptcha_v3_key=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
echo ""
echo "# Slack 알림"
echo "firebase functions:secrets:set SLACK_WEBHOOK_URL"
echo "firebase functions:config:set alert_min_interval_sec=120"
echo ""
echo "# 기타 시크릿"
echo "firebase functions:secrets:set CHECKIN_SECRET"
echo "firebase functions:secrets:set N8N_SHARED_SECRET"
echo "firebase functions:secrets:set TOSS_SECRET_KEY"
echo "firebase functions:secrets:set PORTONE_API_KEY"
echo "firebase functions:secrets:set PORTONE_API_SECRET"
echo ""

# 7. GitHub Actions 설정 안내
echo "🔄 GitHub Actions 설정 안내:"
echo "1. GitHub Repository Settings → Secrets and variables → Actions"
echo "2. FIREBASE_TOKEN 추가 (firebase login:ci로 발급)"
echo "3. CI/CD 파이프라인이 자동으로 작동합니다"
echo ""

# 8. App Check 설정 안내
echo "🔒 App Check 설정 안내:"
echo "1. Firebase Console → App Check"
echo "2. reCAPTCHA v3 사이트 키 등록"
echo "3. 웹 도메인 허용 설정"
echo ""

# 9. n8n 설정 안내
echo "🔧 n8n 설정 안내:"
echo "1. N8N_SECURITY_CHECKLIST.md 파일 참조"
echo "2. 환경변수 설정 확인"
echo "3. 워크플로우 보안 검증"
echo ""

echo "✅ 프로덕션 최종 배포 완료!"
echo ""
echo "🎯 배포된 기능들:"
echo "   - CI/CD 파이프라인 (GitHub Actions)"
echo "   - App Check 강제 (Callable 보호)"
echo "   - Firestore 규칙 유닛 테스트"
echo "   - Hosting 보안 헤더 (CSP 포함)"
echo "   - n8n 보안·안정 체크"
echo ""
echo "🚀 이제 운영 가능한 프로덕션 시스템이 준비되었습니다!"
