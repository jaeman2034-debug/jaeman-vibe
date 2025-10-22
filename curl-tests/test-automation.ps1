# YAGO Sports Automation Playbooks - PowerShell Tests
# Patchset V21: n8n Workflows + Notion Schemas + cURL Tests

param(
    [string]$N8N_URL = "https://your-n8n-instance.com",
    [string]$SITE_BASE = "https://yago.sports",
    [string]$MEETUP_ID = "m_$(Get-Date -Format 'yyyyMMddHHmmss')",
    [string]$TEAM_ID = "t_roma_$(Get-Date -Format 'yyyyMMddHHmmss')"
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

# 테스트 1: 소셜 미디어 퍼블리시
function Test-SocialPublish {
    Write-Log "Testing Social Media Publish..." "INFO"
    
    $body = @{
        meetupId = $MEETUP_ID
        caption = "【테스트 밋업】 $(Get-Date -Format 'MM/dd(ddd) HH:mm') · 잠실보조`nhttps://yago.sports/r/m/$MEETUP_ID?s=x&m=social&c=og`n#YAGO #Meetup #Test"
        images = @(@{ publicUrl = "https://yago.sports/og/meetups/$MEETUP_ID/main.png" })
        channels = @("x", "instagram", "naverblog")
        when = "now"
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$N8N_URL/webhook/social-publish" -Method POST -Body $body -ContentType "application/json"
        if ($response.success) {
            Write-Log "Social publish test passed" "SUCCESS"
            $response | ConvertTo-Json -Depth 3
        } else {
            Write-Log "Social publish test failed" "ERROR"
            $response | ConvertTo-Json -Depth 3
        }
    } catch {
        Write-Log "Social publish test failed: $($_.Exception.Message)" "ERROR"
    }
}

# 테스트 2: Google Sites 퍼블리시
function Test-GoogleSitesPublish {
    Write-Log "Testing Google Sites Publish..." "INFO"
    
    $body = @{
        meetupId = $MEETUP_ID
        title = "YAGO Meetup 테스트 - $(Get-Date -Format 'yyyy-MM-dd')"
        siteId = "REPLACE_SITE_ID"
        blocks = @(
            @{ type = "h1"; text = "YAGO 테스트 밋업" }
            @{ type = "p"; text = "$(Get-Date -Format 'MM/dd(ddd) HH:mm') · 잠실보조" }
            @{ type = "img"; src = "https://yago.sports/og/meetups/$MEETUP_ID/main.png"; alt = "Meetup OG Image" }
            @{ type = "p"; text = "테스트를 위한 자동 생성된 포스트입니다." }
            @{ type = "ul"; items = @("자동화 테스트", "n8n 워크플로", "YAGO Sports") }
            @{ type = "a"; href = "https://yago.sports/r/m/$MEETUP_ID"; text = "밋업 상세보기" }
        )
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$N8N_URL/webhook/google-sites-publish" -Method POST -Body $body -ContentType "application/json"
        if ($response.success) {
            Write-Log "Google Sites publish test passed" "SUCCESS"
            $response | ConvertTo-Json -Depth 3
        } else {
            Write-Log "Google Sites publish test failed" "ERROR"
            $response | ConvertTo-Json -Depth 3
        }
    } catch {
        Write-Log "Google Sites publish test failed: $($_.Exception.Message)" "ERROR"
    }
}

# 테스트 3: 팀 블로그 생성
function Test-TeamBlogCreate {
    Write-Log "Testing Team Blog Create..." "INFO"
    
    $body = @{
        team = @{
            id = $TEAM_ID
            name = "AS Roma Seoul Test"
            sport = "soccer"
            region = "Seoul"
            logoUrl = "https://yago.sports/og/teams/$TEAM_ID/main.png"
            bio = "서울의 AS 로마 팬클럽입니다. 매주 토요일 잠실에서 경기를 합니다."
            hashtags = @("#YAGO", "#Roma", "#Soccer", "#Seoul")
            notionTeamsDb = "REPLACE_TEAMS_DB"
            notionPostsDb = "REPLACE_POSTS_DB"
            wordpressEndpoint = "https://example.com/wp-json/wp/v2/posts"
        }
        posts = @(
            @{
                title = "개막전 리뷰 - $(Get-Date -Format 'yyyy-MM-dd')"
                summary = "3-1 승리로 시즌을 시작했습니다. 골든타임에 2골을 넣으며 완벽한 경기를 펼쳤습니다."
                url = "https://yago.sports/clubs/c1/teams/$TEAM_ID"
                og = "https://yago.sports/og/teams/$TEAM_ID/main.png"
                content = "<h2>경기 요약</h2><p>3-1 승리로 시즌을 시작했습니다.</p><h2>주요 순간</h2><ul><li>전반 15분: 첫 골</li><li>후반 30분: 골든타임 2골</li></ul>"
                publishedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.000Z")
                category = "match-report"
                tags = @("#승리", "#골든타임", "#경기리뷰")
            }
            @{
                title = "팀 소개 - $(Get-Date -Format 'yyyy-MM-dd')"
                summary = "AS Roma Seoul 팬클럽을 소개합니다."
                url = "https://yago.sports/clubs/c1/teams/$TEAM_ID"
                og = "https://yago.sports/og/teams/$TEAM_ID/main.png"
                content = "<h2>팀 소개</h2><p>서울의 AS 로마 팬클럽입니다.</p>"
                publishedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.000Z")
                category = "team-news"
                tags = @("#팀소식", "#소개")
            }
        )
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$SITE_BASE/team-blog-create" -Method POST -Body $body -ContentType "application/json"
        if ($response.success) {
            Write-Log "Team blog create test passed" "SUCCESS"
            $response | ConvertTo-Json -Depth 3
        } else {
            Write-Log "Team blog create test failed" "ERROR"
            $response | ConvertTo-Json -Depth 3
        }
    } catch {
        Write-Log "Team blog create test failed: $($_.Exception.Message)" "ERROR"
    }
}

# 테스트 4: 서버 상태 확인
function Test-ServerHealth {
    Write-Log "Testing Server Health..." "INFO"
    
    try {
        $response = Invoke-WebRequest -Uri "$SITE_BASE/health" -Method GET -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Log "Server health check passed" "SUCCESS"
        } else {
            Write-Log "Server health check returned: $($response.StatusCode)" "WARNING"
        }
    } catch {
        Write-Log "Server health check failed: $($_.Exception.Message)" "WARNING"
    }
}

