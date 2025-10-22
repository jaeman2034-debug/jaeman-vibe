Write-Host "Market Service 테스트를 시작합니다..." -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:5678"

# 1. 헬스체크 테스트
Write-Host "1. 헬스체크 테스트..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/healthz" -Method GET
    Write-Host "✓ 헬스체크 성공: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  응답: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ 헬스체크 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. 올바른 인증 키로 웹훅 테스트
Write-Host "2. 올바른 인증 키로 웹훅 테스트..." -ForegroundColor Yellow
try {
    $headers = @{
        'Content-Type' = 'application/json'
        'x-internal-key' = 'dev-internal-key-123'
    }
    $body = '{"id":"test-market-001","status":"pending"}'
    
    $response = Invoke-WebRequest -Uri "$baseUrl/webhook/market-created" -Method POST -Headers $headers -Body $body
    Write-Host "✓ 웹훅 테스트 성공: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  응답: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ 웹훅 테스트 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. 잘못된 인증 키로 테스트
Write-Host "3. 잘못된 인증 키로 테스트..." -ForegroundColor Yellow
try {
    $headers = @{
        'Content-Type' = 'application/json'
        'x-internal-key' = 'wrong-key'
    }
    $body = '{"id":"test-market-002","status":"pending"}'
    
    $response = Invoke-WebRequest -Uri "$baseUrl/webhook/market-created" -Method POST -Headers $headers -Body $body
    Write-Host "✗ 인증 실패 테스트 실패 (예상: 401 에러가 발생해야 함)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ 인증 실패 테스트 성공: 401 Unauthorized" -ForegroundColor Green
    } else {
        Write-Host "✗ 예상과 다른 오류: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# 4. 데이터베이스 파일 확인
Write-Host "4. 데이터베이스 파일 확인..." -ForegroundColor Yellow
if (Test-Path "market.db") {
    Write-Host "✓ market.db 파일이 생성되었습니다." -ForegroundColor Green
    $fileSize = (Get-Item "market.db").Length
    Write-Host "  파일 크기: $fileSize bytes" -ForegroundColor Gray
} else {
    Write-Host "✗ market.db 파일이 생성되지 않았습니다." -ForegroundColor Red
}

Write-Host ""
Write-Host "테스트 완료!" -ForegroundColor Green
Read-Host "Press Enter to continue"
