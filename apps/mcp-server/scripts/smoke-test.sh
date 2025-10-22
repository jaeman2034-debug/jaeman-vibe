#!/bin/bash

# Production Smoke Test Script for MCP Server
set -e

echo "🧪 Running YAGO VIBE MCP Server Smoke Test..."

BASE_URL="http://localhost"
MCP_URL="http://localhost:7331"

# Test 1: Health check
echo "1️⃣ Testing health check..."
if curl -s "$BASE_URL/health" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Test 2: Caddy proxy
echo "2️⃣ Testing Caddy proxy..."
if curl -s "$BASE_URL/tools" > /dev/null; then
    echo "✅ Caddy proxy working"
else
    echo "❌ Caddy proxy failed"
    exit 1
fi

# Test 3: Direct MCP server
echo "3️⃣ Testing direct MCP server..."
if curl -s "$MCP_URL/tools" > /dev/null; then
    echo "✅ Direct MCP server working"
else
    echo "❌ Direct MCP server failed"
    exit 1
fi

# Test 4: Get tools list
echo "4️⃣ Testing tools list..."
TOOLS_RESPONSE=$(curl -s "$BASE_URL/tools")
echo "Available tools: $TOOLS_RESPONSE"

# Test 5: Create meetup
echo "5️⃣ Testing create_meetup..."
MEETUP_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "create_meetup",
    "input": {
      "title": "풋살 번개 (Production Test)",
      "startAt": "2025-09-13T18:00:00+09:00",
      "location": "도봉풋살장",
      "note": "Production 배포 테스트로 생성된 모임"
    }
  }')
echo "Meetup response: $MEETUP_RESPONSE"

# Test 6: Moderate listing
echo "6️⃣ Testing moderate_listing..."
MARKET_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "moderate_listing",
    "input": {
      "id": "m-prod-1",
      "title": "축구화 판매 (Production Test)",
      "price": 9900,
      "category": "sports"
    }
  }')
echo "Market response: $MARKET_RESPONSE"

# Test 7: Send KPI report
echo "7️⃣ Testing send_kpi_report..."
KPI_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "send_kpi_report",
    "input": {
      "date": "2025-09-12"
    }
  }')
echo "KPI response: $KPI_RESPONSE"

# Test 8: CORS headers
echo "8️⃣ Testing CORS headers..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$BASE_URL/call" \
  -H "Origin: https://claude.ai" \
  -H "Access-Control-Request-Method: POST")
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers present"
else
    echo "❌ CORS headers missing"
fi

echo ""
echo "✅ All smoke tests completed successfully!"
echo ""
echo "📊 Next Steps:"
echo "   1. Check n8n Executions tab for webhook execution records"
echo "   2. If Slack/Sheets nodes are connected, check for notifications"
echo "   3. Configure your MCP client with: $BASE_URL"
echo ""
echo "🔗 MCP Client Configuration:"
echo "   Claude Desktop: Add to claude_desktop_config.json"
echo "   Cursor: Configure in MCP settings"
echo "   Base URL: $BASE_URL"
