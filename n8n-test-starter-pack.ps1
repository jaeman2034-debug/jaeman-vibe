# Starter 5-Pack n8n 워크플로우 테스트 스크립트
# PowerShell 기준 - 아래 값만 채우고 실행하세요

# 0) 자리값 채우기
$env:N8N_BASE = "https://<your-n8n-host>"       # 예: https://n8n.yagovibe.com

Write-Host "환경변수 설정 완료:"
Write-Host "N8N_BASE: $($env:N8N_BASE)"

Write-Host "`n=== Starter 5-Pack n8n 워크플로우 테스트 ==="

# 1) 회원가입 알림 테스트
Write-Host "`n--- 1) User Created (회원가입 알림) ---"
curl -Method POST "$env:N8N_BASE/webhook/user-created" `
  -Headers @{ 'Content-Type'='application/json' } `
  -Body '{"displayName":"홍길동","email":"u1@example.com","uid":"u1","createdAt":1690000000000}'

# 2) 마켓 모더레이션 테스트 (금지어)
Write-Host "`n--- 2) Market Moderation (금지어 체크) ---"
curl -Method POST "$env:N8N_BASE/webhook/market-created" `
  -Headers @{ 'Content-Type'='application/json' } `
  -Body '{"id":"m1","title":"도박 가방 판매합니다","price":0,"description":"도박 관련 상품"}'

# 3) 마켓 모더레이션 테스트 (가격 체크)
Write-Host "`n--- 3) Market Moderation (가격 체크) ---"
curl -Method POST "$env:N8N_BASE/webhook/market-created" `
  -Headers @{ 'Content-Type'='application/json' } `
  -Body '{"id":"m2","title":"정상 상품","price":0,"description":"무료 나눔"}'

# 4) 모임 리마인더 테스트
Write-Host "`n--- 4) Meetup Reminder (T-24h/T-2h) ---"
$futureTime = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss+09:00")
curl -Method POST "$env:N8N_BASE/webhook/meetup-created" `
  -Headers @{ 'Content-Type'='application/json' } `
  -Body "{`"id`":`"meetup1`",`"title`":`"풋살모임`",`"startAt`":`"$futureTime`",`"location`":`"강남구 체육관`"}"

# 5) 결제 완료 알림 테스트
Write-Host "`n--- 5) Payment Completed (결제 완료) ---"
curl -Method POST "$env:N8N_BASE/webhook/payment-completed" `
  -Headers @{ 'Content-Type'='application/json' } `
  -Body '{"orderId":"o-123","amount":9900,"userId":"u1","itemId":"m1"}'

# 6) Daily KPI 테스트 (수동 실행)
Write-Host "`n--- 6) Daily KPI (수동 실행) ---"
Write-Host "Daily KPI는 Cron 트리거(08:30)이므로 n8n UI에서 'Run Once' 버튼으로 수동 실행하세요."

Write-Host "`n=== 테스트 완료 ==="
Write-Host "n8n Executions 탭에서 다음을 확인하세요:"
Write-Host "- 5개 워크플로우 모두 Success (200 응답)"
Write-Host "- Slack 채널에 각각 알림 메시지 수신"
Write-Host "- Meetup Reminder는 Wait 노드로 예약 생성됨"
Write-Host "- Daily KPI는 수동 실행 또는 08:30까지 대기"
