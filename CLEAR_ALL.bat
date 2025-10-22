@echo off
echo 🔥 완전 초기화 시작...

echo 1️⃣ Node 프로세스 종료...
taskkill /f /im node.exe 2>nul

echo 2️⃣ Vite 캐시 삭제...
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite

echo 3️⃣ 개발 서버 시작...
start cmd /k npm run dev

echo ✅ 완료! 브라우저에서 Ctrl + Shift + R로 강력 새로고침하세요!
pause

