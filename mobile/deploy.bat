@echo off
REM ===========================
REM 🚀 야고 비서 원클릭 배포 스크립트 (Windows 배치)
REM ===========================

echo.
echo 🎙️ 야고 비서 원클릭 배포를 시작합니다...
echo.

REM PowerShell 스크립트 실행
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*

REM 실행 완료 후 일시 정지
echo.
echo 배포가 완료되었습니다. 아무 키나 누르세요...
pause > nul
