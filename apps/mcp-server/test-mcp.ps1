# MCP 브릿지 스모크 테스트 스크립트
# PowerShell 기준 - MCP 서버가 실행 중이어야 함

Write-Host "=== MCP Bridge Smoke Test ==="

# 1) 툴 목록 확인
Write-Host "`n--- 1) Tools List ---"
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:7331/tools" -Method GET
    Write-Host "Available tools: $($response.tools | ForEach-Object { $_.name })"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# 2) 모임 생성 테스트
Write-Host "`n--- 2) Create Meetup Test ---"
try {
    $body = @{
        name = "create_meetup"
        input = @{
            title = "풋살 번개"
            startAt = "2025-09-13T18:00:00+09:00"
            location = "도봉풋살장"
            note = "MCP로 생성된 모임입니다"
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-RestMethod -Uri "http://127.0.0.1:7331/call" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Result: $($response | ConvertTo-Json -Compress)"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# 3) 마켓 모더레이션 테스트
Write-Host "`n--- 3) Moderate Listing Test ---"
try {
    $body = @{
        name = "moderate_listing"
        input = @{
            id = "m1"
            title = "축구화 판매"
            price = 9900
            category = "sports"
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-RestMethod -Uri "http://127.0.0.1:7331/call" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Result: $($response | ConvertTo-Json -Compress)"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# 4) KPI 리포트 테스트
Write-Host "`n--- 4) Send KPI Report Test ---"
try {
    $body = @{
        name = "send_kpi_report"
        input = @{
            date = "2025-09-12"
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-RestMethod -Uri "http://127.0.0.1:7331/call" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Result: $($response | ConvertTo-Json -Compress)"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ==="
Write-Host "Check n8n Executions tab for webhook execution records"
Write-Host "If Slack/Sheets nodes are connected, check for notifications"
