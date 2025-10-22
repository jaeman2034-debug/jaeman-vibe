# Slack 승인→발행 시스템 테스트 스크립트 (PowerShell)
# Patchset V21: Slack Approval System

param(
    [string]$FunctionsUrl = "https://asia-northeast3-your-project.cloudfunctions.net/slack",
    [string]$InternalKey = "your-internal-key",
    [string]$SlackChannel = "C0123456789"
)

# 로그 함수
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "Blue" }
    }
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

# 테스트 1: 헬스체크
function Test-Health {
    Write-Log "Testing Health Check..." "INFO"
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionsUrl/slack/health" -Method GET
        if ($response.status -eq "healthy") {
            Write-Log "Health check passed" "SUCCESS"
            $response | ConvertTo-Json -Depth 3
        } else {
            Write-Log "Health check failed" "ERROR"
            $response | ConvertTo-Json -Depth 3
        }
    } catch {
        Write-Log "Health check failed: $($_.Exception.Message)" "ERROR"
    }
}

# 테스트 2: 승인 카드 띄우기 (마켓)
function Test-MarketApproval {
    Write-Log "Testing Market Approval Request..." "INFO"
    
    $marketId = "market_$(Get-Date -Format 'yyyyMMddHHmmss')"
    $body = @{
        channel = $SlackChannel
        type = "market"
        refId = $marketId
        title = "아모 축구공 등록"
        summary = "가격 39,900원 • 송산2동 • 카테고리: 공"
        url = "https://yagovibe.com/market/$marketId"
        image = "https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=축구공"
        payload = @{
            price = 39900
            region = "송산2동"
            category = "공"
            condition = "새상품"
        }
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionsUrl/slack/internal/approval/notify" -Method POST -Body $body -ContentType "application/json" -Headers @{"x-internal-key" = $InternalKey}
        if ($response.ok) {
            Write-Log "Market approval request sent" "SUCCESS"
            $response | ConvertTo-Json -Depth 3
        } else {
            Write-Log "Market approval request failed" "ERROR"
            $response | ConvertTo-Json -Depth 3
        }
    } catch {
        Write-Log "Market approval request failed: $($_.Exception.Message)" "ERROR"
    }
}

# 테스트 3: 승인 카드 띄우기 (모임)
function Test-MeetupApproval {
    Write-Log "Testing Meetup Approval Request..." "INFO"
    
    $meetupId = "meetup_$(Get-Date -Format 'yyyyMMddHHmmss')"
    $body = @{
        channel = $SlackChannel
        type = "meetup"
        refId = $meetupId
        title = "주말 축구 모임"
        summary = "9/21(일) 14:00 • 잠실보조 • 8vs8 • 참가비 5,000원"
        url = "https://yagovibe.com/meetups/$meetupId"
        image = "https://via.placeholder.com/400x300/10B981/FFFFFF?text=축구모임"
        payload = @{
            date = "2024-09-21"
            time = "14:00"
            location = "잠실보조"
            maxParticipants = 16
            fee = 5000
        }
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionsUrl/slack/internal/approval/notify" -Method POST -Body $body -ContentType "application/json" -Headers @{"x-internal-key" = $InternalKey}
        if ($response.ok) {
            Write-Log "Meetup approval request sent" "SUCCESS"
            $response | ConvertTo-Json -Depth 3
        } else {
            Write-Log "Meetup approval request failed" "ERROR"
            $response | ConvertTo-Json -Depth 3
        }
    } catch {
        Write-Log "Meetup approval request failed: $($_.Exception.Message)" "ERROR"
    }
}

