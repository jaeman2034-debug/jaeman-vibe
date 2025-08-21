@echo off
echo 🚀 YAGO SPORTS 백엔드 빠른 시작 (5분 컷)
echo.

echo 📦 의존성 설치 중...
npm install

echo.
echo 🔍 포트 3000 정리 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 2^>nul') do (
    echo PID %%a 종료 중...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 🎯 백엔드 서버 시작:
echo    포트: 3000
echo    엔드포인트: http://localhost:3000/api/health
echo.

echo 💡 Windows Defender 팝업이 뜨면 "허용" 클릭하세요!
echo.

node server.cjs

echo.
echo 💡 백엔드가 종료되었습니다.
pause 