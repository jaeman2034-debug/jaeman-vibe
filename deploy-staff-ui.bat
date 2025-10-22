@echo off
echo 스태프 배지 · 스캐너 잠금 · Night 모드 · 폰트 스케일 시스템 배포를 시작합니다...

echo.
echo 1. 클라이언트 빌드 중...
npm run build
if %errorlevel% neq 0 (
    echo 클라이언트 빌드 실패!
    pause
    exit /b 1
)

echo.
echo 2. Firebase Hosting 배포 중...
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Hosting 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ 스태프 배지 · 스캐너 잠금 · Night 모드 · 폰트 스케일 시스템 배포가 완료되었습니다!
echo.
echo 배포된 기능들:
echo - useIsStaff 훅: 스태프 권한 실시간 확인
echo - StaffBadge 컴포넌트: 야간모드/폰트스케일/스캐너잠금 토글
echo - 스캐너 보호: 권한/카메라/잠금 상태 체크
echo - 관리 탭: StaffBadge 통합
echo - Tailwind 다크모드: class 기반 테마 전환
echo.
echo 테스트 방법:
echo 1. 권한 테스트:
echo    - 스태프 아님 → 스캐너 접근 시 "권한이 없습니다" 표시
echo    - 스태프 → 정상 접근
echo.
echo 2. 잠금 테스트:
echo    - 스캐너 화면 → "스캐너 잠금" 클릭 → PIN 4자리 설정
echo    - UI 잠김 → "잠금 해제"로 PIN 입력 시 복구
echo.
echo 3. 카메라 권한 테스트:
echo    - 권한 거부 후 재진입 → 경고 카드 & "다시 시도" 버튼
echo    - 권한 허용 → 정상 스캐너 동작
echo.
echo 4. 야간/폰트 테스트:
echo    - StaffBadge에서 테마=다크 선택 → 전체 UI 다크모드 전환
echo    - 폰트 슬라이더 조절 → 전체 텍스트 크기 즉시 반영
echo    - 설정은 localStorage에 저장되어 새로고침 후에도 유지
echo.
echo 5. 관리 탭 테스트:
echo    - 우상단에 StaffBadge 노출
echo    - 동일한 토글 기능 동작
echo.
echo 운영 팁:
echo - 현장 단말: 스캐너 잠금으로 분실 시 보안 강화
echo - 야간 운영: 다크모드로 눈의 피로 감소
echo - 접근성: 폰트 스케일로 가독성 향상
echo - 세션 잠금: 브라우저 탭 종료 시 자동 해제
echo.
pause