# 테스트 4: 승인 카드 띄우기 (구인)
function Test-JobApproval {
    Write-Log "Testing Job Approval Request..." "INFO"
    
    $jobId = "job_$(Get-Date -Format 'yyyyMMddHHmmss')"
    $body = @{
        channel = $SlackChannel
        type = "job"
        refId = $jobId
        title = "축구 코치 모집"
        summary = "주 3회 • 시간협의 • 급여 30만원 • 경력 2년 이상"
        url = "https://yagovibe.com/jobs/$jobId"
        image = "https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=구인공고"
        payload = @{
            position = "축구 코치"
            schedule = "주 3회"
            salary = 300000
            experience = "2년 이상"
            location = "서울"
        }
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionsUrl/slack/internal/approval/notify" -Method POST -Body $body -ContentType "application/json" -Headers @{"x-internal-key" = $InternalKey}
        if ($response.ok) {
            Write-Log "Job approval request sent" "SUCCESS"
            $response | ConvertTo-Json -Depth 3
        } else {
            Write-Log "Job approval request failed" "ERROR"
            $response | ConvertTo-Json -Depth 3
        }
    } catch {
        Write-Log "Job approval request failed: $($_.Exception.Message)" "ERROR"
    }
}

# 테스트 5: 잘못된 내부 키로 요청
function Test-InvalidKey {
    Write-Log "Testing Invalid Internal Key..." "INFO"
    
    $body = @{
        channel = $SlackChannel
        type = "test"
        refId = "test"
        title = "Test"
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionsUrl/slack/internal/approval/notify" -Method POST -Body $body -ContentType "application/json" -Headers @{"x-internal-key" = "invalid-key"}
        Write-Log "Invalid key not properly rejected" "ERROR"
        $response | ConvertTo-Json -Depth 3
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Log "Invalid key properly rejected" "SUCCESS"
        } else {
            Write-Log "Unexpected error: $($_.Exception.Message)" "ERROR"
        }
    }
}

# 테스트 6: 필수 필드 누락
function Test-MissingFields {
    Write-Log "Testing Missing Required Fields..." "INFO"
    
    $body = @{
        channel = $SlackChannel
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionsUrl/slack/internal/approval/notify" -Method POST -Body $body -ContentType "application/json" -Headers @{"x-internal-key" = $InternalKey}
        Write-Log "Missing fields not properly rejected" "ERROR"
        $response | ConvertTo-Json -Depth 3
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Log "Missing fields properly rejected" "SUCCESS"
        } else {
            Write-Log "Unexpected error: $($_.Exception.Message)" "ERROR"
        }
    }
}

# 테스트 7: 슬래시 명령어 (선택사항)
function Test-SlashCommand {
    Write-Log "Testing Slash Command (if configured)..." "INFO"
    Write-Log "Slash command test requires Slack app configuration" "WARNING"
    Write-Log "Use: /preview 테스트 제목 | 테스트 요약 | https://example.com | https://example.com/image.jpg" "WARNING"
}

# 메인 실행 함수
function Start-Tests {
    Write-Host "🚀 Slack 승인→발행 시스템 테스트" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "Functions URL: $FunctionsUrl" -ForegroundColor Yellow
    Write-Host "Slack Channel: $SlackChannel" -ForegroundColor Yellow
    Write-Host ""
    
    # 기본 테스트
    Test-Health
    Write-Host ""
    
    # 승인 요청 테스트
    Test-MarketApproval
    Write-Host ""
    
    Test-MeetupApproval
    Write-Host ""
    
    Test-JobApproval
    Write-Host ""
    
    # 보안 테스트
    Test-InvalidKey
    Write-Host ""
    
    Test-MissingFields
    Write-Host ""
    
    # 슬래시 명령어 테스트
    Test-SlashCommand
    Write-Host ""
    
    Write-Host "🏁 All tests completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Check Slack channel for approval cards" -ForegroundColor White
    Write-Host "2. Click [✅ 승인] or [✋ 반려] buttons" -ForegroundColor White
    Write-Host "3. Verify Firestore updates" -ForegroundColor White
    Write-Host "4. Check n8n webhook calls (if configured)" -ForegroundColor White
}

# 스크립트 실행
Start-Tests
