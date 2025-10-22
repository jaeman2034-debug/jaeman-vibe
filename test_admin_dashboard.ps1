# Slack 승인 시스템 운영 대시보드 테스트 스크립트 (PowerShell)

param(
    [string]$InternalKey = $env:INTERNAL_KEY,
    [string]$ProjectId = $env:PROJECT_ID
)

# 환경변수 확인
if (-not $InternalKey) {
    Write-Host "❌ INTERNAL_KEY 환경변수가 설정되지 않았습니다" -ForegroundColor Red
    Write-Host "`$env:INTERNAL_KEY = 'your-internal-key'" -ForegroundColor Yellow
    exit 1
}

if (-not $ProjectId) {
    Write-Host "❌ PROJECT_ID 환경변수가 설정되지 않았습니다" -ForegroundColor Red
    Write-Host "`$env:PROJECT_ID = 'your-project-id'" -ForegroundColor Yellow
    exit 1
}

$ApiBase = "https://asia-northeast3-$ProjectId.cloudfunctions.net/slack"

Write-Host "🚀 Slack 승인 시스템 운영 대시보드 테스트 시작" -ForegroundColor Green
Write-Host "API Base: $ApiBase"
Write-Host ""

# 1. 대시보드 데이터 조회
Write-Host "📊 1. 대시보드 데이터 조회 테스트" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiBase/admin/dashboard" -Method GET -Headers @{
        "x-internal-key" = $InternalKey
    }
    
    Write-Host "✅ 대시보드 데이터 조회 성공" -ForegroundColor Green
    Write-Host "응답: $($response.ok)"
    
    # 데이터 구조 확인
    $approvalsCount = $response.data.approvals.Count
    $metricsOk = $response.data.metrics.okCount
    $metricsErr = $response.data.metrics.errCount
    
    Write-Host "  - 승인 요청 수: $approvalsCount"
    Write-Host "  - 성공 요청: $metricsOk"
    Write-Host "  - 실패 요청: $metricsErr"
} catch {
    Write-Host "❌ 대시보드 데이터 조회 실패" -ForegroundColor Red
    Write-Host "오류: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# 2. 채널별 스로틀링 설정 테스트
Write-Host "⚙️ 2. 채널별 스로틀링 설정 테스트" -ForegroundColor Yellow
$testChannel = "C1234567890"

try {
    $body = @{
        capacity = 10
        refillPerSec = 2
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$ApiBase/admin/throttle/$testChannel" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "x-internal-key" = $InternalKey
    } -Body $body

    Write-Host "✅ 스로틀링 설정 업데이트 성공" -ForegroundColor Green
    Write-Host "응답: $($response.message)"
} catch {
    Write-Host "❌ 스로틀링 설정 업데이트 실패" -ForegroundColor Red
    Write-Host "오류: $($_.Exception.Message)"
}

Write-Host ""

# 3. 큐 재시도 테스트
Write-Host "🔄 3. 큐 재시도 테스트" -ForegroundColor Yellow

# 웹훅 재시도 큐
try {
    $body = @{
        limit = 5
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$ApiBase/admin/retry/webhook_retry" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "x-internal-key" = $InternalKey
    } -Body $body

    Write-Host "✅ 웹훅 재시도 큐 테스트 성공" -ForegroundColor Green
    Write-Host "  - 처리된 항목: $($response.processed)/$($response.total)"
} catch {
    Write-Host "❌ 웹훅 재시도 큐 테스트 실패" -ForegroundColor Red
    Write-Host "오류: $($_.Exception.Message)"
}

# Slack 업데이트 큐
try {
    $body = @{
        limit = 5
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$ApiBase/admin/retry/slack_update" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "x-internal-key" = $InternalKey
    } -Body $body

    Write-Host "✅ Slack 업데이트 큐 테스트 성공" -ForegroundColor Green
    Write-Host "  - 처리된 항목: $($response.processed)/$($response.total)"
} catch {
    Write-Host "❌ Slack 업데이트 큐 테스트 실패" -ForegroundColor Red
    Write-Host "오류: $($_.Exception.Message)"
}

Write-Host ""

# 4. 헬스체크 테스트
Write-Host "🏥 4. 헬스체크 테스트" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiBase/health" -Method GET

    Write-Host "✅ 헬스체크 성공" -ForegroundColor Green
    Write-Host "  - 리전: $($response.region)"
    Write-Host "  - Slack 설정: $($response.slack)"
    Write-Host "  - 서명 검증: $($response.signing)"
} catch {
    Write-Host "❌ 헬스체크 실패" -ForegroundColor Red
    Write-Host "오류: $($_.Exception.Message)"
}

Write-Host ""

# 5. 운영 대시보드 접근 테스트
Write-Host "🎛️ 5. 운영 대시보드 접근 테스트" -ForegroundColor Yellow
Write-Host "대시보드 URL: $ApiBase/admin/dashboard"
Write-Host "헤더: x-internal-key: $InternalKey"

Write-Host ""
Write-Host "✅ 모든 테스트 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 다음 단계:" -ForegroundColor Cyan
Write-Host "1. 운영 대시보드에 접속하여 데이터 확인"
Write-Host "2. 채널별 스로틀링 설정 조정"
Write-Host "3. 큐 상태 모니터링"
Write-Host "4. 승인 항목 재오픈 테스트"
