#!/bin/bash

# PM2 Start Script for MCP Server
set -e

echo "🚀 Starting YAGO VIBE MCP Server with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from env.example..."
    cp env.example .env
    echo "📝 Please edit .env file with your n8n configuration before continuing."
    echo "   Required: N8N_TOKEN, N8N_WEBHOOK_* URLs"
    exit 1
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

# Stop existing PM2 process if running
echo "🛑 Stopping existing MCP server..."
pm2 stop yagovibe-mcp-server 2>/dev/null || true
pm2 delete yagovibe-mcp-server 2>/dev/null || true

# Start with PM2
echo "▶️  Starting MCP server with PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

echo "✅ MCP Server started successfully!"
echo "📊 Monitor with: pm2 monit"
echo "📋 Logs: pm2 logs yagovibe-mcp-server"
echo "🛑 Stop: pm2 stop yagovibe-mcp-server"
echo "🔄 Restart: pm2 restart yagovibe-mcp-server"

# Test the server
echo "🧪 Testing server health..."
sleep 3
if curl -s http://localhost:7331/tools > /dev/null; then
    echo "✅ Server is healthy and responding!"
else
    echo "❌ Server health check failed. Check logs: pm2 logs yagovibe-mcp-server"
    exit 1
fi
