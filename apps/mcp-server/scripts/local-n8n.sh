#!/bin/bash

# Local n8n Setup Script for MCP Server Testing
set -e

echo "🔧 Setting up local n8n for MCP Server testing..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
fi

# Update .env with local n8n URLs
echo "📝 Updating .env with local n8n URLs..."
sed -i "s|N8N_WEBHOOK_MEETUP_CREATED=.*|N8N_WEBHOOK_MEETUP_CREATED=http://localhost:5678/webhook/meetup-created|" .env
sed -i "s|N8N_WEBHOOK_MARKET_CREATED=.*|N8N_WEBHOOK_MARKET_CREATED=http://localhost:5678/webhook/market-created|" .env
sed -i "s|N8N_WEBHOOK_SESSION_EVENT=.*|N8N_WEBHOOK_SESSION_EVENT=http://localhost:5678/webhook/session-event|" .env

# Set local n8n configuration
if ! grep -q "N8N_HOST" .env; then
    echo "N8N_HOST=localhost" >> .env
fi
if ! grep -q "N8N_BASIC_AUTH_PASSWORD" .env; then
    echo "N8N_BASIC_AUTH_PASSWORD=admin123" >> .env
fi

echo "✅ .env updated with local n8n configuration"

# Start local n8n
echo "🚀 Starting local n8n..."
docker-compose -f docker-compose.prod.yml --profile local up -d n8n

# Wait for n8n to be ready
echo "⏳ Waiting for n8n to be ready..."
sleep 10

# Check if n8n is running
if curl -s http://localhost:5678 > /dev/null; then
    echo "✅ Local n8n is running at http://localhost:5678"
    echo "   Username: admin"
    echo "   Password: admin123"
else
    echo "❌ Local n8n failed to start"
    docker-compose -f docker-compose.prod.yml logs n8n
    exit 1
fi

echo ""
echo "📋 Next Steps:"
echo "   1. Open http://localhost:5678 in your browser"
echo "   2. Login with admin/admin123"
echo "   3. Import the Starter 5-Pack workflows from n8n-workflows/"
echo "   4. Activate the workflows"
echo "   5. Run: bash scripts/smoke-test.sh"
echo ""
echo "🔗 Workflow Import Files:"
echo "   - n8n-workflows/user_created_slack.json"
echo "   - n8n-workflows/market_moderation_basic.json"
echo "   - n8n-workflows/meetup_reminder_wait.json"
echo "   - n8n-workflows/payment_completed_slack.json"
echo "   - n8n-workflows/daily_kpi_stub.json"
