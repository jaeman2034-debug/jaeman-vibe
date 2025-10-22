# ACK 집계 함수 테스트 스크립트 (PowerShell)
# 사용법: .\test-ack-stats.ps1 -FunctionsHost <HOST> [-Minutes <MINUTES>]

param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionsHost,
    
    [Parameter(Mandatory=$false)]
    [int]$Minutes = 15
)

Write-Host "🔍 ACK 집계 함수 테스트" -ForegroundColor Cyan
Write-Host "Functions Host: $FunctionsHost" -ForegroundColor Gray
Write-Host "집계 구간: ${Minutes}분" -ForegroundColor Gray
Write-Host ""

# ACK 집계 테스트
Write-Host "1️⃣ ACK 집계 데이터 조회..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$FunctionsHost/ackz?m=$Minutes" -Method GET
    Write-Host "✅ ACK 집계 조회 성공" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 집계 결과:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    # 성공률 확인
    $rate = if ($response.ackRate) { $response.ackRate } else { 0 }
    $p90 = $response.p90Sec
    $total = if ($response.total) { $response.total } else { 0 }
    
    Write-Host ""
    Write-Host "📈 핵심 지표:" -ForegroundColor Cyan
    $ratePct = [math]::Round($rate * 100, 1)
    Write-Host "  - 성공률: ${ratePct}%" -ForegroundColor White
    Write-Host "  - P90 지연: ${p90}s" -ForegroundColor White
    Write-Host "  - 총 건수: $total" -ForegroundColor White
    
    # SLA 체크
    $ratePctInt = [math]::Round($rate * 100)
    if ($ratePctInt -ge 90 -and ($p90 -eq $null -or $p90 -le 60)) {
        Write-Host "  - SLA 상태: ✅ 정상" -ForegroundColor Green
    } elseif ($ratePctInt -lt 50) {
        Write-Host "  - SLA 상태: ❌ 오류" -ForegroundColor Red
    } else {
        Write-Host "  - SLA 상태: ⚠️ 경고" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ACK 집계 조회 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 테스트 완료!" -ForegroundColor Cyan
