# scripts/setup-storage-cors.ps1
# Cloud Storage CORS 설정 스크립트

# 사용법: .\scripts\setup-storage-cors.ps1 -BucketName "your-bucket-name"

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName
)

Write-Host "🔧 Cloud Storage CORS 설정을 시작합니다..." -ForegroundColor Green
Write-Host "📦 버킷: gs://$BucketName" -ForegroundColor Yellow

# CORS 설정 JSON 생성
$corsConfig = @"
[
  {
    "origin": ["http://localhost:5183","http://127.0.0.1:5183","https://localhost:5183"],
    "method": ["GET","POST","PUT","HEAD","DELETE","OPTIONS"],
    "responseHeader": ["Content-Type","Authorization","x-goog-meta-*","x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
"@

# CORS 설정 파일 저장
$corsConfig | Out-File -FilePath "cors.json" -Encoding utf8
Write-Host "✅ CORS 설정 파일 생성: cors.json" -ForegroundColor Green

# CORS 설정 적용
Write-Host "🚀 CORS 설정을 적용합니다..." -ForegroundColor Yellow
try {
    gsutil cors set cors.json "gs://$BucketName"
    Write-Host "✅ CORS 설정이 성공적으로 적용되었습니다!" -ForegroundColor Green
    
    # 현재 CORS 설정 확인
    Write-Host "📋 현재 CORS 설정:" -ForegroundColor Cyan
    gsutil cors get "gs://$BucketName"
    
} catch {
    Write-Host "❌ CORS 설정 실패: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Google Cloud SDK가 설치되어 있고, gsutil이 PATH에 있는지 확인하세요." -ForegroundColor Yellow
    Write-Host "💡 그리고 버킷 이름이 올바른지 확인하세요." -ForegroundColor Yellow
}

# 임시 파일 정리
if (Test-Path "cors.json") {
    Remove-Item "cors.json"
    Write-Host "🧹 임시 파일 정리 완료" -ForegroundColor Gray
}

Write-Host "🎉 CORS 설정 완료!" -ForegroundColor Green
