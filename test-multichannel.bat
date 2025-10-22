@echo off
echo 🚀 카카오톡 + 이메일 멀티 채널 알림 테스트 시작
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

echo ⚠️ 멀티 채널 테스트를 위해서는 다음 환경변수가 필요합니다:
echo.
echo 📱 카카오톡:
echo    KAKAO_ACCESS_TOKEN=카카오 개발자센터에서 발급받은 액세스 토큰
echo.
echo 📧 이메일:
echo    SMTP_HOST=smtp.gmail.com (또는 다른 SMTP 서버)
echo    SMTP_PORT=587
echo    SMTP_USERNAME=your-email@gmail.com
echo    SMTP_PASSWORD=your-app-password
echo.
echo 예시:
echo set KAKAO_ACCESS_TOKEN=your-kakao-access-token
echo set SMTP_USERNAME=your-email@gmail.com
echo set SMTP_PASSWORD=your-app-password
echo.

REM Node.js 스크립트 실행
node test-multichannel-integration.js

echo.
echo ✅ 테스트 완료!
echo 📱 카카오톡과 📧 이메일에서 알림을 확인해보세요.
echo.
echo 📋 확인 사항:
echo   1. 카카오톡에서 알림 메시지 수신
echo   2. 이메일 수신함 (스팸 폴더도 확인)
echo   3. n8n 워크플로우 실행 로그
pause
