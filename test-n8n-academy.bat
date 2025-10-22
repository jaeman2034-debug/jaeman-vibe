@echo off
echo 🚀 n8n 아카데미 알림 시스템 테스트 시작
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

REM Node.js 스크립트 실행
node test-n8n-academy-integration.js

echo.
echo ✅ 테스트 완료!
pause
