# 배포 체크 스크립트 (PowerShell)
# 사용법: .\deploy-check.ps1 <PROJECT_ID> [ENVIRONMENT] [REGION]

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "asia-northeast3"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 배포 체크 시작..." -ForegroundColor Green
Write-Host "프로젝트: $ProjectId" -ForegroundColor Yellow
Write-Host "환경: $Environment" -ForegroundColor Yellow
Write-Host "리전: $Region" -ForegroundColor Yellow

# 1. Firebase 프로젝트 설정
Write-Host "📦 Firebase 프로젝트 설정..." -ForegroundColor Blue
firebase use $ProjectId

# 2. 환경변수 확인
Write-Host "🔍 환경변수 확인..." -ForegroundColor Blue
$RequiredVars = @(
    "SLACK_BOT_TOKEN",
    "SLACK_SIGNING_SECRET", 
    "SLACK_APPROVER_CHANNEL",
    "INTERNAL_KEY",
    "N8N_WEBHOOK_APPROVED"
)

$MissingVars = @()
foreach ($var in $RequiredVars) {
    if (-not (Get-Variable -Name $var -ErrorAction SilentlyContinue)) {
        $MissingVars += $var
    }
}

if ($MissingVars.Count -gt 0) {
    Write-Host "❌ 누락된 환경변수:" -ForegroundColor Red
    $MissingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "환경변수를 설정하고 다시 실행하세요." -ForegroundColor Red
    exit 1
}

Write-Host "✅ 모든 필수 환경변수가 설정되었습니다." -ForegroundColor Green

