@echo off
echo 카운터 보드 · QR/AZTEC · 저조도/손전등 시스템 배포를 시작합니다...

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
echo ✅ 카운터 보드 · QR/AZTEC · 저조도/손전등 시스템 배포가 완료되었습니다!
echo.
echo 배포된 기능들:
echo - 카운터 보드: 실시간 체크인 수/진행률 표시 + 임계치 알림
echo - ZXing 스캐너: QR/AZTEC 포맷 지원 + 고성능 인식
echo - 저조도 필터: CSS 필터로 밝기/대비/채도 향상
echo - 손전등: 지원 기기에서 카메라 플래시 토글
echo - 가이드 프레임: 스캔 영역 시각적 안내
echo.
echo 테스트 방법:
echo 1. 카운터 보드 테스트:
echo    - /events/:id/counter 접속
echo    - 체크인할 때마다 실시간 증가 확인
echo    - 50/80/100%% 도달 시 1회 비프음 확인
echo    - 다크모드에서도 정상 표시 확인
echo.
echo 2. 스캐너 포맷 테스트:
echo    - QR 코드 스캔 → 정상 인식
echo    - AZTEC 코드 스캔 → 정상 인식 (테스트 코드 생성 필요)
echo    - AUTO 모드 → 두 포맷 모두 인식
echo.
echo 3. 저조도/손전등 테스트:
echo    - 어두운 환경에서 저조도 필터 ON → 인식률 향상 확인
echo    - 지원 기기에서 손전등 토글 → 플래시 동작 확인
echo    - 가이드 프레임으로 스캔 영역 안내 확인
echo.
echo 4. 성능 테스트:
echo    - 오프라인 큐 동작 확인
echo    - 레이트 리밋/중복 방지 동작 확인
echo    - 실시간 상태 업데이트 확인
echo.
echo 5. UI/UX 테스트:
echo    - 카운터 보드 링크 동작 확인
echo    - StaffBadge 통합 확인
echo    - 반응형 디자인 확인
echo.
echo 운영 팁:
echo - 카운터 보드: 대형 화면에 표시하여 현장 상황 모니터링
echo - 저조도 필터: 실내 체육관 등 어두운 환경에서 필수
echo - 손전등: 야간 야외 이벤트에서 유용
echo - 포맷 선택: QR은 일반적, AZTEC은 고용량 데이터용
echo - 가이드 프레임: 사용자가 스캔 위치를 쉽게 파악
echo.
echo 기술적 특징:
echo - ZXing: 업계 표준 바코드 라이브러리
echo - 실시간 구독: Firestore onSnapshot으로 즉시 업데이트
echo - WebRTC: 고해상도 카메라 스트림
echo - CSS 필터: 하드웨어 가속으로 성능 최적화
echo - 오프라인 지원: 네트워크 불안정 시에도 동작
echo.
pause
