# ==============================
# n8n Market Workflow CRUD Test
# ==============================

$uri = "http://localhost:5678/webhook/chat-final"

Write-Host ""
Write-Host "1) market.create -------------------"
$createBody = @{
  intent = "market.create"
  payload = @{
    title       = "축구공"
    description = "나이키 정품"
    price       = 30000
  }
} | ConvertTo-Json -Depth 5
$createResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $createBody
$createResp | ConvertTo-Json -Depth 5
$id = $createResp.data.id
if (-not $id) { $id = 1 } # fallback

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
  payload = @{ id = $id }
} | ConvertTo-Json -Depth 5
$getResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $getBody
$getResp | ConvertTo-Json -Depth 5

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "4) market.updateStatus -----------"
$updateBody = @{
  intent = "market.updateStatus"
  payload = @{
    id     = $id
    status = "sold"
  }
} | ConvertTo-Json -Depth 5
$updateResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $updateBody
$updateResp | ConvertTo-Json -Depth 5

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "5) market.delete -----------------"
$deleteBody = @{
  intent = "market.delete"
  payload = @{ id = $id }
} | ConvertTo-Json -Depth 5
$deleteResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $deleteBody
$deleteResp | ConvertTo-Json -Depth 5

Write-Host ""
Write-Host "✅ Test Completed!"