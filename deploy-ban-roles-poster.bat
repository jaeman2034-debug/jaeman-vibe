@echo off
echo 강퇴/차단 + 롤 관리 + QR 포스터 시스템 배포를 시작합니다...

echo.
echo 1. Functions 빌드 및 배포 중...
cd functions
npm run build || tsc
if %errorlevel% neq 0 (
    echo Functions 빌드 실패!
    pause
    exit /b 1
)

firebase deploy --only functions:banUser,functions:unbanUser
if %errorlevel% neq 0 (
    echo Functions 배포 실패!
    pause
    exit /b 1
)

cd ..

echo.
echo 2. Firestore 규칙 배포 중...
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo Firestore 규칙 배포 실패!
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
echo ✅ 강퇴/차단 + 롤 관리 + QR 포스터 시스템 배포가 완료되었습니다!
echo.
echo 배포된 기능들:
echo - 강퇴/차단 시스템: 사용자 차단/해제 + 자동 제거
echo - 역할 관리: 스태프 추가/해제
echo - QR 포스터: A3 비율 PNG 다운로드
echo - Firestore 규칙: 밴 체크 통합
echo.
echo 테스트 방법:
echo 1. 역할 관리 테스트:
echo    - 관리 탭 → "역할 관리" 패널
echo    - UID 입력 후 "추가" → 스태프 권한 부여
echo    - "해제" 버튼으로 권한 제거
echo.
echo 2. 강퇴/차단 테스트:
echo    - 관리 탭 → "강퇴/차단" 패널
echo    - UID, 일수, 사유 입력 후 "차단"
echo    - attendees/waitlist/presence에서 자동 제거 확인
echo    - 차단 기간 중 참가/결제 불가 확인
echo    - "해제" 버튼으로 차단 해제
echo.
echo 3. QR 포스터 테스트:
echo    - 관리 탭 → "QR 포스터" 패널
echo    - "PNG 다운로드" 클릭
echo    - A3 비율 포스터 다운로드 확인
echo    - QR 코드 스캔 시 이벤트 상세 페이지 열림 확인
echo.
echo 4. 보안 테스트:
echo    - 차단된 사용자로 참가 시도 → 차단 메시지
echo    - 차단된 사용자로 결제 시도 → 차단 메시지
echo    - 스태프가 아닌 사용자로 관리 기능 접근 → 권한 없음
echo.
echo 5. 로그 확인:
echo    - ban.add / ban.remove 로그 기록 확인
echo    - 역할 변경 로그 확인
echo.
echo 운영 팁:
echo - 강퇴 시 자동 제거: attendees, waitlist, presence 모두 삭제
echo - 차단 기간: 일수 단위로 설정 가능 (기본 7일)
echo - QR 포스터: 현장 부착용으로 A3 비율 최적화
echo - 역할 관리: UID로만 관리 (사용자명은 표시 안됨)
echo - 보안: Firestore 규칙으로 서버 측 검증
echo.
echo 기술적 특징:
echo - 트랜잭션: 강퇴 시 여러 컬렉션 동시 처리
echo - 실시간 구독: 차단 목록 실시간 업데이트
echo - Canvas API: 고품질 PNG 생성
echo - QRCode 라이브러리: 안정적인 QR 코드 생성
echo - Firestore 규칙: 클라이언트 측 보안 강화
echo.
pause
