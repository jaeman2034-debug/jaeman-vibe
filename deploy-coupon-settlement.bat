@echo off
echo 쿠폰 · 영수증 · 정산 v1 시스템 배포를 시작합니다...

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
firebase deploy --only functions:upsertCoupon,functions:validateCoupon,functions:computeSettlement
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
echo ✅ 쿠폰 · 영수증 · 정산 v1 시스템 배포가 완료되었습니다!
echo.
echo 배포된 함수들:
echo - upsertCoupon: 쿠폰 생성/수정 (스태프만)
echo - validateCoupon: 쿠폰 검증 및 할인액 계산
echo - computeSettlement: 정산 리포트 계산
echo.
echo 업데이트된 기능:
echo - createPaymentIntent: 쿠폰 할인 및 영수증 정보 처리
echo - confirmPayment: 쿠폰 소비 기록 (멱등)
echo - Checkout UI: 쿠폰 입력 및 영수증 필드
echo - SettlementPanel: 정산 리포트 및 CSV 다운로드
echo.
echo 테스트 방법:
echo 1. 쿠폰 생성: upsertCoupon으로 WELCOME10(10%%, 최대 2000, 최소 5000) 생성
echo 2. 쿠폰 적용: Checkout에서 코드 입력 → 할인 적용 확인
echo 3. 결제 테스트: 할인된 금액으로 결제 완료
echo 4. 정산 확인: 관리 탭에서 정산 리포트 및 CSV 다운로드
echo 5. 영수증: 상호/사업자번호 입력 후 결제 → payments.invoice에 저장 확인
echo.
echo 쿠폰 생성 예시:
echo firebase functions:shell
echo upsertCoupon({eventId: 'your-event-id', code: 'WELCOME10', payload: {
echo   type: 'percent', value: 10, maxDiscount: 2000, minSpend: 5000,
echo   active: true, totalLimit: 100, perUserLimit: 1
echo }})
echo.
pause
