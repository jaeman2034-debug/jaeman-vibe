#!/bin/bash

# MCP Server Test Script
set -e

echo "🧪 Testing YAGO VIBE MCP Server..."

BASE_URL="http://localhost:7331"

# Test 1: Health check
echo "1️⃣ Testing health check..."
if curl -s "$BASE_URL/tools" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Test 2: Get tools list
echo "2️⃣ Testing tools list..."
TOOLS_RESPONSE=$(curl -s "$BASE_URL/tools")
echo "Available tools: $TOOLS_RESPONSE"

# Test 3: Create meetup
echo "3️⃣ Testing create_meetup..."
MEETUP_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "create_meetup",
    "input": {
      "title": "풋살 번개",
      "startAt": "2025-09-13T18:00:00+09:00",
      "location": "도봉풋살장",
      "note": "MCP 테스트로 생성된 모임"
    }
  }')
echo "Meetup response: $MEETUP_RESPONSE"

# Test 4: Moderate listing
echo "4️⃣ Testing moderate_listing..."
MARKET_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "moderate_listing",
    "input": {
      "id": "m1",
      "title": "축구화 판매",
      "price": 9900,
      "category": "sports"
    }
  }')
echo "Market response: $MARKET_RESPONSE"

# Test 5: Send KPI report
echo "5️⃣ Testing send_kpi_report..."
KPI_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "send_kpi_report",
    "input": {
      "date": "2025-09-12"
    }
  }')
echo "KPI response: $KPI_RESPONSE"

echo "✅ All tests completed successfully!"
echo "📊 Check n8n Executions tab for webhook execution records"
echo "📱 If Slack/Sheets nodes are connected, check for notifications"
