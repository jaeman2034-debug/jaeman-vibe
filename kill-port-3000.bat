@echo off
echo 🔍 포트 3000을 사용하는 프로세스 찾는 중...
netstat -ano | findstr :3000

echo.
echo 🚫 포트 3000 프로세스 종료 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo PID %%a 종료 중...
    taskkill /PID %%a /F 2>nul
    if !errorlevel! equ 0 (
        echo ✅ PID %%a 종료 완료
    ) else (
        echo ❌ PID %%a 종료 실패 (이미 종료됨)
    )
)

echo.
echo 🎯 포트 3000 확인:
netstat -ano | findstr :3000
if !errorlevel! neq 0 (
    echo ✅ 포트 3000이 비어있습니다!
) else (
    echo ⚠️  포트 3000이 여전히 사용 중입니다.
)

echo.
echo 🚀 이제 백엔드를 시작할 수 있습니다:
echo    node server.js
pause 