@echo off
setlocal
cd /d %~dp0

REM --- 0) 흔한 포트 강제 정리(있으면 종료, 없어도 무시) ---
for %%P in (8080 9099 9199 5179 50199 58081 59200 54001 54003 54010) do (
  for /f "tokens=5" %%i in ('netstat -aon ^| findstr :%%P ^| findstr LISTENING') do (
    echo Killing PID %%i on port %%P
    taskkill /PID %%i /F >nul 2>&1
  )
)

REM --- 1) 에뮬레이터: 데이터 보존 + 고정 설정 ---
REM .firebase-data 폴더에 자동 저장/복원
start "Emulators" cmd /k ^
npx --yes firebase-tools@latest --config "%cd%\firebase.json" ^
  emulators:start --only auth,firestore,storage,ui ^
  --project jaeman-vibe-platform ^
  --import ".firebase-data" --export-on-exit

REM --- 2) 웹: 127.0.0.1, 5179 시도 후 안 되면 자동 다른 포트 ---
start "Web" cmd /k npm run web:auto
