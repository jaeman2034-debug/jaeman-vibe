@echo off
echo 쿠폰 풀 · 지갑 · 월간 정산 시스템 배포를 시작합니다...

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
firebase deploy --only functions:createCouponPool,functions:claimCoupon,functions:computeMonthlySettlement
if %errorlevel% neq 0 (
    echo Cloud Functions 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ 쿠폰 풀 · 지갑 · 월간 정산 시스템 배포가 완료되었습니다!
echo.
echo 배포된 함수들:
echo - createCouponPool: 쿠폰 풀 대량 생성 (1회용 코드)
echo - claimCoupon: 사용자 쿠폰 지갑 선점
echo - computeMonthlySettlement: 월간 정산 계산
echo.
echo 업데이트된 기능:
echo - Checkout: 쿠폰 적용 시 자동 지갑 선점
echo - confirmPayment: 결제 완료 시 지갑 사용 처리
echo - MonthlySettlement: 월간 정산 Admin 페이지
echo.
echo 테스트 방법:
echo 1. 쿠폰 풀 생성:
echo    createCouponPool({eventId: 'your-event-id', prefix: 'WELCOME', count: 100, payload: {
echo      type: 'percent', value: 10, maxDiscount: 2000, minSpend: 5000,
echo      active: true, startAt: null, endAt: null
echo    }})
echo.
echo 2. 쿠폰 적용 테스트:
echo    - Checkout에서 생성된 쿠폰 코드 입력
echo    - 적용 성공 시 users/{uid}/wallet_coupons/{code} 생성 확인
echo    - 결제 완료 후 status=used로 변경 확인
echo.
echo 3. 월간 정산 테스트:
echo    - /admin/settlement 접속
echo    - 월 선택 후 집계 실행
echo    - 정산 카드 및 CSV 다운로드 확인
echo.
echo 쿠폰 풀 생성 예시 (Firebase Functions Shell):
echo firebase functions:shell
echo createCouponPool({
echo   eventId: 'your-event-id',
echo   prefix: 'WELCOME',
echo   count: 100,
echo   payload: {
echo     type: 'percent',
echo     value: 10,
echo     maxDiscount: 2000,
echo     minSpend: 5000,
echo     active: true
echo   }
echo })
echo.
pause
