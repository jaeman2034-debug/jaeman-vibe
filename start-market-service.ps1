Write-Host "Market Service를 시작합니다..." -ForegroundColor Green
Write-Host ""

# 환경변수 설정
$env:INTERNAL_KEY = "dev-internal-key-123"
$env:DB_PATH = "./market.db"
$env:PORT = "5678"

Write-Host "환경변수 설정:" -ForegroundColor Yellow
Write-Host "INTERNAL_KEY=$env:INTERNAL_KEY"
Write-Host "DB_PATH=$env:DB_PATH"
Write-Host "PORT=$env:PORT"
Write-Host ""

# Node.js 실행
Write-Host "Node.js로 서비스를 시작합니다..." -ForegroundColor Cyan
try {
    node market-service.js
} catch {
    Write-Host "Node.js 실행 중 오류가 발생했습니다: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Node.js가 설치되어 있고 PATH에 설정되어 있는지 확인하세요." -ForegroundColor Yellow
}

Read-Host "Press Enter to continue"