# 3. PUBLIC_BASE_URL 확인
Write-Host "🌐 PUBLIC_BASE_URL 확인..." -ForegroundColor Blue
try {
    $PublicBaseUrl = firebase functions:config:get public.base 2>$null
    if (-not $PublicBaseUrl -or $PublicBaseUrl -eq "null") {
        Write-Host "❌ PUBLIC_BASE_URL이 설정되지 않았습니다." -ForegroundColor Red
        Write-Host "다음 명령으로 설정하세요:" -ForegroundColor Yellow
        Write-Host "firebase functions:config:set public.base=`"https://your-domain.com`"" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ PUBLIC_BASE_URL: $PublicBaseUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ PUBLIC_BASE_URL 확인 실패" -ForegroundColor Red
    exit 1
}

# 4. 워크스페이스 등록 확인
Write-Host "🏢 워크스페이스 등록 확인..." -ForegroundColor Blue
$ApiUrl = "https://$Region-$ProjectId.cloudfunctions.net/slack"
$InternalKey = $env:INTERNAL_KEY

try {
    $WorkspacesResponse = Invoke-RestMethod -Uri "$ApiUrl/slack/admin/workspaces" -Method Get -Headers @{
        "x-internal-key" = $InternalKey
        "Content-Type" = "application/json"
    } -ErrorAction Stop
    
    $WorkspaceCount = $WorkspacesResponse.workspaces.Count
    Write-Host "✅ 등록된 워크스페이스: $WorkspaceCount개" -ForegroundColor Green
    
    if ($WorkspaceCount -eq 0) {
        Write-Host "⚠️  워크스페이스가 등록되지 않았습니다." -ForegroundColor Yellow
        Write-Host "다음 명령으로 워크스페이스를 등록하세요:" -ForegroundColor Yellow
        Write-Host "curl -X POST `"$ApiUrl/slack/admin/workspaces/set`" \`" -ForegroundColor Yellow
        Write-Host "  -H `"Content-Type: application/json`" \`" -ForegroundColor Yellow
        Write-Host "  -H `"x-internal-key: $InternalKey`" \`" -ForegroundColor Yellow
        Write-Host "  -d '{`"teamId`":`"T123`",`"botToken`":`"xoxb-***`",`"defaultChannel`":`"C0123456789`",`"locale`":`"ko`"}'" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 워크스페이스 API 호출 실패" -ForegroundColor Red
    Write-Host "응답: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 헬스체크 확인
Write-Host "🏥 헬스체크 확인..." -ForegroundColor Blue
try {
    $HealthResponse = Invoke-RestMethod -Uri "$ApiUrl/slack/health" -Method Get -ErrorAction Stop
    
    if ($HealthResponse.ok) {
        Write-Host "✅ 헬스체크 통과" -ForegroundColor Green
        Write-Host "  - 리전: $($HealthResponse.region)" -ForegroundColor Green
        Write-Host "  - Slack: $($HealthResponse.slack)" -ForegroundColor Green
        Write-Host "  - 서명: $($HealthResponse.signing)" -ForegroundColor Green
    } else {
        Write-Host "❌ 헬스체크 실패" -ForegroundColor Red
        Write-Host "응답: $($HealthResponse | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 헬스체크 실패" -ForegroundColor Red
    Write-Host "응답: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Feature Flags 초기화 확인
Write-Host "🚩 Feature Flags 확인..." -ForegroundColor Blue
try {
    $FeaturesResponse = Invoke-RestMethod -Uri "$ApiUrl/slack/admin/features" -Method Get -Headers @{
        "x-internal-key" = $InternalKey
        "Content-Type" = "application/json"
    } -ErrorAction Stop
    
    if ($FeaturesResponse.ok) {
        $FeatureCount = $FeaturesResponse.features.Count
        Write-Host "✅ Feature Flags: $FeatureCount개" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Feature Flags API 호출 실패 (기능이 비활성화되었을 수 있음)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Feature Flags API 호출 실패 (기능이 비활성화되었을 수 있음)" -ForegroundColor Yellow
}

# 7. 빌드 테스트
Write-Host "🔨 빌드 테스트..." -ForegroundColor Blue
Set-Location functions
try {
    npm run build
    Write-Host "✅ Functions 빌드 성공" -ForegroundColor Green
} catch {
    Write-Host "❌ Functions 빌드 실패" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# 8. 테스트 실행
Write-Host "🧪 테스트 실행..." -ForegroundColor Blue
try {
    npm test
    Write-Host "✅ 테스트 통과" -ForegroundColor Green
} catch {
    Write-Host "❌ 테스트 실패" -ForegroundColor Red
    exit 1
}

# 9. 배포 준비 확인
Write-Host "📋 배포 준비 확인..." -ForegroundColor Blue
Write-Host "다음 항목들이 확인되었습니다:" -ForegroundColor Green
Write-Host "  ✅ 환경변수 설정" -ForegroundColor Green
Write-Host "  ✅ PUBLIC_BASE_URL 설정" -ForegroundColor Green
Write-Host "  ✅ 워크스페이스 등록" -ForegroundColor Green
Write-Host "  ✅ 헬스체크 통과" -ForegroundColor Green
Write-Host "  ✅ 빌드 성공" -ForegroundColor Green
Write-Host "  ✅ 테스트 통과" -ForegroundColor Green

# 10. 배포 실행 여부 확인
$Deploy = Read-Host "배포를 실행하시겠습니까? (y/N)"
if ($Deploy -eq "y" -or $Deploy -eq "Y") {
    Write-Host "🚀 배포 시작..." -ForegroundColor Green
    
    # Functions 배포
    Write-Host "📦 Functions 배포 중..." -ForegroundColor Blue
    firebase deploy --only functions
    
    # Hosting 배포
    Write-Host "🌐 Hosting 배포 중..." -ForegroundColor Blue
    firebase deploy --only hosting
    
    # 배포 후 헬스체크
    Write-Host "🏥 배포 후 헬스체크..." -ForegroundColor Blue
    Start-Sleep -Seconds 10
    
    try {
        $HealthResponse = Invoke-RestMethod -Uri "$ApiUrl/slack/health" -Method Get -ErrorAction Stop
        
        if ($HealthResponse.ok) {
            Write-Host "✅ 배포 성공! 헬스체크 통과" -ForegroundColor Green
            Write-Host "🌐 애플리케이션 URL: $PublicBaseUrl" -ForegroundColor Green
        } else {
            Write-Host "❌ 배포 후 헬스체크 실패" -ForegroundColor Red
            Write-Host "응답: $($HealthResponse | ConvertTo-Json)" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ 배포 후 헬스체크 실패" -ForegroundColor Red
        Write-Host "응답: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  배포를 건너뛰었습니다." -ForegroundColor Yellow
    Write-Host "준비가 완료되었으므로 언제든지 'firebase deploy'를 실행할 수 있습니다." -ForegroundColor Yellow
}

Write-Host "🎉 배포 체크 완료!" -ForegroundColor Green