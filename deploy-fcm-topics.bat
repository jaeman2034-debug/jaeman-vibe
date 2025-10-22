@echo off
echo FCM 토픽 시스템 배포를 시작합니다...

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
firebase deploy --only functions:registerDevice,functions:onAttendeeCreateTopic,functions:onAttendeeDeleteTopic,functions:onWaitlistCreateTopic,functions:onWaitlistDeleteTopic,functions:onAttendeeCreateNotify
if %errorlevel% neq 0 (
    echo Cloud Functions 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ FCM 토픽 시스템 배포가 완료되었습니다!
echo.
echo 배포된 함수들:
echo - registerDevice: 디바이스 토큰 등록
echo - onAttendeeCreateTopic: 참가자 생성 시 토픽 구독
echo - onAttendeeDeleteTopic: 참가자 삭제 시 토픽 구독 해제
echo - onWaitlistCreateTopic: 대기자 생성 시 토픽 구독
echo - onWaitlistDeleteTopic: 대기자 삭제 시 토픽 구독 해제
echo - onAttendeeCreateNotify: 대기열 승격 알림
echo.
echo 업데이트된 함수들:
echo - createAnnouncement: 공지 생성 + 토픽 발송
echo - togglePinAnnouncement: 공지 핀 + 토픽 발송
echo - confirmPayment: 결제 완료 + 토픽 발송
echo.
echo 토픽 구조:
echo - event_{eventId}_announce: 공지사항 토픽
echo - event_{eventId}_attendee: 참가자 토픽
echo - event_{eventId}_waitlist: 대기자 토픽
echo.
pause
