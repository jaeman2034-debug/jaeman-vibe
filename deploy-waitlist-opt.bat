@echo off
echo 대기열 최적화 시스템 배포를 시작합니다...

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
firebase deploy --only functions:suggestWaitlistPromotion,functions:promoteFromWaitlist
if %errorlevel% neq 0 (
    echo Cloud Functions 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ 대기열 최적화 시스템 배포가 완료되었습니다!
echo.
echo 배포된 함수들:
echo - suggestWaitlistPromotion: 승격 제안 계산
echo - promoteFromWaitlist: 대기열에서 일괄 승격
echo.
echo 기능:
echo - 보수적 승격: 남은 좌석만 승격 (안전)
echo - 예측기반 승격: 노쇼율 고려한 오버부킹 (최대 20%)
echo - 안전장치: 총원이 정원의 120%를 넘지 않도록 제한
echo - 자동 푸시: 승격된 사용자에게 알림 발송
echo.
echo 테스트 방법:
echo 1. 대기열이 있는 이벤트에서 관리 탭 접속
echo 2. "대기열 승격 제안" 카드에서 숫자 확인
echo 3. 모드 선택 후 "추천 인원 승격" 버튼 클릭
echo 4. 승격된 사용자에게 푸시 알림 도착 확인
echo.
pause
