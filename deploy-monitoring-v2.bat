@echo off
echo 모니터링 v2 시스템 배포를 시작합니다...

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
firebase deploy --only functions:recomputeEventHistory,functions:scheduleEventHistory,functions:watchAnomalies
if %errorlevel% neq 0 (
    echo Cloud Functions 배포 실패!
    pause
    exit /b 1
)

echo.
echo 3. Firestore 규칙 배포 중...
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo Firestore 규칙 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ 모니터링 v2 시스템 배포가 완료되었습니다!
echo.
echo 배포된 함수들:
echo - recomputeEventHistory: 이벤트 히스토리 재계산
echo - scheduleEventHistory: 1시간마다 히스토리 자동 업데이트
echo - watchAnomalies: 1시간마다 이상치 감지
echo.
echo 업데이트된 기능:
echo - Sentry 트레이싱: 모든 Functions에 적용
echo - 이벤트 리포트 v2: 히스토리 집계 + 차트
echo - 이상치 알림: 노쇼율/결제실패율 감지
echo.
echo 설정 필요:
echo 1. Functions 환경변수에 SLACK_WEBHOOK_URL 추가 (선택)
echo 2. Sentry DSN 설정 확인
echo.
echo 테스트 방법:
echo 1. 관리 탭에서 차트 확인
echo 2. 히스토리 재계산 버튼 테스트
echo 3. 이상치 감지 테스트 (테스트 데이터 생성)
echo.
pause
