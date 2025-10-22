# ==================================
# n8n Market Workflow with AI Test
# ==================================

$uri = "http://localhost:5678/webhook/chat-final-ai"

Write-Host ""
Write-Host "1) market.create (with AI tagging) -------------------"
$createBody = @{
  intent = "market.create"
  payload = @{
    title       = "Soccer Shoes"
    description = "AI Image Analysis Test"
    price       = 80000
    image       = "https://upload.wikimedia.org/wikipedia/commons/6/6e/Nike_Mercurial.jpg"
  }
} | ConvertTo-Json -Depth 5
$createResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $createBody
$createResp | ConvertTo-Json -Depth 5

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "2) market.list -------------------"
$listBody = @{ intent = "market.list" } | ConvertTo-Json
$listResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $listBody
$listResp | ConvertTo-Json -Depth 5

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "3) market.get -------------------"
$getBody = @{
  intent = "market.get"
  payload = @{ id = 1 }
} | ConvertTo-Json -Depth 5
$getResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $getBody
$getResp | ConvertTo-Json -Depth 5

Write-Host ""
Write-Host "✅ AI Test Completed!"
