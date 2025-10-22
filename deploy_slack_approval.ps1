# 🚀 Slack 승인→발행 시스템 배포 스크립트 (PowerShell)

param(
    [switch]$Test
)

Write-Host "🚀 Slack 승인→발행 시스템 배포 시작..." -ForegroundColor Green

# 1. 환경변수 확인
Write-Host "📋 환경변수 확인 중..." -ForegroundColor Yellow

if (-not $env:SLACK_BOT_TOKEN) {
    Write-Host "❌ SLACK_BOT_TOKEN이 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "   firebase functions:config:set slack.bot_token=`"xoxb-...`"" -ForegroundColor Yellow
    exit 1
}

if (-not $env:SLACK_SIGNING_SECRET) {
    Write-Host "❌ SLACK_SIGNING_SECRET이 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "   firebase functions:config:set slack.signing_secret=`"...`"" -ForegroundColor Yellow
    exit 1
}

if (-not $env:SLACK_APPROVER_CHANNEL) {
    Write-Host "❌ SLACK_APPROVER_CHANNEL이 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "   firebase functions:config:set slack.approver_channel=`"C0123456789`"" -ForegroundColor Yellow
    exit 1
}

if (-not $env:INTERNAL_KEY) {
    Write-Host "❌ INTERNAL_KEY가 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "   firebase functions:config:set internal.key=`"<랜덤키>`"" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 환경변수 확인 완료" -ForegroundColor Green

# 2. Firebase Functions Config 설정
Write-Host "🔧 Firebase Functions Config 설정 중..." -ForegroundColor Yellow

# 기본 설정
firebase functions:config:set `
  slack.bot_token="$env:SLACK_BOT_TOKEN" `
  slack.signing_secret="$env:SLACK_SIGNING_SECRET" `
  slack.approver_channel="$env:SLACK_APPROVER_CHANNEL" `
  internal.key="$env:INTERNAL_KEY"

# 레이트리밋 설정 (기본값)
firebase functions:config:set `
  rate.capacity=5 `
  rate.refill_per_sec=1

# 재시도 설정 (기본값)
firebase functions:config:set `
  retry.max_attempts=6 `
  update.retry_max_attempts=8

Write-Host "✅ Config 설정 완료" -ForegroundColor Green

# 3. n8n 웹훅 설정 (선택)
if ($env:N8N_WEBHOOK_APPROVED) {
    Write-Host "🔗 n8n 웹훅 설정 중..." -ForegroundColor Yellow
    firebase functions:config:set n8n.approved_webhook="$env:N8N_WEBHOOK_APPROVED"
    
    if ($env:N8N_WEBHOOK_APPROVED_FO) {
        firebase functions:config:set n8n.approved_webhook_fo="$env:N8N_WEBHOOK_APPROVED_FO"
        Write-Host "✅ n8n 웹훅 (페일오버 포함) 설정 완료" -ForegroundColor Green
    } else {
        Write-Host "✅ n8n 웹훅 설정 완료" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  N8N_WEBHOOK_APPROVED가 설정되지 않았습니다. 승인 시 웹훅 호출이 건너뜁니다." -ForegroundColor Yellow
}

# 4. 함수 배포
Write-Host "🚀 함수 배포 중..." -ForegroundColor Yellow

# 메인 함수들 배포
firebase deploy --only functions:slack,functions:slackUpdateWorker,functions:webhookRetryWorker,functions:approvalExpiryWorker,functions:metricsUpdateWorker,functions:autoResubmitWorker,functions:generateSecurityRules

Write-Host "✅ 함수 배포 완료" -ForegroundColor Green

# 5. 헬스체크 테스트
Write-Host "🏥 헬스체크 테스트 중..." -ForegroundColor Yellow

# 잠시 대기 (배포 완료 대기)
Start-Sleep -Seconds 10

# 프로젝트 ID 가져오기
$projectId = (firebase use --project | Select-String "Active Project" | ForEach-Object { $_.Line.Split(' ')[-1] })
$healthUrl = "https://asia-northeast3-$projectId.cloudfunctions.net/slack/health"

Write-Host "🔍 헬스체크 URL: $healthUrl" -ForegroundColor Cyan

try {
    $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method Get
    if ($healthResponse.ok) {
        Write-Host "✅ 헬스체크 성공" -ForegroundColor Green
        
        # 상세 상태 출력
        Write-Host "📊 시스템 상태:" -ForegroundColor Cyan
        $healthResponse | ConvertTo-Json -Depth 10
    } else {
        Write-Host "❌ 헬스체크 실패" -ForegroundColor Red
        Write-Host "   URL: $healthUrl" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ 헬스체크 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 6. 테스트 승인 요청 (선택)
if ($Test) {
    Write-Host "🧪 테스트 승인 요청 전송 중..." -ForegroundColor Yellow
    
    $testUrl = "https://asia-northeast3-$projectId.cloudfunctions.net/slack/internal/approval/notify"
    $testPayload = @{
        channel = $env:SLACK_APPROVER_CHANNEL
        type = "test"
        refId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        title = "🚀 배포 테스트"
        summary = "Slack 승인 시스템 배포가 완료되었습니다."
        url = "https://yagovibe.com"
        payload = @{
            test = $true
            timestamp = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $testResponse = Invoke-RestMethod -Uri $testUrl -Method Post -Body $testPayload -ContentType "application/json" -Headers @{
            "x-internal-key" = $env:INTERNAL_KEY
        }
        Write-Host "✅ 테스트 승인 요청 전송 완료" -ForegroundColor Green
        Write-Host "   Slack 채널에서 승인/반려 버튼을 확인하세요." -ForegroundColor Cyan
    } catch {
        Write-Host "❌ 테스트 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Slack 승인→발행 시스템 배포 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 다음 단계:" -ForegroundColor Cyan
Write-Host "1. Slack 채널에서 승인/반려 버튼 테스트"
Write-Host "2. 프론트엔드에서 requestApproval() 함수 연동"
Write-Host "3. 모니터링 대시보드 설정"
Write-Host ""
Write-Host "🔗 유용한 링크:" -ForegroundColor Cyan
Write-Host "- 헬스체크: $healthUrl"
Write-Host "- 설정 가이드: SLACK_APPROVAL_SETUP.md"
Write-Host ""
