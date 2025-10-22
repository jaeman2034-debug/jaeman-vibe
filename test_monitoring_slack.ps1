# monitoringToSlack 함수 테스트 스크립트 (PowerShell)

param(
    [string]$ProjectId = ""
)

if ([string]::IsNullOrEmpty($ProjectId)) {
    $ProjectId = firebase use --current
    if ([string]::IsNullOrEmpty($ProjectId)) {
        Write-Host "❌ 프로젝트 ID를 제공하세요: .\test_monitoring_slack.ps1 -ProjectId <PROJECT_ID>" -ForegroundColor Red
        exit 1
    }
}

$FunctionUrl = "https://asia-northeast3-$ProjectId.cloudfunctions.net/monitoringToSlack"

Write-Host "🧪 monitoringToSlack 함수 테스트 시작..." -ForegroundColor Green
Write-Host "📋 프로젝트: $ProjectId" -ForegroundColor Cyan
Write-Host "🔗 함수 URL: $FunctionUrl" -ForegroundColor Cyan
Write-Host ""

# 1. OPEN 상태 테스트
Write-Host "🔥 1. OPEN 상태 테스트..." -ForegroundColor Yellow
$OpenJson = Get-Content "monitoring_sample_open.json" -Raw
$OpenResponse = Invoke-RestMethod -Uri $FunctionUrl -Method POST -ContentType "application/json" -Body $OpenJson
Write-Host "Response: $($OpenResponse | ConvertTo-Json)" -ForegroundColor White

Write-Host ""
Write-Host "⏳ 2초 대기 중..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# 2. 중복 전송 테스트 (rate-limited 확인)
Write-Host "🔄 2. 중복 전송 테스트 (rate-limited 확인)..." -ForegroundColor Yellow
try {
    $DuplicateResponse = Invoke-RestMethod -Uri $FunctionUrl -Method POST -ContentType "application/json" -Body $OpenJson
    Write-Host "Response: $($DuplicateResponse | ConvertTo-Json)" -ForegroundColor White
} catch {
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor White
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor White
}

Write-Host ""
Write-Host "⏳ 3초 대기 중..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 3. CLOSED 상태 테스트
Write-Host "✅ 3. CLOSED 상태 테스트..." -ForegroundColor Yellow
$ClosedJson = Get-Content "monitoring_sample_closed.json" -Raw
$ClosedResponse = Invoke-RestMethod -Uri $FunctionUrl -Method POST -ContentType "application/json" -Body $ClosedJson
Write-Host "Response: $($ClosedResponse | ConvertTo-Json)" -ForegroundColor White

Write-Host ""
Write-Host "✅ 테스트 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Slack에서 다음을 확인하세요:" -ForegroundColor Cyan
Write-Host "   - 🔥 ALERT OPEN 메시지 (빨간색)" -ForegroundColor White
Write-Host "   - ✅ RESOLVED 메시지 (초록색)" -ForegroundColor White
Write-Host "   - 중복 메시지는 rate-limited로 스킵됨" -ForegroundColor White
