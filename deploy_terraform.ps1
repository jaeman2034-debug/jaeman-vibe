# 🚀 Terraform IaC 배포 스크립트 (PowerShell)

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$EmailAddress = ""
)

Write-Host "🏗️ Terraform IaC 배포 시작..." -ForegroundColor Green

$Region = "asia-northeast3"
$MonitoringRelayUrl = "https://${Region}-${ProjectId}.cloudfunctions.net/monitoringToSlack"

Write-Host "📋 배포 정보:" -ForegroundColor Cyan
Write-Host "   프로젝트: $ProjectId" -ForegroundColor White
Write-Host "   리전: $Region" -ForegroundColor White
Write-Host "   모니터링 릴레이 URL: $MonitoringRelayUrl" -ForegroundColor White
Write-Host "   이메일: $(if ($EmailAddress) { $EmailAddress } else { '설정 안함' })" -ForegroundColor White
Write-Host ""

# Terraform 초기화
Write-Host "🔧 Terraform 초기화 중..." -ForegroundColor Yellow
Set-Location infra
terraform init

# Terraform 계획
Write-Host "📋 Terraform 계획 생성 중..." -ForegroundColor Yellow
terraform plan `
  -var "project_id=$ProjectId" `
  -var "region=$Region" `
  -var "monitoring_relay_url=$MonitoringRelayUrl" `
  -var "email_address=$EmailAddress"

# 사용자 확인
Write-Host ""
$confirm = Read-Host "위 계획을 적용하시겠습니까? (y/N)"
if ($confirm -notmatch "^[Yy]$") {
    Write-Host "❌ 배포가 취소되었습니다." -ForegroundColor Red
    exit 1
}

# Terraform 적용
Write-Host "🚀 Terraform 적용 중..." -ForegroundColor Yellow
terraform apply `
  -var "project_id=$ProjectId" `
  -var "region=$Region" `
  -var "monitoring_relay_url=$MonitoringRelayUrl" `
  -var "email_address=$EmailAddress" `
  -auto-approve

Write-Host ""
Write-Host "✅ Terraform IaC 배포 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 생성된 리소스:" -ForegroundColor Cyan
terraform output

Set-Location ..
Write-Host ""
Write-Host "🎯 다음 단계:" -ForegroundColor Cyan
Write-Host "1. Firebase Functions 배포 확인" -ForegroundColor White
Write-Host "2. Slack 웹훅 URL 설정 확인" -ForegroundColor White
Write-Host "3. 모니터링 대시보드 확인" -ForegroundColor White
