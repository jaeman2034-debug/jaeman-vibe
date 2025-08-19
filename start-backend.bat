@echo off
echo 🚀 Express 백엔드 시작 중...
echo.

echo 📍 현재 디렉토리: %CD%
echo 📦 package.json 확인 중...

if not exist "package.json" (
    echo ❌ package.json을 찾을 수 없습니다!
    echo    올바른 프로젝트 디렉토리에서 실행하세요.
    pause
    exit /b 1
)

echo ✅ package.json 발견
echo.

echo 🔧 의존성 설치 확인 중...
if not exist "node_modules" (
    echo 📥 node_modules 없음, npm install 실행 중...
    npm install
    if !errorlevel! neq 0 (
        echo ❌ npm install 실패!
        pause
        exit /b 1
    )
    echo ✅ 의존성 설치 완료
) else (
    echo ✅ node_modules 존재
)

echo.
echo 🎯 백엔드 서버 시작:
echo    포트: 3000
echo    엔드포인트: http://localhost:3000/api/health
echo.

node server.js

echo.
echo 💡 백엔드가 종료되었습니다.
pause 