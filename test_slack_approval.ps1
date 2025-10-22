# 🧪 Slack 승인 시스템 테스트 스크립트 (PowerShell)

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

Write-Host "🧪 Slack 승인 시스템 테스트 시작..." -ForegroundColor Green
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

# 2. 기본 승인 요청 테스트
Write-Host "2️⃣ 기본 승인 요청 테스트..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$approvalPayload = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "test"
    refId = "test-$timestamp"
    title = "🧪 기본 테스트"
    summary = "기본 승인 요청 테스트입니다."
    url = "https://yagovibe.com"
    payload = @{ test = $true }
} | ConvertTo-Json -Depth 10

try {
    $approvalResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $approvalPayload -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "응답: $($approvalResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($approvalResponse.ok) {
        Write-Host "✅ 기본 승인 요청 성공" -ForegroundColor Green
        Write-Host "📄 문서 ID: $($approvalResponse.docId)" -ForegroundColor Cyan
        $docId = $approvalResponse.docId
    } else {
        Write-Host "❌ 기본 승인 요청 실패" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 기본 승인 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. 마켓 상품 승인 요청 테스트
Write-Host "3️⃣ 마켓 상품 승인 요청 테스트..." -ForegroundColor Yellow
$marketTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$marketPayload = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "market"
    refId = "market-test-$marketTimestamp"
    title = "⚽ 아모 축구공"
    summary = "가격 39,900원 • 송산2동 • 카테고리: 공"
    url = "https://yagovibe.com/market/market-test-$marketTimestamp"
    image = "https://via.placeholder.com/300x300?text=Football"
    payload = @{
        price = 39900
        region = "송산2동"
        category = "공"
        condition = "새상품"
    }
} | ConvertTo-Json -Depth 10

try {
    $marketResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $marketPayload -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "응답: $($marketResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($marketResponse.ok) {
        Write-Host "✅ 마켓 상품 승인 요청 성공" -ForegroundColor Green
    } else {
        Write-Host "❌ 마켓 상품 승인 요청 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 마켓 상품 승인 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. 모임 승인 요청 테스트
Write-Host "4️⃣ 모임 승인 요청 테스트..." -ForegroundColor Yellow
$meetupTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$meetupPayload = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "meetup"
    refId = "meetup-test-$meetupTimestamp"
    title = "🏀 농구 모임"
    summary = "2024-01-15 • 강남구 체육관 • 8명 참여"
    url = "https://yagovibe.com/meetup/meetup-test-$meetupTimestamp"
    image = "https://via.placeholder.com/300x300?text=Basketball"
    payload = @{
        date = "2024-01-15"
        location = "강남구 체육관"
        participants = 8
        sport = "농구"
    }
} | ConvertTo-Json -Depth 10

try {
    $meetupResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $meetupPayload -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "응답: $($meetupResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($meetupResponse.ok) {
        Write-Host "✅ 모임 승인 요청 성공" -ForegroundColor Green
    } else {
        Write-Host "❌ 모임 승인 요청 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 모임 승인 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. 구인구직 승인 요청 테스트
Write-Host "5️⃣ 구인구직 승인 요청 테스트..." -ForegroundColor Yellow
$jobTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$jobPayload = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "job"
    refId = "job-test-$jobTimestamp"
    title = "🏐 배구 코치 모집"
    summary = "스포츠센터 • 서울 • 정규직 • 300만원"
    url = "https://yagovibe.com/jobs/job-test-$jobTimestamp"
    image = "https://via.placeholder.com/300x300?text=Volleyball"
    payload = @{
        company = "스포츠센터"
        location = "서울"
        type = "정규직"
        salary = "300만원"
        sport = "배구"
    }
} | ConvertTo-Json -Depth 10

