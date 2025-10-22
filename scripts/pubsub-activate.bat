@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🔧 Firebase Pub/Sub 스케줄 트리거 권한 활성화
echo ========================================
echo.

REM Firebase 프로젝트 ID 가져오기
for /f "tokens=*" %%i in ('firebase use') do set PROJECT_ID=%%i

if "%PROJECT_ID%"=="" (
    echo ❌ Firebase 프로젝트를 찾을 수 없습니다.
    echo    firebase use 명령으로 프로젝트를 선택하세요.
    pause
    exit /b 1
)

echo 📋 현재 프로젝트: %PROJECT_ID%
echo.

echo 1️⃣ Pub/Sub API 활성화 중...
gcloud services enable pubsub.googleapis.com --project=%PROJECT_ID%
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Pub/Sub API 활성화 실패
    echo    gcloud CLI가 설치되어 있는지 확인하세요.
    pause
    exit /b 1
)
echo ✅ Pub/Sub API 활성화 완료
echo.

echo 2️⃣ Cloud Scheduler API 활성화 중...
gcloud services enable cloudscheduler.googleapis.com --project=%PROJECT_ID%
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cloud Scheduler API 활성화 실패
    pause
    exit /b 1
)
echo ✅ Cloud Scheduler API 활성화 완료
echo.

echo 3️⃣ IAM 권한 설정 중...
gcloud projects add-iam-policy-binding %PROJECT_ID% ^
  --member="serviceAccount:%PROJECT_ID%@appspot.gserviceaccount.com" ^
  --role="roles/cloudscheduler.admin"
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  IAM 권한 설정 실패 (이미 설정되어 있을 수 있습니다)
) else (
    echo ✅ IAM 권한 설정 완료
)
echo.

echo ========================================
echo ✅ Pub/Sub 스케줄 트리거 설정 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1️⃣ cd functions
echo 2️⃣ npm run deploy:ir
echo.
pause

