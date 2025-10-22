@echo off
echo 🚀 아카데미 알림 시스템 전체 테스트 스위트 실행
echo.

echo 📋 테스트 구성요소:
echo 1. Firebase Functions (n8n webhook 호출)
echo 2. n8n 워크플로우 (카카오톡 + 이메일)
echo 3. Cypress E2E 테스트 (전체 플로우 검증)
echo.

echo ⚠️ 사전 준비사항 확인:
echo.

REM 환경변수 확인
echo 🔧 환경변수:
if defined VITE_FB_API_KEY (
    echo ✅ VITE_FB_API_KEY: 설정됨
) else (
    echo ❌ VITE_FB_API_KEY: 설정되지 않음
)

if defined VITE_FB_PROJECT_ID (
    echo ✅ VITE_FB_PROJECT_ID: 설정됨
) else (
    echo ❌ VITE_FB_PROJECT_ID: 설정되지 않음
)

if defined N8N_WEBHOOK_ENROLL (
    echo ✅ N8N_WEBHOOK_ENROLL: %N8N_WEBHOOK_ENROLL%
) else (
    echo ❌ N8N_WEBHOOK_ENROLL: 설정되지 않음
)

if defined N8N_WEBHOOK_PAYMENT (
    echo ✅ N8N_WEBHOOK_PAYMENT: %N8N_WEBHOOK_PAYMENT%
) else (
    echo ❌ N8N_WEBHOOK_PAYMENT: 설정되지 않음
)

echo.

REM 포트 확인
echo 🔍 포트 상태 확인:
netstat -an | findstr :8080 >nul
if %errorlevel% equ 0 (
    echo ✅ 포트 8080: 사용 중 (Firebase Emulators)
) else (
    echo ❌ 포트 8080: 사용되지 않음
)

netstat -an | findstr :9099 >nul
if %errorlevel% equ 0 (
    echo ✅ 포트 9099: 사용 중 (Firebase Functions)
) else (
    echo ❌ 포트 9099: 사용되지 않음
)

netstat -an | findstr :5678 >nul
if %errorlevel% equ 0 (
    echo ✅ 포트 5678: 사용 중 (n8n)
) else (
    echo ❌ 포트 5678: 사용되지 않음
)

echo.

echo 📝 실행할 명령어들:
echo.
echo 1. Firebase Emulators 시작:
echo    firebase emulators:start --only firestore
echo.
echo 2. 시드 데이터 생성 (선택사항):
echo    npm run seed:academy
echo    또는 확장 버전: npm run seed:academy:extended
echo.
echo 3. n8n 워크플로우 활성화 확인:
echo    - 브라우저에서 http://localhost:5678 접속
echo    - "Academy Kakao + Email Alerts" 워크플로우 활성화
echo.
echo 4. Cypress 테스트 실행:
echo    npm run test:academy-alerts:open
echo    또는 시드 데이터 포함: npm run test:academy:with-seed
echo.
echo 5. 또는 헤드리스 모드:
echo    npm run test:academy-alerts
echo.

echo 🎯 테스트 시나리오:
echo 1. 수강 신청 → Firestore 저장 → n8n Webhook 호출
echo 2. 결제 완료 → Firestore 업데이트 → n8n Webhook 호출
echo 3. 카카오톡 + 이메일 동시 발송 확인
echo 4. 전체 플로우 통합 검증
echo.

echo 📚 참고 문서:
echo - N8N_ACADEMY_INTEGRATION_GUIDE.md
echo - MULTI_CHANNEL_SETUP_GUIDE.md
echo - KAKAO_TALK_SETUP_GUIDE.md
echo - CYPRESS_E2E_TEST_GUIDE.md
echo - GITHUB_ACTIONS_CI_GUIDE.md
echo - CI_NOTIFICATION_SETUP_GUIDE.md
echo - KAKAO_TALK_CI_TEMPLATE_GUIDE.md
echo - KAKAO_TOKEN_AUTO_REFRESH_GUIDE.md
echo - KAKAO_COMPLETE_AUTOMATION_GUIDE.md
echo - KAKAO_NOTIFICATION_TEST_GUIDE.md
echo - KAKAO_MINIMAL_TEST_GUIDE.md
echo - KAKAO_SUCCESS_FAILURE_TEST_GUIDE.md
echo - CI_OPTIMIZATION_GUIDE.md
echo - CURSOR_PATCH_GUIDE.md
echo - N8N_FINAL_PATCH_GUIDE.md
echo - CI_KAKAOTALK_FINAL_SETUP.md
echo - CI_DUAL_NOTIFICATION_GUIDE.md
echo - CI_FINAL_CONFIRMED_GUIDE.md
echo - CURSOR_N8N_PATCH_GUIDE.md
echo - CI_MESSAGE_FORMAT_GUIDE.md
echo - CI_DETAILED_NOTIFICATION_GUIDE.md
echo - CI_LOG_INCLUSION_GUIDE.md
echo - CI_FULL_LOG_ATTACHMENT_GUIDE.md
echo - ACADEMY_COURSE_SCHEMA_GUIDE.md
echo - FIRESTORE_MIGRATION_GUIDE.md
echo - ACADEMY_AUTOMATION_COMPLETE_GUIDE.md
echo - ACADEMY_EXECUTION_GUIDE.md
echo - CYPRESS_COURSE_AUTO_TEST_GUIDE.md
echo.

echo ✅ 준비 완료! 위 명령어들을 순서대로 실행하세요.
echo.

REM 사용자 선택
set /p choice="지금 Firebase Emulators를 시작하시겠습니까? (y/n): "
if /i "%choice%"=="y" (
    echo.
    echo 🚀 Firebase Emulators 시작 중...
    firebase emulators:start --only firestore
) else (
    echo.
    echo 📋 수동으로 실행해주세요:
    echo 1. firebase emulators:start --only firestore
    echo 2. npm run test:academy-alerts:open
)

pause