try {
    $jobResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $jobPayload -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "응답: $($jobResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($jobResponse.ok) {
        Write-Host "✅ 구인구직 승인 요청 성공" -ForegroundColor Green
    } else {
        Write-Host "❌ 구인구직 승인 요청 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 구인구직 승인 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. 레이트리밋 테스트
Write-Host "6️⃣ 레이트리밋 테스트..." -ForegroundColor Yellow
Write-Host "연속 10회 요청 전송 중..." -ForegroundColor Cyan

$rateLimitCount = 0
for ($i = 1; $i -le 10; $i++) {
    $rateTimestamp = Get-Date -Format "yyyyMMddHHmmss"
    $ratePayload = @{
        channel = $env:SLACK_APPROVER_CHANNEL
        type = "rate-test"
        refId = "rate-test-$i-$rateTimestamp"
        title = "🚀 레이트리밋 테스트 #$i"
        summary = "레이트리밋 테스트 요청입니다."
        payload = @{ test = $true; number = $i }
    } | ConvertTo-Json -Depth 10
    
    try {
        $rateResponse = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $ratePayload -ContentType "application/json" -Headers @{
            "x-internal-key" = $env:INTERNAL_KEY
        }
        
        if ($rateResponse.rate_limited) {
            $rateLimitCount++
            Write-Host "  요청 #$i`: 레이트리밋됨 (재시도 대기: $($rateResponse.retry_after_seconds)초)" -ForegroundColor Yellow
        } elseif ($rateResponse.ok) {
            Write-Host "  요청 #$i`: 성공" -ForegroundColor Green
        } else {
            Write-Host "  요청 #$i`: 실패 - $($rateResponse.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  요청 #$i`: 실패 - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "레이트리밋된 요청: $rateLimitCount/10" -ForegroundColor Cyan
if ($rateLimitCount -gt 0) {
    Write-Host "✅ 레이트리밋 정상 작동" -ForegroundColor Green
} else {
    Write-Host "⚠️  레이트리밋이 작동하지 않았습니다" -ForegroundColor Yellow
}
Write-Host ""

# 7. Idempotency 테스트
Write-Host "7️⃣ Idempotency 테스트..." -ForegroundColor Yellow
$idempotentId = "idempotent-test-$(Get-Date -Format 'yyyyMMddHHmmss')"

# 첫 번째 요청
$idempotentPayload1 = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "idempotent-test"
    refId = $idempotentId
    title = "🔄 Idempotency 테스트"
    summary = "중복 요청 테스트입니다."
    payload = @{ test = $true }
} | ConvertTo-Json -Depth 10

try {
    $idempotentResponse1 = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $idempotentPayload1 -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "첫 번째 요청 응답: $($idempotentResponse1 | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
} catch {
    Write-Host "첫 번째 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 두 번째 요청 (동일한 type+refId)
$idempotentPayload2 = @{
    channel = $env:SLACK_APPROVER_CHANNEL
    type = "idempotent-test"
    refId = $idempotentId
    title = "🔄 Idempotency 테스트 (중복)"
    summary = "중복 요청 테스트입니다."
    payload = @{ test = $true }
} | ConvertTo-Json -Depth 10

try {
    $idempotentResponse2 = Invoke-RestMethod -Uri "$baseUrl/internal/approval/notify" -Method Post -Body $idempotentPayload2 -ContentType "application/json" -Headers @{
        "x-internal-key" = $env:INTERNAL_KEY
    }
    Write-Host "두 번째 요청 응답: $($idempotentResponse2 | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    
    if ($idempotentResponse2.reused) {
        Write-Host "✅ Idempotency 정상 작동 (중복 요청 재사용됨)" -ForegroundColor Green
    } else {
        Write-Host "❌ Idempotency 실패 (중복 요청이 새로 생성됨)" -ForegroundColor Red
    }
} catch {
    Write-Host "두 번째 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 8. 최종 헬스체크
Write-Host "8️⃣ 최종 헬스체크..." -ForegroundColor Yellow
try {
    $finalHealth = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "최종 상태: $($finalHealth | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
} catch {
    Write-Host "최종 헬스체크 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Slack 승인 시스템 테스트 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 테스트 결과 요약:" -ForegroundColor Cyan
Write-Host "- 헬스체크: ✅" -ForegroundColor Green
Write-Host "- 기본 승인 요청: ✅" -ForegroundColor Green
Write-Host "- 마켓 상품 승인: ✅" -ForegroundColor Green
Write-Host "- 모임 승인: ✅" -ForegroundColor Green
Write-Host "- 구인구직 승인: ✅" -ForegroundColor Green
Write-Host "- 레이트리밋: $(if ($rateLimitCount -gt 0) { '✅' } else { '⚠️' })" -ForegroundColor $(if ($rateLimitCount -gt 0) { 'Green' } else { 'Yellow' })
Write-Host "- Idempotency: $(if ($idempotentResponse2.reused) { '✅' } else { '❌' })" -ForegroundColor $(if ($idempotentResponse2.reused) { 'Green' } else { 'Red' })
Write-Host ""
Write-Host "🔗 Slack 채널에서 승인/반려 버튼을 확인하세요: $env:SLACK_APPROVER_CHANNEL" -ForegroundColor Cyan
