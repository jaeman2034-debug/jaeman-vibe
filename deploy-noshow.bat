@echo off
echo 노쇼 페널티 시스템 배포를 시작합니다...

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
echo 2. Firestore 규칙 배포 중...
cd ..
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo Firestore 규칙 배포 실패!
    pause
    exit /b 1
)

echo.
echo 3. Firestore 인덱스 배포 중...
firebase deploy --only firestore:indexes
if %errorlevel% neq 0 (
    echo Firestore 인덱스 배포 실패!
    pause
    exit /b 1
)

echo.
echo 4. Cloud Functions 배포 중...
firebase deploy --only functions:sweepNoShows,functions:waivePenalty,functions:manualSweepNoShows
if %errorlevel% neq 0 (
    echo Cloud Functions 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ 노쇼 페널티 시스템 배포가 완료되었습니다!
echo.
echo 배포된 함수들:
echo - sweepNoShows: 매일 새벽 1시 10분에 자동 실행
echo - waivePenalty: 스태프가 페널티 감면
echo - manualSweepNoShows: 관리자가 수동으로 스윕 실행
echo.
pause