# 테스트 5: n8n 워크플로 상태 확인
function Test-N8NHealth {
    Write-Log "Testing n8n Health..." "INFO"
    
    try {
        $response = Invoke-WebRequest -Uri "$N8N_URL/healthz" -Method GET -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Log "n8n health check passed" "SUCCESS"
        } else {
            Write-Log "n8n health check returned: $($response.StatusCode)" "WARNING"
        }
    } catch {
        Write-Log "n8n health check failed: $($_.Exception.Message)" "WARNING"
    }
}

# 테스트 6: 예약 발행 테스트
function Test-ScheduledPublish {
    Write-Log "Testing Scheduled Publish..." "INFO"
    
    $futureTime = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss.000Z")
    
    $body = @{
        meetupId = $MEETUP_ID
        caption = "【예약 발행 테스트】 $(Get-Date -Format 'MM/dd(ddd) HH:mm') · 잠실보조`nhttps://yago.sports/r/m/$MEETUP_ID?s=x&m=social&c=og`n#YAGO #Meetup #Scheduled"
        images = @(@{ publicUrl = "https://yago.sports/og/meetups/$MEETUP_ID/main.png" })
        channels = @("x")
        when = $futureTime
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$N8N_URL/webhook/social-publish" -Method POST -Body $body -ContentType "application/json"
        if ($response.success) {
            Write-Log "Scheduled publish test passed" "SUCCESS"
            $response | ConvertTo-Json -Depth 3
        } else {
            Write-Log "Scheduled publish test failed" "ERROR"
            $response | ConvertTo-Json -Depth 3
        }
    } catch {
        Write-Log "Scheduled publish test failed: $($_.Exception.Message)" "ERROR"
    }
}

# 메인 실행 함수
function Start-Tests {
    Write-Host "🚀 YAGO Sports Automation Playbooks - PowerShell Tests" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host "N8N URL: $N8N_URL" -ForegroundColor Yellow
    Write-Host "SITE BASE: $SITE_BASE" -ForegroundColor Yellow
    Write-Host "MEETUP ID: $MEETUP_ID" -ForegroundColor Yellow
    Write-Host "TEAM ID: $TEAM_ID" -ForegroundColor Yellow
    Write-Host ""
    
    # 기본 상태 확인
    Test-ServerHealth
    Test-N8NHealth
    Write-Host ""
    
    # 자동화 테스트
    Test-SocialPublish
    Write-Host ""
    
    Test-GoogleSitesPublish
    Write-Host ""
    
    Test-TeamBlogCreate
    Write-Host ""
    
    Test-ScheduledPublish
    Write-Host ""
    
    Write-Host "🏁 All tests completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Check n8n workflows are activated" -ForegroundColor White
    Write-Host "2. Verify credentials are configured" -ForegroundColor White
    Write-Host "3. Check Notion databases are created" -ForegroundColor White
    Write-Host "4. Monitor logs for any errors" -ForegroundColor White
}

# 스크립트 실행
Start-Tests
