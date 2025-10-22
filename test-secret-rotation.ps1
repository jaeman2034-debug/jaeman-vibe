# 이중허용 시크릿 검증 테스트 스크립트 (PowerShell)
# 사용법: .\test-secret-rotation.ps1 -FunctionsHost <HOST> -NewSecret <SECRET> -OldSecret <OLD_SECRET>

param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionsHost,
    
    [Parameter(Mandatory=$true)]
    [string]$NewSecret,
    
    [Parameter(Mandatory=$true)]
    [string]$OldSecret
)

Write-Host "🔍 이중허용 시크릿 검증 테스트" -ForegroundColor Cyan
Write-Host "Functions Host: $FunctionsHost" -ForegroundColor Gray
Write-Host ""

# 새 키로 테스트
Write-Host "1️⃣ 새 키로 fanoutAck 테스트..." -ForegroundColor Yellow
$body1 = @{
    eventId = "E1"
    outboxId = "X"
    channel = "email"
    ok = $true
} | ConvertTo-Json

$headers1 = @{
    "Content-Type" = "application/json"
    "x-auth" = $NewSecret
}

try {
    $response1 = Invoke-RestMethod -Uri "$FunctionsHost/fanoutAck" -Method POST -Body $body1 -Headers $headers1
    if ($response1.ok -eq $true) {
        Write-Host "✅ 새 키 테스트 성공" -ForegroundColor Green
    } else {
        Write-Host "❌ 새 키 테스트 실패: $($response1 | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 새 키 테스트 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 구 키로 테스트 (회전 윈도우 동안만 허용)
Write-Host "2️⃣ 구 키로 fanoutAck 테스트..." -ForegroundColor Yellow
$body2 = @{
    eventId = "E1"
    outboxId = "X"
    channel = "email"
    ok = $true
} | ConvertTo-Json

$headers2 = @{
    "Content-Type" = "application/json"
    "x-auth" = $OldSecret
}

try {
    $response2 = Invoke-RestMethod -Uri "$FunctionsHost/fanoutAck" -Method POST -Body $body2 -Headers $headers2
    if ($response2.ok -eq $true) {
        Write-Host "✅ 구 키 테스트 성공 (이중허용 정상)" -ForegroundColor Green
    } else {
        Write-Host "❌ 구 키 테스트 실패: $($response2 | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 구 키 테스트 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 잘못된 키로 테스트
Write-Host "3️⃣ 잘못된 키로 fanoutAck 테스트..." -ForegroundColor Yellow
$body3 = @{
    eventId = "E1"
    outboxId = "X"
    channel = "email"
    ok = $true
} | ConvertTo-Json

$headers3 = @{
    "Content-Type" = "application/json"
    "x-auth" = "invalid-key"
}

try {
    $response3 = Invoke-RestMethod -Uri "$FunctionsHost/fanoutAck" -Method POST -Body $body3 -Headers $headers3
    Write-Host "❌ 잘못된 키가 허용됨: $($response3 | ConvertTo-Json)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ 잘못된 키 거부 정상" -ForegroundColor Green
    } else {
        Write-Host "❌ 예상과 다른 응답: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 테스트 완료!" -ForegroundColor Cyan
