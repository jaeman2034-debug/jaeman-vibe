# 🔐 최소 권한 IAM 바인딩 스크립트 (PowerShell)

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId
)

$SaFun = "fn-deployer@${ProjectId}.iam.gserviceaccount.com"
$SaTf = "tf-deployer@${ProjectId}.iam.gserviceaccount.com"

Write-Host "🔐 최소 권한 IAM 바인딩 시작..." -ForegroundColor Green
Write-Host "📋 프로젝트: $ProjectId" -ForegroundColor Cyan
Write-Host ""

# Functions CI 배포용 SA 권한
Write-Host "🔧 Functions CI 배포용 SA 권한 설정..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$SaFun" `
  --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$SaFun" `
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$SaFun" `
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$SaFun" `
  --role="roles/iam.serviceAccountUser"

Write-Host "✅ Functions CI 권한 설정 완료" -ForegroundColor Green
Write-Host ""

# Terraform용 SA 권한 (모니터링만)
Write-Host "🏗️ Terraform용 SA 권한 설정..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$SaTf" `
  --role="roles/monitoring.alertPolicyEditor"

gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$SaTf" `
  --role="roles/monitoring.notificationChannelEditor"

Write-Host "✅ Terraform 권한 설정 완료" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 설정된 권한:" -ForegroundColor Cyan
Write-Host "   Functions CI: Cloud Functions, Cloud Run, Artifact Registry, Service Account User" -ForegroundColor White
Write-Host "   Terraform: Monitoring Alert Policy, Notification Channel" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  주의: Owner/Editor 권한은 부여하지 않았습니다." -ForegroundColor Yellow
Write-Host "   필요시 개별 역할을 추가로 부여하세요." -ForegroundColor Yellow
