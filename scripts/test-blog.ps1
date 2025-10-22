# ==================================
# n8n Blog Workflow Automation Test
# ==================================

$uri = "http://localhost:5678/webhook/chat-blog"


Write-Host ""
Write-Host "1) blog.create -------------------"
$createBody = @{
  intent = "blog.create"
  payload = @{
    title   = "First Blog Post"
    content = "Blog automation feature successfully integrated!"
    author  = "Admin"
  }
} | ConvertTo-Json -Depth 5
$createResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $createBody
$createResp | ConvertTo-Json -Depth 5

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "2) blog.list -------------------"
$listBody = @{ intent = "blog.list" } | ConvertTo-Json
$listResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $listBody
$listResp | ConvertTo-Json -Depth 5

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "3) blog.get -------------------"
$getBody = @{
  intent = "blog.get"
  payload = @{ id = 1 }
} | ConvertTo-Json -Depth 5
$getResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $getBody
$getResp | ConvertTo-Json -Depth 5

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "4) blog.update -------------------"
$updateBody = @{
  intent = "blog.update"
  payload = @{
    id      = 1
    title   = "First Post - Updated"
    content = "Updated content test"
  }
} | ConvertTo-Json -Depth 5
$updateResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $updateBody
$updateResp | ConvertTo-Json -Depth 5

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "5) blog.delete -------------------"
$deleteBody = @{
  intent = "blog.delete"
  payload = @{ id = 1 }
} | ConvertTo-Json -Depth 5
$deleteResp = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" -Body $deleteBody
$deleteResp | ConvertTo-Json -Depth 5

Write-Host ""
Write-Host "✅ Blog Test Completed!"
