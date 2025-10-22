@echo off
echo Market Service를 시작합니다...
echo.

REM 환경변수 설정
set INTERNAL_KEY=dev-internal-key-123
set DB_PATH=./market.db
set PORT=5678

echo 환경변수 설정:
echo INTERNAL_KEY=%INTERNAL_KEY%
echo DB_PATH=%DB_PATH%
echo PORT=%PORT%
echo.

REM Node.js 실행
echo Node.js로 서비스를 시작합니다...
node market-service.js

pause
