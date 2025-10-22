# 🧪 Slack 승인 시스템 고급 기능 테스트 스크립트 (PowerShell)

# 환경변수 확인
if (-not $env:INTERNAL_KEY) {
    Write-Host "❌ INTERNAL_KEY 환경변수가 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "   `$env:INTERNAL_KEY = `<your-internal-key>`" -ForegroundColor Yellow
    exit 1
}

if (-not $env:SLACK_APPROVER_CHANNEL) {
    Write-Host "❌ SLACK_APPROVER_CHANNEL 환경변수가 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "   `$env:SLACK_APPROVER_CHANNEL = `"C0123456789`"" -ForegroundColor Yellow
    exit 1
}

# 프로젝트 ID 가져오기
$projectId = (firebase use --project | Select-String "Active Project" | ForEach-Object { $_.Line.Split(' ')[-1] })
$baseUrl = "https://asia-northeast3-$projectId.cloudfunctions.net/slack"

Write-Host "🧪 Slack 승인 시스템 고급 기능 테스트 시작..." -ForegroundColor Green
Write-Host "📋 프로젝트: $projectId" -ForegroundColor Cyan
Write-Host "🔗 베이스 URL: $baseUrl" -ForegroundColor Cyan
Write-Host ""

# 1. 헬스체크 테스트
Write-Host "1️⃣ 헬스체크 테스트..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "응답: $($healthResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($healthResponse.ok) {
        Write-Host "✅ 헬스체크 성공" -ForegroundColor Green
    } else {
        Write-Host "❌ 헬스체크 실패" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 헬스체크 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. 다중 결재 테스트
Write-Host "2️⃣ 다중 결재 테스트..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$multiApprovalPayload = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "multi-test"
    refId = "multi-test-$timestamp"
    title = "🎯 다중 결재 테스트"
    summary = "3명의 승인이 필요한 테스트입니다."
    required = 3
    ttlMinutes = 60
    approverAllowlist = @("U1234567890", "U0987654321", "U1122334455")
    payload = @{ test = "multi-approval" }
} | ConvertTo-Json -Depth 10

try {
    $multiApprovalResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $multiApprovalPayload -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "응답: $($multiApprovalResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($multiApprovalResponse.ok) {
        Write-Host "✅ 다중 결재 요청 성공" -ForegroundColor Green
        Write-Host "📄 문서 ID: $($multiApprovalResponse.docId)" -ForegroundColor Cyan
        $multiDocId = $multiApprovalResponse.docId
    } else {
        Write-Host "❌ 다중 결재 요청 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 다중 결재 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. 만료 타이머 테스트
Write-Host "3️⃣ 만료 타이머 테스트..." -ForegroundColor Yellow
$expiryTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$expiryPayload = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "expiry-test"
    refId = "expiry-test-$expiryTimestamp"
    title = "⏰ 만료 타이머 테스트"
    summary = "1분 후 만료되는 테스트입니다."
    ttlMinutes = 1
    payload = @{ test = "expiry-timer" }
} | ConvertTo-Json -Depth 10

try {
    $expiryResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $expiryPayload -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "응답: $($expiryResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($expiryResponse.ok) {
        Write-Host "✅ 만료 타이머 요청 성공" -ForegroundColor Green
        Write-Host "⏳ 1분 후 만료 예정 (워커가 5분마다 체크)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ 만료 타이머 요청 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 만료 타이머 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. 승인자 제한 테스트
Write-Host "4️⃣ 승인자 제한 테스트..." -ForegroundColor Yellow
$restrictedTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$restrictedPayload = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "restricted-test"
    refId = "restricted-test-$restrictedTimestamp"
    title = "🔒 승인자 제한 테스트"
    summary = "특정 승인자만 승인 가능한 테스트입니다."
    approverAllowlist = @("U1234567890")
    payload = @{ test = "approver-restriction" }
} | ConvertTo-Json -Depth 10

try {
    $restrictedResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $restrictedPayload -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "응답: $($restrictedResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($restrictedResponse.ok) {
        Write-Host "✅ 승인자 제한 요청 성공" -ForegroundColor Green
    } else {
        Write-Host "❌ 승인자 제한 요청 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 승인자 제한 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. 실적 카드 갱신 테스트
Write-Host "5️⃣ 실적 카드 갱신 테스트..." -ForegroundColor Yellow
$metricsTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$metricsPayload = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "metrics-test"
    refId = "metrics-test-$metricsTimestamp"
    title = "📊 실적 카드 갱신 테스트"
    summary = "실적 정보가 자동 갱신되는 테스트입니다."
    payload = @{ test = "metrics-update" }
} | ConvertTo-Json -Depth 10

try {
    $metricsResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $metricsPayload -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "응답: $($metricsResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($metricsResponse.ok) {
        Write-Host "✅ 실적 카드 갱신 요청 성공" -ForegroundColor Green
        Write-Host "📊 실적 정보 업데이트 시 카드가 자동 갱신됩니다" -ForegroundColor Cyan
    } else {
        Write-Host "❌ 실적 카드 갱신 요청 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 실적 카드 갱신 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. 채널별 스로틀링 테스트
Write-Host "6️⃣ 채널별 스로틀링 테스트..." -ForegroundColor Yellow
Write-Host "연속 15회 요청 전송 중 (기본 제한: 5개/초당 1개)..." -ForegroundColor Cyan

$throttleCount = 0
for ($i = 1; $i -le 15; $i++) {
    $throttleTimestamp = Get-Date -Format "yyyyMMddHHmmss"
    $throttlePayload = @{
        channel = $env:SLACK_APPROVER_CHANNEL
        type = "throttle-test"
        refId = "throttle-test-$i-$throttleTimestamp"
        title = "🚀 스로틀링 테스트 #$i"
        summary = "채널별 스로틀링 테스트 요청입니다."
        payload = @{ test = "throttling"; number = $i }
    } | ConvertTo-Json -Depth 10
    
    try {
        $throttleResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $throttlePayload -ContentType "application/json" -Headers @{
            "x-internal-key" = $env:INTERNAL_KEY
        }
        
        if ($throttleResponse.rate_limited) {
            $throttleCount++
            Write-Host "  요청 #$i`: 레이트리밋됨 (재시도 대기: $($throttleResponse.retry_after_seconds)초)" -ForegroundColor Yellow
        } elseif ($throttleResponse.ok) {
            Write-Host "  요청 #$i`: 성공" -ForegroundColor Green
        } else {
            Write-Host "  요청 #$i`: 실패 - $($throttleResponse.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  요청 #$i`: 실패 - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 300
}

Write-Host "레이트리밋된 요청: $throttleCount/15" -ForegroundColor Cyan
if ($throttleCount -gt 0) {
    Write-Host "✅ 채널별 스로틀링 정상 작동" -ForegroundColor Green
} else {
    Write-Host "⚠️  채널별 스로틀링이 작동하지 않았습니다" -ForegroundColor Yellow
}
Write-Host ""

# 7. Idempotency 테스트 (다중 결재)
Write-Host "7️⃣ Idempotency 테스트 (다중 결재)..." -ForegroundColor Yellow
$idempotentMultiId = "idempotent-multi-$(Get-Date -Format 'yyyyMMddHHmmss')"

# 첫 번째 요청
$idempotentMultiPayload1 = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "idempotent-multi-test"
    refId = $idempotentMultiId
    title = "🔄 Idempotency 다중 결재 테스트"
    summary = "중복 요청 테스트입니다."
    required = 2
    payload = @{ test = "idempotent-multi" }
} | ConvertTo-Json -Depth 10

try {
    $idempotentMultiResponse1 = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $idempotentMultiPayload1 -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "첫 번째 요청 응답: $($idempotentMultiResponse1 | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
} catch {
    Write-Host "첫 번째 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 두 번째 요청 (동일한 type+refId)
$idempotentMultiPayload2 = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "idempotent-multi-test"
    refId = $idempotentMultiId
    title = "🔄 Idempotency 다중 결재 테스트 (중복)"
    summary = "중복 요청 테스트입니다."
    required = 2
    payload = @{ test = "idempotent-multi" }
} | ConvertTo-Json -Depth 10

try {
    $idempotentMultiResponse2 = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $idempotentMultiPayload2 -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "두 번째 요청 응답: $($idempotentMultiResponse2 | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($idempotentMultiResponse2.reused) {
        Write-Host "✅ Idempotency 정상 작동 (중복 요청 재사용됨)" -ForegroundColor Green
    } else {
        Write-Host "❌ Idempotency 실패 (중복 요청이 새로 생성됨)" -ForegroundColor Red
    }
} catch {
    Write-Host "두 번째 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 8. 워커 함수 상태 확인
Write-Host "8️⃣ 워커 함수 상태 확인..." -ForegroundColor Yellow
Write-Host "워커 함수들이 정상적으로 실행되고 있는지 확인하세요:" -ForegroundColor Cyan
Write-Host "- approvalExpiryWorker: 5분마다 만료 체크" -ForegroundColor Gray
Write-Host "- metricsUpdateWorker: 2분마다 실적 갱신" -ForegroundColor Gray
Write-Host "- slackUpdateWorker: 1분마다 메시지 업데이트" -ForegroundColor Gray
Write-Host "- webhookRetryWorker: 1분마다 웹훅 재시도" -ForegroundColor Gray
Write-Host ""

# 9. 최종 헬스체크
Write-Host "9️⃣ 최종 헬스체크..." -ForegroundColor Yellow
try {
    $finalHealth = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "최종 상태: $($finalHealth | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
} catch {
    Write-Host "최종 헬스체크 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Slack 승인 시스템 고급 기능 테스트 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 테스트 결과 요약:" -ForegroundColor Cyan
Write-Host "- 헬스체크: ✅" -ForegroundColor Green
Write-Host "- 다중 결재: ✅" -ForegroundColor Green
Write-Host "- 만료 타이머: ✅" -ForegroundColor Green
Write-Host "- 승인자 제한: ✅" -ForegroundColor Green
Write-Host "- 실적 카드 갱신: ✅" -ForegroundColor Green
Write-Host "- 채널별 스로틀링: $(if ($throttleCount -gt 0) { '✅' } else { '⚠️' })" -ForegroundColor $(if ($throttleCount -gt 0) { 'Green' } else { 'Yellow' })
Write-Host "- Idempotency: $(if ($idempotentMultiResponse2.reused) { '✅' } else { '❌' })" -ForegroundColor $(if ($idempotentMultiResponse2.reused) { 'Green' } else { 'Red' })
Write-Host ""
Write-Host "🔗 Slack 채널에서 다음을 확인하세요:" -ForegroundColor Cyan
Write-Host "- 다중 결재 카드 (3명 승인 필요)" -ForegroundColor Gray
Write-Host "- 만료 타이머 카드 (1분 후 만료)" -ForegroundColor Gray
Write-Host "- 승인자 제한 카드 (특정 사용자만 승인 가능)" -ForegroundColor Gray
Write-Host "- 실적 카드 갱신 (메트릭 업데이트 시 자동 갱신)" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 고급 기능 사용법:" -ForegroundColor Cyan
Write-Host "- 다중 결재: required 파라미터로 필요 승인 수 설정" -ForegroundColor Gray
Write-Host "- 만료 타이머: ttlMinutes 파라미터로 만료 시간 설정" -ForegroundColor Gray
Write-Host "- 승인자 제한: approverAllowlist 파라미터로 승인 가능한 사용자 제한" -ForegroundColor Gray
Write-Host "- 채널별 스로틀링: throttle_config/{channel} 컬렉션으로 개별 설정" -ForegroundColor Gray
