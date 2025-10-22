@echo off
echo 모니터링 시스템 배포를 시작합니다...

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
firebase deploy --only functions:collectVitals,functions:recomputeEventMetrics,functions:scheduleMetrics
if %errorlevel% neq 0 (
    echo Cloud Functions 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ 모니터링 시스템 배포가 완료되었습니다!
echo.
echo 배포된 함수들:
echo - collectVitals: Web Vitals 수집
echo - recomputeEventMetrics: 이벤트 메트릭 재계산
echo - scheduleMetrics: 2시간마다 자동 메트릭 업데이트
echo.
echo 설정 필요:
echo 1. .env.local에 VITE_SENTRY_DSN 추가
echo 2. Functions 환경변수에 SENTRY_DSN 추가
echo 3. (선택) Sentry 소스맵 업로드를 위한 환경변수 설정
echo.
echo 테스트 방법:
echo 1. 프론트엔드 새로고침 → Sentry에 페이지뷰 확인
echo 2. 관리 탭 → 운영 리포트 카드 확인
echo 3. Firestore에서 metrics/webvitals 컬렉션 확인
echo.
pause
