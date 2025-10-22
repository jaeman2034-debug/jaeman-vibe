@echo off
SETLOCAL

echo 🗑️ 아카데미 강좌 삭제 스크립트
echo.

REM 환경변수 확인
IF "%FIREBASE_API_KEY%"=="" (
    echo ❌ FIREBASE_API_KEY 환경변수가 설정되지 않았습니다.
    echo.
    echo 📝 설정 방법:
    echo 1. firebase-migration-env.example 파일을 참고하여 .env 파일 생성
    echo 2. 또는 이 스크립트 실행 전에 환경변수를 직접 설정하세요.
    echo    set FIREBASE_API_KEY=YOUR_API_KEY
    echo    set FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    echo    set FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    echo.
    pause
    exit /b 1
)
IF "%FIREBASE_AUTH_DOMAIN%"=="" (
    echo ❌ FIREBASE_AUTH_DOMAIN 환경변수가 설정되지 않았습니다.
    pause
    exit /b 1
)
IF "%FIREBASE_PROJECT_ID%"=="" (
    echo ❌ FIREBASE_PROJECT_ID 환경변수가 설정되지 않았습니다.
    pause
    exit /b 1
)

REM ts-node 설치 확인 및 설치
where ts-node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ⚠️ ts-node가 설치되어 있지 않습니다. 설치를 시도합니다...
    npm install -g ts-node
    IF %ERRORLEVEL% NEQ 0 (
        echo ❌ ts-node 설치 실패. 수동으로 설치해주세요: npm install -g ts-node
        pause
        exit /b 1
    )
    echo ✅ ts-node 설치 완료.
)

echo.
echo 📚 등록된 강좌 목록을 확인합니다...
echo.

REM 강좌 목록 조회
npx ts-node scripts/deleteCourse.ts

echo.
echo 💡 특정 강좌를 삭제하려면:
echo npx ts-node scripts/deleteCourse.ts --delete COURSE_ID
echo.
echo 예시:
echo npx ts-node scripts/deleteCourse.ts --delete abc123def456
echo.

pause
ENDLOCAL
