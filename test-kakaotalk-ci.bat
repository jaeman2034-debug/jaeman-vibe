@echo off
echo 📱 카카오톡 CI 알림 테스트
echo.

echo 🔧 환경 설정 확인...
if not defined N8N_KAKAO_WEBHOOK (
    echo ❌ N8N_KAKAO_WEBHOOK 환경변수가 설정되지 않았습니다.
    echo.
    echo 📝 설정 방법:
    echo 1. GitHub Secrets에 N8N_KAKAO_WEBHOOK 등록
    echo 2. 또는 로컬 테스트용:
    echo    set N8N_KAKAO_WEBHOOK=http://localhost:5678/webhook/ci-kakao-alert
    echo.
    pause
    exit /b 1
)

echo ✅ 환경 설정 완료
echo 📡 웹훅 URL: %N8N_KAKAO_WEBHOOK%
echo.

echo 🚀 카카오톡 CI 알림 테스트 실행...
node test-kakaotalk-ci.js

echo.
echo 📚 참고 문서:
echo - KAKAO_TALK_CI_TEMPLATE_GUIDE.md
echo - CI_NOTIFICATION_SETUP_GUIDE.md
echo - KAKAO_TALK_SETUP_GUIDE.md
echo.

pause
