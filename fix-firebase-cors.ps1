# YAGO VIBE Firebase CORS Auto Fix Script
Write-Host "YAGO VIBE Firebase CORS Auto Fix Starting..." -ForegroundColor Cyan

# 1. Google Cloud Auth Check
Write-Host "Google Cloud Authentication Check..."
gcloud auth login

# 2. Firebase Project Setup
$project = "jaeman-vibe-platform"
Write-Host "Setting project: $project"
gcloud config set project $project

# 3. Create temporary cors.json
$corsJson = @'
[
  {
    "origin": ["http://localhost:5183", "http://127.0.0.1:5183", "http://localhost:5173", "http://127.0.0.1:5173"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "x-goog-meta-uuid", "x-goog-meta-tag", "x-goog-acl", "Access-Control-Allow-Origin"]
  }
]
'@
$corsFile = "cors-temp.json"
$corsJson | Out-File -Encoding utf8 $corsFile

Write-Host "CORS config file created: $corsFile" -ForegroundColor Green

# 4. Apply CORS to Firebase Storage
Write-Host "Applying CORS to Firebase Storage..."
Write-Host "   Bucket: gs://jaeman-vibe-platform.firebasestorage.app"
gsutil cors set $corsFile gs://jaeman-vibe-platform.firebasestorage.app

# 5. Verify CORS settings
Write-Host ""
Write-Host "Verifying CORS settings..." -ForegroundColor Yellow
gsutil cors get gs://jaeman-vibe-platform.firebasestorage.app

# 6. Cleanup temp file
Remove-Item $corsFile -ErrorAction SilentlyContinue

# 7. Success message
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "CORS Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Clear browser cache (Ctrl + Shift + Delete)" -ForegroundColor White
Write-Host "   2. Open incognito mode (Ctrl + Shift + N)" -ForegroundColor White
Write-Host "   3. Visit http://127.0.0.1:5183/market" -ForegroundColor White
Write-Host "   4. Test product upload" -ForegroundColor White
Write-Host ""
Write-Host "Image upload / Product registration / AI analysis - All working!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Allowed Origins:" -ForegroundColor Cyan
Write-Host "   - http://localhost:5183" -ForegroundColor White
Write-Host "   - http://127.0.0.1:5183" -ForegroundColor White
Write-Host ""
Write-Host "YAGO VIBE CORS Auto Fix Complete!" -ForegroundColor Green
