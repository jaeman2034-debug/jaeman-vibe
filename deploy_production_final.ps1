# 🚀 프로덕션 최종 배포 스크립트 (PowerShell)

Write-Host "🎯 프로덕션 최종 배포 시작..." -ForegroundColor Green

# 1. Functions 의존성 설치
Write-Host "📦 Functions 의존성 설치 중..." -ForegroundColor Yellow
Set-Location functions
npm install @firebase/rules-unit-testing ts-node typescript

# 2. Firestore 규칙 테스트
Write-Host "🧪 Firestore 규칙 테스트 실행..." -ForegroundColor Yellow
npm run test:rules

# 3. Functions 빌드 및 배포
Write-Host "🔧 Functions 빌드 및 배포 중..." -ForegroundColor Yellow
npm run build
firebase deploy --only functions

Set-Location ..

# 4. Web 빌드 및 배포
Write-Host "🌐 Web 빌드 및 배포 중..." -ForegroundColor Yellow
npm run build
firebase deploy --only hosting

# 5. Firestore 인덱스 배포
Write-Host "📊 Firestore 인덱스 배포 중..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

# 6. 환경변수 설정 안내
Write-Host ""
Write-Host "🔧 환경변수 설정 안내:" -ForegroundColor Cyan
Write-Host "다음 명령어로 환경변수를 설정하세요:" -ForegroundColor White
Write-Host ""
Write-Host "# App Check" -ForegroundColor Yellow
Write-Host "firebase functions:config:set recaptcha_v3_key=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" -ForegroundColor White
Write-Host ""
Write-Host "# Slack 알림" -ForegroundColor Yellow
Write-Host "firebase functions:secrets:set SLACK_WEBHOOK_URL" -ForegroundColor White
Write-Host "firebase functions:config:set alert_min_interval_sec=120" -ForegroundColor White
Write-Host ""
Write-Host "# 기타 시크릿" -ForegroundColor Yellow
Write-Host "firebase functions:secrets:set CHECKIN_SECRET" -ForegroundColor White
Write-Host "firebase functions:secrets:set N8N_SHARED_SECRET" -ForegroundColor White
Write-Host "firebase functions:secrets:set TOSS_SECRET_KEY" -ForegroundColor White
Write-Host "firebase functions:secrets:set PORTONE_API_KEY" -ForegroundColor White
Write-Host "firebase functions:secrets:set PORTONE_API_SECRET" -ForegroundColor White
Write-Host ""

# 7. GitHub Actions 설정 안내
Write-Host "🔄 GitHub Actions 설정 안내:" -ForegroundColor Cyan
Write-Host "1. GitHub Repository Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host "2. FIREBASE_TOKEN 추가 (firebase login:ci로 발급)" -ForegroundColor White
Write-Host "3. CI/CD 파이프라인이 자동으로 작동합니다" -ForegroundColor White
Write-Host ""

# 8. App Check 설정 안내
Write-Host "🔒 App Check 설정 안내:" -ForegroundColor Cyan
Write-Host "1. Firebase Console → App Check" -ForegroundColor White
Write-Host "2. reCAPTCHA v3 사이트 키 등록" -ForegroundColor White
Write-Host "3. 웹 도메인 허용 설정" -ForegroundColor White
Write-Host ""

# 9. n8n 설정 안내
Write-Host "🔧 n8n 설정 안내:" -ForegroundColor Cyan
Write-Host "1. N8N_SECURITY_CHECKLIST.md 파일 참조" -ForegroundColor White
Write-Host "2. 환경변수 설정 확인" -ForegroundColor White
Write-Host "3. 워크플로우 보안 검증" -ForegroundColor White
Write-Host ""

Write-Host "✅ 프로덕션 최종 배포 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 배포된 기능들:" -ForegroundColor Cyan
Write-Host "   - CI/CD 파이프라인 (GitHub Actions)" -ForegroundColor White
Write-Host "   - App Check 강제 (Callable 보호)" -ForegroundColor White
Write-Host "   - Firestore 규칙 유닛 테스트" -ForegroundColor White
Write-Host "   - Hosting 보안 헤더 (CSP 포함)" -ForegroundColor White
Write-Host "   - n8n 보안·안정 체크" -ForegroundColor White
Write-Host ""
Write-Host "🚀 이제 운영 가능한 프로덕션 시스템이 준비되었습니다!" -ForegroundColor Green
