@echo off
echo FCM 푸시 시스템 배포를 시작합니다...

echo.
echo 1. Functions 빌드 중...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo Functions 빌드 실패!
    pause
    exit /b 1
)

echo.
echo 2. Cloud Functions 배포 중...
cd ..
firebase deploy --only functions:registerDevice,functions:onAttendeeCreateNotify
if %errorlevel% neq 0 (
    echo Cloud Functions 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ FCM 푸시 시스템 배포가 완료되었습니다!
echo.
echo 배포된 함수들:
echo - registerDevice: 디바이스 토큰 등록
echo - onAttendeeCreateNotify: 대기열 승격 알림
echo.
echo 추가로 업데이트된 함수들:
echo - confirmPayment: 결제 완료 푸시
echo - createAnnouncement: 공지 생성 푸시
echo - togglePinAnnouncement: 공지 핀 푸시
echo.
echo 환경 설정:
echo 1. .env.local에 VITE_FB_MESSAGING_KEY 추가
echo 2. Firebase 콘솔에서 VAPID 키 발급
echo 3. Service Worker 파일이 public/ 폴더에 있는지 확인
echo.
pause
