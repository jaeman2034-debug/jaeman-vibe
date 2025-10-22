@echo off
echo PWA + 오프라인 체크인 시스템 배포를 시작합니다...

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
firebase deploy --only functions:staffConsumeUserPass
if %errorlevel% neq 0 (
    echo Cloud Functions 배포 실패!
    pause
    exit /b 1
)

echo.
echo 3. 클라이언트 빌드 중...
npm run build
if %errorlevel% neq 0 (
    echo 클라이언트 빌드 실패!
    pause
    exit /b 1
)

echo.
echo 4. Firebase Hosting 배포 중...
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Hosting 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ PWA + 오프라인 체크인 시스템 배포가 완료되었습니다!
echo.
echo 배포된 기능들:
echo - staffConsumeUserPass: 오프라인 스캔 지원 (5분 유예)
echo - 오프라인 큐: IndexedDB 기반 스캔 저장/동기화
echo - PWA: Service Worker + Manifest (오프라인 캐시)
echo - 스캐너 UI: 오프라인 모드 표시 및 자동 동기화
echo.
echo 테스트 방법:
echo 1. 온라인 상태:
echo    - 스캔 → 즉시 체크인 성공
echo    - presence 문서 생성 확인
echo.
echo 2. 오프라인 상태 (비행기 모드/네트워크 차단):
echo    - 스캔 → "오프라인 저장됨" 표시
echo    - IndexedDB에 스캔 데이터 저장 확인
echo.
echo 3. 네트워크 복귀:
echo    - 자동 동기화 → presence 생성
echo    - logs.presence.scan에 offline:true 표시
echo.
echo 4. 만료 직후 5분 내 스캔:
echo    - 오프라인 저장 → 복귀 후 동기화 성공 (유예 적용)
echo    - 5분 초과분은 서버에서 거절
echo.
echo 5. PWA 설치:
echo    - 모바일 브라우저에서 "홈 화면에 추가"
echo    - 오프라인에서도 스캐너 화면/카메라 열람 가능
echo.
echo 운영 옵션:
echo - 유예 시간 조정: firebase functions:config:set pass.offline_grace_ms=300000
echo - 현장 전용 태블릿: PWA 설치 + 자동 화면켜짐 권장
echo.
pause
