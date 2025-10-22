$ErrorActionPreference = 'SilentlyContinue'
$CFG = (Resolve-Path .\firebase.json).Path

# 허브 락 정리
Get-ChildItem $env:TEMP -Filter "hub-*.json" | Remove-Item -Force -ErrorAction SilentlyContinue

# 서버/스크립트용 환경변수
$env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9108"
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8210"
$env:FIREBASE_STORAGE_EMULATOR_HOST="127.0.0.1:9320"

# 실행 (데이터 유지/복원)
npx firebase-tools@latest emulators:start --config "$CFG" --import .\.seed --export-on-exit
