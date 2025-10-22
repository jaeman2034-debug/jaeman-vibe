@echo off
echo 🚀 카카오톡 알림톡 n8n 연동 테스트 시작
echo.

REM 환경변수 설정 (로컬 개발용)
set N8N_WEBHOOK_ENROLL=http://localhost:5678/webhook/enroll
set N8N_WEBHOOK_PAYMENT=http://localhost:5678/webhook/payment
set N8N_TOKEN=n8n_default_token_please_change

echo 🔧 환경변수 설정:
echo N8N_WEBHOOK_ENROLL=%N8N_WEBHOOK_ENROLL%
echo N8N_WEBHOOK_PAYMENT=%N8N_WEBHOOK_PAYMENT%
echo N8N_TOKEN=%N8N_TOKEN%
echo.

echo ⚠️ 카카오톡 API 테스트를 위해서는 KAKAO_ACCESS_TOKEN 환경변수가 필요합니다.
echo 카카오 개발자센터에서 발급받은 액세스 토큰을 설정해주세요.
echo.

REM Node.js 스크립트 실행
node test-kakaotalk-integration.js

echo.
echo ✅ 테스트 완료!
echo 📱 카카오톡에서 알림 메시지를 확인해보세요.
pause
