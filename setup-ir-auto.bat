@echo off
chcp 65001 >nul
title 🚀 YAGO VIBE IR REPORT 통합 자동 설정
color 0A
echo.
echo ===============================================
echo      ⚡ YAGO VIBE IR AUTO-SETUP (천재 버전)
echo ===============================================
echo.

REM 현재 디렉토리 확인
echo 📁 현재 위치: %CD%
echo.

REM ① Firebase 프로젝트 ID 자동 감지
echo 🔍 [0/4] Firebase 프로젝트 확인 중...
for /f "tokens=*" %%i in ('firebase use 2^>nul') do set FIREBASE_OUTPUT=%%i
if "%FIREBASE_OUTPUT%"=="" (
    echo ⚠️  Firebase 프로젝트를 찾을 수 없습니다.
    echo    firebase login 및 firebase use 명령을 먼저 실행하세요.
    set /p PID=👉 Firebase 프로젝트 ID 수동 입력 (예: jaeman-vibe-platform^): 
) else (
    echo ✅ Firebase 프로젝트 감지됨
    for /f "tokens=*" %%j in ('firebase use ^| findstr /C:"Now using"') do set PID=%%j
    if "%PID%"=="" (
        set /p PID=👉 Firebase 프로젝트 ID 입력 (예: jaeman-vibe-platform^): 
    )
)
echo 📋 프로젝트 ID: %PID%
echo.

REM ② Functions 패키지 설치
echo 📦 [1/4] Functions 패키지 설치 중...
cd functions
if not exist "package.json" (
    echo ❌ functions/package.json 파일을 찾을 수 없습니다!
    cd ..
    pause
    exit /b 1
)

echo    npm install 실행 중...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  npm install 실패 - 수동으로 확인 필요
) else (
    echo ✅ 패키지 설치 완료
)
cd ..
echo.

REM ③ Slack Webhook 안내 문서 생성
echo 🧭 [2/4] Slack Webhook 설정 안내 생성 중...
if not exist "docs" mkdir docs
(
echo # 💬 Slack Webhook 설정 안내 (5분 완성^)
echo.
echo ## 🚀 빠른 시작
echo.
echo ### 1️⃣ Slack App 생성
echo 1. https://api.slack.com/apps 접속
echo 2. **"Create New App"** 클릭
echo 3. **"From scratch"** 선택
echo 4. App 이름: `YAGO VIBE IR Reporter`
echo 5. Workspace 선택
echo.
echo ### 2️⃣ Incoming Webhooks 활성화
echo 1. 좌측 메뉴 → **"Incoming Webhooks"**
echo 2. 토글을 **"On"**으로 변경
echo 3. **"Add New Webhook to Workspace"** 클릭
echo 4. 채널 선택 (예: `#ir-reports`^)
echo 5. **"허용"** 클릭
echo.
echo ### 3️⃣ Webhook URL 복사
echo ```
echo https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
echo ```
echo.
echo ### 4️⃣ 환경 변수 설정
echo ```env
echo VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
echo ```
echo.
echo ### 5️⃣ Firebase Functions Config 설정
echo ```bash
echo firebase functions:config:set slack.webhook="YOUR_SLACK_WEBHOOK_URL"
echo ```
echo.
echo ## ✅ 완료!
) > docs\SLACK_WEBHOOK_SETUP.md
echo ✅ Slack 안내 문서 생성: docs\SLACK_WEBHOOK_SETUP.md
echo.

REM ④ Pub/Sub 권한 활성화
echo ⚙️ [3/4] Pub/Sub 서비스 활성화 중...
echo    (Google Cloud SDK가 필요합니다^)
echo.

gcloud --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Google Cloud SDK가 설치되지 않았습니다.
    echo    https://cloud.google.com/sdk/docs/install 에서 설치하세요.
    echo    또는 Firebase Console에서 수동으로 Pub/Sub를 활성화하세요.
    goto SKIP_PUBSUB
)

echo    Pub/Sub API 활성화 중...
gcloud services enable pubsub.googleapis.com --project=%PID% >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Pub/Sub API 활성화 실패 - 수동 확인 필요
) else (
    echo ✅ Pub/Sub API 활성화 완료
)

echo    Cloud Scheduler API 활성화 중...
gcloud services enable cloudscheduler.googleapis.com --project=%PID% >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Cloud Scheduler API 활성화 실패 - 수동 확인 필요
) else (
    echo ✅ Cloud Scheduler API 활성화 완료
)

echo    IAM 권한 설정 중...
gcloud projects add-iam-policy-binding %PID% --member="serviceAccount:%PID%@appspot.gserviceaccount.com" --role="roles/cloudscheduler.admin" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  IAM 권한 설정 실패 (이미 설정되어 있을 수 있음^)
) else (
    echo ✅ IAM 권한 설정 완료
)

:SKIP_PUBSUB
echo.

REM ⑤ Firebase Functions 배포
echo 🔧 [4/4] Firebase Functions 배포 중...
echo    (이 과정은 2~3분 소요될 수 있습니다^)
echo.

set /p DEPLOY_NOW=👉 지금 바로 Functions를 배포하시겠습니까? (Y/N^): 
if /i "%DEPLOY_NOW%"=="Y" (
    cd functions
    echo    배포 시작...
    call npm run deploy:ir
    if %errorlevel% neq 0 (
        echo ❌ Firebase Functions 배포 실패!
        echo    다음 명령으로 수동 배포하세요:
        echo    cd functions
        echo    npm run deploy:ir
    ) else (
        echo ✅ Firebase Functions 배포 완료!
    )
    cd ..
) else (
    echo ⏭️  배포를 건너뜁니다. 나중에 다음 명령으로 배포하세요:
    echo    cd functions
    echo    npm run deploy:ir
)
echo.

REM ⑥ 완료 메시지
echo ===============================================
echo 🎉 자동 설정 완료!
echo ===============================================
echo.
echo 📋 다음 단계:
echo.
echo 1️⃣ Slack Webhook URL 설정:
echo    - docs\SLACK_WEBHOOK_SETUP.md 파일 참고
echo    - env.local에 VITE_SLACK_WEBHOOK_URL 추가
echo    - firebase functions:config:set slack.webhook="URL"
echo.
echo 2️⃣ OpenAI API Key 설정:
echo    firebase functions:config:set openai.key="sk-proj-YOUR_KEY"
echo.
echo 3️⃣ 투자자 이메일 설정:
echo    firebase functions:config:set email.investors="email1@example.com,email2@example.com"
echo.
echo 4️⃣ Functions 재배포 (설정 변경 시^):
echo    cd functions
echo    npm run deploy:ir
echo.
echo 5️⃣ 테스트:
echo    Firebase Console → Functions → scheduledIRReport → "테스트" 버튼
echo.
echo ⏰ 자동 실행: 매주 월요일 오전 09:00 (KST^)
echo.
echo ===============================================
echo.
pause

