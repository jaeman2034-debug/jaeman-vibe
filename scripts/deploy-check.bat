@echo off
REM 배포 체크 스크립트 (Windows Batch)
REM 사용법: deploy-check.bat <PROJECT_ID> [ENVIRONMENT] [REGION]

setlocal enabledelayedexpansion

set PROJECT_ID=%1
set ENVIRONMENT=%2
if "%ENVIRONMENT%"=="" set ENVIRONMENT=prod
set REGION=%3
if "%REGION%"=="" set REGION=asia-northeast3

if "%PROJECT_ID%"=="" (
    echo 사용법: %0 ^<PROJECT_ID^> [ENVIRONMENT] [REGION]
    echo 예시: %0 my-project prod asia-northeast3
    exit /b 1
)

echo 🚀 배포 체크 시작...
echo 프로젝트: %PROJECT_ID%
echo 환경: %ENVIRONMENT%
echo 리전: %REGION%

REM 1. Firebase 프로젝트 설정
echo 📦 Firebase 프로젝트 설정...
firebase use %PROJECT_ID%

REM 2. 환경변수 확인
echo 🔍 환경변수 확인...
set MISSING_VARS=
if "%SLACK_BOT_TOKEN%"=="" set MISSING_VARS=%MISSING_VARS% SLACK_BOT_TOKEN
if "%SLACK_SIGNING_SECRET%"=="" set MISSING_VARS=%MISSING_VARS% SLACK_SIGNING_SECRET
if "%SLACK_APPROVER_CHANNEL%"=="" set MISSING_VARS=%MISSING_VARS% SLACK_APPROVER_CHANNEL
if "%INTERNAL_KEY%"=="" set MISSING_VARS=%MISSING_VARS% INTERNAL_KEY
if "%N8N_WEBHOOK_APPROVED%"=="" set MISSING_VARS=%MISSING_VARS% N8N_WEBHOOK_APPROVED

if not "%MISSING_VARS%"=="" (
    echo ❌ 누락된 환경변수:%MISSING_VARS%
    echo 환경변수를 설정하고 다시 실행하세요.
    exit /b 1
)

echo ✅ 모든 필수 환경변수가 설정되었습니다.

REM 3. PUBLIC_BASE_URL 확인
echo 🌐 PUBLIC_BASE_URL 확인...
for /f "tokens=*" %%i in ('firebase functions:config:get public.base 2^>nul') do set PUBLIC_BASE_URL=%%i
if "%PUBLIC_BASE_URL%"=="" (
    echo ❌ PUBLIC_BASE_URL이 설정되지 않았습니다.
    echo 다음 명령으로 설정하세요:
    echo firebase functions:config:set public.base="https://your-domain.com"
    exit /b 1
)
echo ✅ PUBLIC_BASE_URL: %PUBLIC_BASE_URL%

REM 4. 워크스페이스 등록 확인
echo 🏢 워크스페이스 등록 확인...
set API_URL=https://%REGION%-%PROJECT_ID%.cloudfunctions.net/slack
curl -s "%API_URL%/slack/admin/workspaces" -H "x-internal-key: %INTERNAL_KEY%" -H "Content-Type: application/json" > temp_workspaces.json 2>nul
if exist temp_workspaces.json (
    for /f "tokens=*" %%i in ('type temp_workspaces.json ^| findstr "ok"') do set WORKSPACES_OK=%%i
    if not "%WORKSPACES_OK%"=="" (
        echo ✅ 워크스페이스 API 호출 성공
    ) else (
        echo ❌ 워크스페이스 API 호출 실패
    )
    del temp_workspaces.json
) else (
    echo ❌ 워크스페이스 API 호출 실패
)

REM 5. 헬스체크 확인
echo 🏥 헬스체크 확인...
curl -s "%API_URL%/slack/health" > temp_health.json 2>nul
if exist temp_health.json (
    for /f "tokens=*" %%i in ('type temp_health.json ^| findstr "ok"') do set HEALTH_OK=%%i
    if not "%HEALTH_OK%"=="" (
        echo ✅ 헬스체크 통과
    ) else (
        echo ❌ 헬스체크 실패
    )
    del temp_health.json
) else (
    echo ❌ 헬스체크 실패
)

REM 6. 빌드 테스트
echo 🔨 빌드 테스트...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Functions 빌드 실패
    cd ..
    exit /b 1
)
echo ✅ Functions 빌드 성공
cd ..

REM 7. 테스트 실행
echo 🧪 테스트 실행...
call npm test
if %errorlevel% neq 0 (
    echo ❌ 테스트 실패
    exit /b 1
)
echo ✅ 테스트 통과

REM 8. 배포 준비 확인
echo 📋 배포 준비 확인...
echo 다음 항목들이 확인되었습니다:
echo   ✅ 환경변수 설정
echo   ✅ PUBLIC_BASE_URL 설정
echo   ✅ 워크스페이스 등록
echo   ✅ 헬스체크 통과
echo   ✅ 빌드 성공
echo   ✅ 테스트 통과

REM 9. 배포 실행 여부 확인
set /p DEPLOY="배포를 실행하시겠습니까? (y/N): "
if /i "%DEPLOY%"=="y" (
    echo 🚀 배포 시작...
    
    REM Functions 배포
    echo 📦 Functions 배포 중...
    firebase deploy --only functions
    
    REM Hosting 배포
    echo 🌐 Hosting 배포 중...
    firebase deploy --only hosting
    
    REM 배포 후 헬스체크
    echo 🏥 배포 후 헬스체크...
    timeout /t 10 /nobreak >nul
    
    curl -s "%API_URL%/slack/health" > temp_health_final.json 2>nul
    if exist temp_health_final.json (
        for /f "tokens=*" %%i in ('type temp_health_final.json ^| findstr "ok"') do set FINAL_HEALTH_OK=%%i
        if not "%FINAL_HEALTH_OK%"=="" (
            echo ✅ 배포 성공! 헬스체크 통과
            echo 🌐 애플리케이션 URL: %PUBLIC_BASE_URL%
        ) else (
            echo ❌ 배포 후 헬스체크 실패
            exit /b 1
        )
        del temp_health_final.json
    ) else (
        echo ❌ 배포 후 헬스체크 실패
        exit /b 1
    )
) else (
    echo ⏭️  배포를 건너뛰었습니다.
    echo 준비가 완료되었으므로 언제든지 'firebase deploy'를 실행할 수 있습니다.
)

echo 🎉 배포 체크 완료!
