# n8n 워크플로우 최종 테스트 스크립트
# 실제 n8n 호스트 URL과 토큰으로 교체 후 실행하세요

# 환경변수 설정 (실제 값으로 교체 필요)
$env:N8N_BASE = "https://<your-n8n-host>"     # 예: https://n8n.yagovibe.com
$env:N8N_TOKEN = "<your-random-token>"

Write-Host "=== n8n 워크플로우 최종 테스트 ===" -ForegroundColor Green
Write-Host "N8N_BASE: $env:N8N_BASE" -ForegroundColor Cyan
Write-Host "N8N_TOKEN: $env:N8N_TOKEN" -ForegroundColor Cyan

# 1. User Created 테스트
Write-Host "`n1. User Created 워크플로우 테스트..." -ForegroundColor Yellow
try {
    $response1 = curl -Method POST "$env:N8N_BASE/webhook/user-created" `
        -Headers @{ 'x-internal-key'=$env:N8N_TOKEN; 'Content-Type'='application/json' } `
        -Body '{"uid":"u1","email":"u1@example.com","displayName":"홍길동","createdAt":1690000000000}'
    Write-Host "✅ User Created 성공: $response1" -ForegroundColor Green
} catch {
    Write-Host "❌ User Created 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Market Created 테스트
Write-Host "`n2. Market Created 워크플로우 테스트..." -ForegroundColor Yellow
try {
    $response2 = curl -Method POST "$env:N8N_BASE/webhook/market-created" `
        -Headers @{ 'x-internal-key'=$env:N8N_TOKEN; 'Content-Type'='application/json' } `
        -Body '{"id":"m1","title":"축구화","price":9900}'
    Write-Host "✅ Market Created 성공: $response2" -ForegroundColor Green
} catch {
    Write-Host "❌ Market Created 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Session Event 테스트
Write-Host "`n3. Session Event 워크플로우 테스트..." -ForegroundColor Yellow
try {
    $response3 = curl -Method POST "$env:N8N_BASE/webhook/session-event" `
        -Headers @{ 'Content-Type'='application/json' } `
        -Body '{"type":"page_view","uid":"u1","ts":1690000000000,"meta":{"path":"/market"}}'
    Write-Host "✅ Session Event 성공: $response3" -ForegroundColor Green
} catch {
    Write-Host "❌ Session Event 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 테스트 완료 ===" -ForegroundColor Green
Write-Host "n8n Executions 탭에서 결과를 확인하세요!" -ForegroundColor Cyan
Write-Host "웹 앱: http://127.0.0.1:5179" -ForegroundColor Cyan
