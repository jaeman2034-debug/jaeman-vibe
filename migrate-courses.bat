@echo off
SETLOCAL

echo 🚀 Firestore 강좌 마이그레이션 시작
echo.

REM 환경변수 확인
IF "%FIREBASE_API_KEY%"=="" (
    echo ❌ FIREBASE_API_KEY 환경변수가 설정되지 않았습니다.
    echo.
    echo 📝 설정 방법:
    echo 1. .env 파일에 Firebase 설정 추가:
    echo    FIREBASE_API_KEY=your_api_key
    echo    FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    echo    FIREBASE_PROJECT_ID=your_project_id
    echo.
    echo 2. 또는 환경변수로 직접 설정:
    echo    set FIREBASE_API_KEY=your_api_key
    echo    set FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    echo    set FIREBASE_PROJECT_ID=your_project_id
    echo.
    pause
    exit /b 1
)

IF "%FIREBASE_AUTH_DOMAIN%"=="" (
    echo ❌ FIREBASE_AUTH_DOMAIN 환경변수가 설정되지 않았습니다.
    echo.
    pause
    exit /b 1
)

IF "%FIREBASE_PROJECT_ID%"=="" (
    echo ❌ FIREBASE_PROJECT_ID 환경변수가 설정되지 않았습니다.
    echo.
    pause
    exit /b 1
)

echo ✅ Firebase 환경변수 확인 완료
echo.

REM ts-node 설치 확인
echo 📦 ts-node 설치 확인 중...
npx ts-node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo 📦 ts-node 설치 중...
    npm install -g ts-node
    IF %ERRORLEVEL% NEQ 0 (
        echo ❌ ts-node 설치 실패
        pause
        exit /b 1
    )
)

echo ✅ ts-node 설치 확인 완료
echo.

REM 마이그레이션 실행
echo 🚀 강좌 마이그레이션 실행 중...
echo.
npx ts-node scripts/migrateCourses.ts

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 마이그레이션 성공!
    echo.
    echo 📋 추가된 필드들:
    echo - schedule (시간/요일)
    echo - location (장소)
    echo - fee (수강료)
    echo - items (준비물)
    echo - target (대상 연령/조건)
    echo - curriculum (커리큘럼 배열)
    echo - contact (문의 연락처)
    echo.
    echo ✅ 이제 강좌 상세 페이지에서 모든 정보를 확인할 수 있습니다!
) ELSE (
    echo.
    echo ❌ 마이그레이션 실패
    echo.
    echo 🔍 문제 해결:
    echo 1. Firebase 환경변수 확인
    echo 2. 네트워크 연결 확인
    echo 3. Firebase 프로젝트 권한 확인
)

echo.
pause
ENDLOCAL
