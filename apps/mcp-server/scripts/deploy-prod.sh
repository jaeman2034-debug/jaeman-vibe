#!/bin/bash

# Production Deployment Script for MCP Server
set -e

echo "🚀 Deploying YAGO VIBE MCP Server to Production..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    
    # Generate random token
    TOKEN=$(openssl rand -hex 16)
    sed -i "s/replace-with-random-token/$TOKEN/" .env
    
    echo "📝 Please edit .env file with your n8n configuration:"
    echo "   - N8N_WEBHOOK_MEETUP_CREATED"
    echo "   - N8N_WEBHOOK_MARKET_CREATED" 
    echo "   - N8N_WEBHOOK_SESSION_EVENT"
    echo "   - N8N_HOST (for local n8n)"
    echo "   - N8N_BASIC_AUTH_PASSWORD (for local n8n)"
    echo ""
    echo "Press Enter when ready to continue..."
    read
fi

# Create logs directory
mkdir -p logs

# Build and start production stack
echo "🔨 Building production images..."
docker-compose -f docker-compose.prod.yml build --pull

echo "▶️  Starting production stack..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Health checks
echo "🧪 Running health checks..."

# Check MCP server
if curl -s http://localhost:7331/tools > /dev/null; then
    echo "✅ MCP Server is healthy"
else
    echo "❌ MCP Server health check failed"
    docker-compose -f docker-compose.prod.yml logs mcp-server
    exit 1
fi

# Check Caddy proxy
if curl -s http://localhost/health > /dev/null; then
    echo "✅ Caddy proxy is healthy"
else
    echo "❌ Caddy proxy health check failed"
    docker-compose -f docker-compose.prod.yml logs caddy
    exit 1
fi

echo "✅ Production deployment completed successfully!"
echo ""
echo "📊 Service URLs:"
echo "   MCP Server: http://localhost:7331"
echo "   Caddy Proxy: http://localhost"
echo "   Health Check: http://localhost/health"
echo ""
echo "📋 Management Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop: docker-compose -f docker-compose.prod.yml down"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🧪 Run smoke test: bash scripts/smoke-test.sh"
