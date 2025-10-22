# N8N 워크플로우 + Meetup 상세 페이지 테스트 스크립트 (PowerShell)

$BASE_URL = "http://127.0.0.1"
Write-Host "🧪 YAGO Stack 테스트 시작..." -ForegroundColor Green

# 1. 예약 생성 테스트
Write-Host "`n📝 1. 예약 생성 테스트" -ForegroundColor Yellow
$reserveBody = @{
    meetupId = "test-meetup-1"
    user = @{
        name = "테스터"
        uid = "test-user-123"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/webhook/reserve" -Method POST -Body $reserveBody -ContentType "application/json"
    Write-Host "응답: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    $reservationId = $response.reservationId
    $qrUrl = $response.qrPngUrl
    $checkinUrl = $response.checkinUrl
    
    if ($reservationId) {
        Write-Host "✅ 예약 생성 성공: $reservationId" -ForegroundColor Green
        Write-Host "🔗 QR URL: $qrUrl" -ForegroundColor Cyan
        Write-Host "🔗 체크인 URL: $checkinUrl" -ForegroundColor Cyan
    } else {
        Write-Host "❌ 예약 생성 실패" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 예약 생성 실패: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. QR 이미지 확인
Write-Host "`n📱 2. QR 이미지 확인" -ForegroundColor Yellow
try {
    $qrResponse = Invoke-WebRequest -Uri $qrUrl -Method GET
    if ($qrResponse.StatusCode -eq 200) {
        Write-Host "✅ QR 이미지 생성 성공" -ForegroundColor Green
        Write-Host "🔗 브라우저에서 열기: $qrUrl" -ForegroundColor Cyan
    } else {
        Write-Host "❌ QR 이미지 생성 실패 (HTTP $($qrResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ QR 이미지 생성 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 체크인 테스트
Write-Host "`n🎫 3. 체크인 테스트" -ForegroundColor Yellow
try {
    $checkinResponse = Invoke-RestMethod -Uri $checkinUrl -Method GET
    Write-Host "체크인 응답: $($checkinResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    if ($checkinResponse.ok -eq $true) {
        Write-Host "✅ 체크인 성공" -ForegroundColor Green
    } else {
        Write-Host "❌ 체크인 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 체크인 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. SNS 포스팅 테스트
Write-Host "`n📢 4. SNS 포스팅 테스트" -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$snsBody = @{
    id = "test-post-$timestamp"
    title = "야고스포츠 테스트 모임"
    summary = "축구 모임 테스트입니다"
    url = "https://example.com/meetup/test"
} | ConvertTo-Json

try {
    $snsResponse = Invoke-RestMethod -Uri "$BASE_URL/webhook/post-published" -Method POST -Body $snsBody -ContentType "application/json"
    Write-Host "SNS 응답: $($snsResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    if ($snsResponse.id) {
        Write-Host "✅ SNS 포스팅 워크플로우 트리거 성공" -ForegroundColor Green
    } else {
        Write-Host "❌ SNS 포스팅 워크플로우 트리거 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ SNS 포스팅 워크플로우 트리거 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 팀 블로그 생성 테스트
Write-Host "`n📝 5. 팀 블로그 생성 테스트" -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$blogBody = @{
    clubId = "test-club-$timestamp"
    clubName = "테스트 FC"
    sport = "soccer"
    region = "서울 강남구"
    description = "테스트용 축구 클럽입니다"
} | ConvertTo-Json

try {
    $blogResponse = Invoke-RestMethod -Uri "$BASE_URL/team-blog-create" -Method POST -Body $blogBody -ContentType "application/json"
    Write-Host "팀 블로그 응답: $($blogResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    if ($blogResponse.ok -eq $true) {
        Write-Host "✅ 팀 블로그 생성 워크플로우 트리거 성공" -ForegroundColor Green
    } else {
        Write-Host "❌ 팀 블로그 생성 워크플로우 트리거 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 팀 블로그 생성 워크플로우 트리거 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 테스트 완료!" -ForegroundColor Green
Write-Host "`n📋 다음 단계:" -ForegroundColor Yellow
Write-Host "1. 브라우저에서 QR 이미지 확인: $qrUrl" -ForegroundColor Cyan
Write-Host "2. 체크인 URL 테스트: $checkinUrl" -ForegroundColor Cyan
Write-Host "3. N8N 워크플로우가 실행되었는지 확인" -ForegroundColor Cyan
Write-Host "4. Notion 데이터베이스에 페이지가 생성되었는지 확인" -ForegroundColor Cyan
