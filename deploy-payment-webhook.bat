@echo off
echo Toss Webhook + 결제 관리 시스템 배포를 시작합니다...

echo.
echo 1. Functions 빌드 중...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo Functions 빌드 실패!
    pause
    exit /b 1
)

echo.
echo 2. Cloud Functions 배포 중...
cd ..
firebase deploy --only functions:tossWebhook
if %errorlevel% neq 0 (
    echo Cloud Functions 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ Toss Webhook + 결제 관리 시스템 배포가 완료되었습니다!
echo.
echo 배포된 함수들:
echo - tossWebhook: Toss 결제 웹훅 처리 (서명검증 + 멱등)
echo.
echo 업데이트된 기능:
echo - confirmPayment: 멱등 처리 보강
echo - PaymentsPanel: 결제 관리 UI (필터/환불/CSV)
echo.
echo 설정 필요:
echo 1. Functions 환경변수 설정:
echo    firebase functions:config:set toss.secret_key="test_sk_xxx"
echo    firebase functions:config:set toss.webhook_secret="whsec_xxx"
echo.
echo 2. Toss 결제 설정:
echo    - 웹훅 URL: https://your-project.cloudfunctions.net/tossWebhook
echo    - 서명 검증: SHA256 HMAC
echo.
echo 테스트 방법:
echo 1. 결제 완료 후 웹훅 도착 확인
echo 2. 관리 탭에서 결제 목록 확인
echo 3. 상태 필터링 및 CSV 다운로드 테스트
echo 4. 환불 기능 테스트
echo.
pause
