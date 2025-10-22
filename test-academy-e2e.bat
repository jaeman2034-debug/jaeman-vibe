@echo off
echo 🚀 아카데미 알림 시스템 E2E 테스트 시작
echo.

echo 📋 테스트 실행 순서:
echo 1. Firebase Emulators 시작
echo 2. n8n 워크플로우 활성화
echo 3. Cypress 테스트 실행
echo.

echo ⚠️ 사전 준비사항:
echo - Firebase 프로젝트 설정 완료
echo - n8n 인스턴스 실행 중
echo - 카카오톡 + 이메일 워크플로우 활성화
echo.

echo 🔧 환경변수 확인:
echo VITE_FB_API_KEY=%VITE_FB_API_KEY%
echo VITE_FB_PROJECT_ID=%VITE_FB_PROJECT_ID%
echo N8N_WEBHOOK_ENROLL=%N8N_WEBHOOK_ENROLL%
echo N8N_WEBHOOK_PAYMENT=%N8N_WEBHOOK_PAYMENT%
echo.

echo 📝 테스트 시나리오:
echo 1. 수강 신청 → Firestore 저장 → n8n Webhook 호출
echo 2. 결제 완료 → Firestore 업데이트 → n8n Webhook 호출
echo 3. 카카오톡 + 이메일 동시 발송 확인
echo.

echo 🎯 실행할 명령어들:
echo.
echo 1. Firebase Emulators 시작:
echo    firebase emulators:start --only firestore,functions
echo.
echo 2. Cypress 테스트 실행:
echo    npm run cypress:open
echo.
echo 3. 또는 헤드리스 모드:
echo    npm run cypress:run
echo.

echo ✅ 준비 완료! 위 명령어들을 순서대로 실행하세요.
pause
