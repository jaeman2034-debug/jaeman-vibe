#!/bin/bash

# Docker Start Script for MCP Server
set -e

echo "🐳 Starting YAGO VIBE MCP Server with Docker..."

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
    echo "⚠️  .env file not found. Copying from env.example..."
    cp env.example .env
    echo "📝 Please edit .env file with your n8n configuration before continuing."
    echo "   Required: N8N_TOKEN, N8N_WEBHOOK_* URLs"
    exit 1
fi

# Build and start containers
echo "🔨 Building Docker image..."
docker-compose build --pull

echo "▶️  Starting MCP server container..."
docker-compose up -d

# Wait for container to be ready
echo "⏳ Waiting for server to be ready..."
sleep 10

# Test the server
echo "🧪 Testing server health..."
if curl -s http://localhost:7331/tools > /dev/null; then
    echo "✅ Server is healthy and responding!"
    echo "📊 Monitor with: docker-compose logs -f"
    echo "🛑 Stop with: docker-compose down"
    echo "🔄 Restart with: docker-compose restart"
else
    echo "❌ Server health check failed. Check logs: docker-compose logs"
    exit 1
fi
