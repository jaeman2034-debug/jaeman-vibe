@echo off
echo 자동 공지 · 스캐너 핫키 · 메모/태그 시스템 배포를 시작합니다...

echo.
echo 1. Functions 빌드 및 배포 중...
cd functions
npm run build || tsc
if %errorlevel% neq 0 (
    echo Functions 빌드 실패!
    pause
    exit /b 1
)

firebase deploy --only functions:onAttendeeWriteAutoNotify,functions:setAutomation
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
echo ✅ 자동 공지 · 스캐너 핫키 · 메모/태그 시스템 배포가 완료되었습니다!
echo.
echo 배포된 기능들:
echo - 자동 공지: 점유율 80%/100% 도달 시 자동 공지+푸시
echo - 스캐너 핫키: Space/T/L/Q 단축키로 빠른 조작
echo - 메모/태그: 참가자 포지션/레벨/태그/메모 관리
echo - 자동화 토글: 실시간으로 자동 공지 ON/OFF
echo.
echo 테스트 방법:
echo 1. 자동 공지 테스트:
echo    - 테스트 이벤트 정원=10으로 설정
echo    - 체크인 문서 8개 생성 → 80%% 공지 발송 확인
echo    - 체크인 문서 10개 생성 → 100%% 공지 발송 확인
echo    - announcements 컬렉션에 시스템 공지 생성 확인
echo    - FCM 푸시 도착 확인
echo.
echo 2. 자동화 토글 테스트:
echo    - 관리 탭 → "자동 공지" 패널
echo    - ON/OFF 토글 동작 확인
echo    - "상태 초기화" 버튼으로 알림 상태 리셋
echo    - OFF 상태에서 체크인해도 공지 안 뜸 확인
echo.
echo 3. 스캐너 핫키 테스트:
echo    - 스캐너 화면에서 키보드 입력
echo    - Space: 상태 리셋 (대기 중으로 변경)
echo    - T: 손전등 토글
echo    - L: 저조도 필터 토글
echo    - Q: 포맷 순환 (AUTO→QR→AZTEC→AUTO)
echo    - UI에 핫키 안내 표시 확인
echo.
echo 4. 메모/태그 테스트:
echo    - 관리 탭 → "참가자 메모/태그" 패널
echo    - 포지션/레벨 선택 → 즉시 저장 확인
echo    - 태그 입력 (쉼표로 구분) → 저장 확인
echo    - 메모 입력 (최대 500자) → 저장 확인
echo    - 비스태프로 접근 시 수정 불가 확인
echo.
echo 5. 통합 테스트:
echo    - 자동 공지 + 핫키 + 메모/태그 동시 사용
echo    - 실시간 업데이트 확인
echo    - 권한 체크 동작 확인
echo.
echo 운영 팁:
echo - 자동 공지: 현장 혼잡도에 따라 임계치 조정
echo - 핫키: 태블릿에서 빠른 조작으로 효율성 향상
echo - 메모/태그: 참가자 관리 및 팀 구성에 활용
echo - 토글: 상황에 따라 자동화 기능 제어
echo.
echo 기술적 특징:
echo - Firestore 트리거: 참가자 변경 시 자동 감지
echo - 중복 방지: notified80/100 플래그로 한 번만 알림
echo - 핫키 시스템: 키보드 이벤트 리스너로 즉시 반응
echo - 실시간 편집: onBlur 이벤트로 자동 저장
echo - 권한 분리: 스태프만 메모/태그 수정 가능
echo.
echo 보안 특징:
echo - 자동 공지: 시스템 계정으로 안전하게 처리
echo - 메모/태그: Firestore 규칙으로 스태프만 수정
echo - 핫키: 클라이언트 측에서만 동작
echo - 토글: 인증된 스태프만 제어 가능
echo.
pause
