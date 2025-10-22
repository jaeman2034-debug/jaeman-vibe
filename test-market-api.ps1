# YAGO VIBE Market API 테스트 스크립트
# Docker Compose 실행 후 이 스크립트를 실행하세요

Write-Host "🚀 YAGO VIBE Market API 테스트 시작" -ForegroundColor Green
Write-Host ""

# 1. 상품 생성 테스트
Write-Host "1️⃣ 상품 생성 테스트 (market.create)" -ForegroundColor Yellow
$body = @{
  intent = "market.create"
  payload = @{
    title = "축구공"
    description = "나이키 정품"
    price = 30000
  }
} | ConvertTo-Json -Depth 5

try {
  $response1 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/chat-final" `
    -Method POST -ContentType "application/json" -Body $body
  Write-Host "✅ 상품 생성 성공:" -ForegroundColor Green
  $response1 | ConvertTo-Json -Depth 3
} catch {
  Write-Host "❌ 상품 생성 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. 전체 목록 조회 테스트
Write-Host "2️⃣ 전체 목록 조회 테스트 (market.list)" -ForegroundColor Yellow
$body = @{ intent = "market.list" } | ConvertTo-Json

try {
  $response2 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/chat-final" `
    -Method POST -ContentType "application/json" -Body $body
  Write-Host "✅ 목록 조회 성공:" -ForegroundColor Green
  $response2 | ConvertTo-Json -Depth 3
} catch {
  Write-Host "❌ 목록 조회 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. 특정 상품 조회 테스트
Write-Host "3️⃣ 특정 상품 조회 테스트 (market.get)" -ForegroundColor Yellow
$body = @{
  intent = "market.get"
  payload = @{ id = 1 }
} | ConvertTo-Json -Depth 5

try {
  $response3 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/chat-final" `
    -Method POST -ContentType "application/json" -Body $body
  Write-Host "✅ 상품 조회 성공:" -ForegroundColor Green
  $response3 | ConvertTo-Json -Depth 3
} catch {
  Write-Host "❌ 상품 조회 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. 상태 업데이트 테스트
Write-Host "4️⃣ 상태 업데이트 테스트 (market.updateStatus)" -ForegroundColor Yellow
$body = @{
  intent = "market.updateStatus"
  payload = @{
    id = 1
    status = "sold"
  }
} | ConvertTo-Json -Depth 5

try {
  $response4 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/chat-final" `
    -Method POST -ContentType "application/json" -Body $body
  Write-Host "✅ 상태 업데이트 성공:" -ForegroundColor Green
  $response4 | ConvertTo-Json -Depth 3
} catch {
  Write-Host "❌ 상태 업데이트 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. 상품 삭제 테스트
Write-Host "5️⃣ 상품 삭제 테스트 (market.delete)" -ForegroundColor Yellow
$body = @{
  intent = "market.delete"
  payload = @{ id = 1 }
} | ConvertTo-Json -Depth 5

try {
  $response5 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/chat-final" `
    -Method POST -ContentType "application/json" -Body $body
  Write-Host "✅ 상품 삭제 성공:" -ForegroundColor Green
  $response5 | ConvertTo-Json -Depth 3
} catch {
  Write-Host "❌ 상품 삭제 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎉 Market API 테스트 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 테스트 순서:" -ForegroundColor Cyan
Write-Host "1. docker compose up -d" -ForegroundColor White
Write-Host "2. n8n에서 market-intent-sqlite.json 워크플로우 Import & 활성화" -ForegroundColor White
Write-Host "3. 이 스크립트 실행: .\test-market-api.ps1" -ForegroundColor White
