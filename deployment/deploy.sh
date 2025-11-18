#!/bin/bash
# ============================================
# KasmChannelGPT Deployment Script
# Deploys/Updates the application
# ============================================

set -e

echo "============================================"
echo "KasmChannelGPT Deployment"
echo "============================================"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production not found!"
    echo ""
    echo "Please create it first:"
    echo "  cp .env.docker.example .env.production"
    echo "  nano .env.production"
    exit 1
fi

# Check required environment variables
echo "🔍 Checking environment configuration..."
source .env.production

REQUIRED_VARS=("GEMINI_API_KEY" "JWT_SECRET" "NEXTAUTH_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please edit .env.production and add these variables"
    exit 1
fi

echo "✅ Environment configuration valid"
echo ""

# Pull latest changes (if in git repo)
if [ -d .git ]; then
    echo "📥 Pulling latest changes from GitHub..."
    git pull origin main
    echo "✅ Repository updated"
    echo ""
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true
echo ""

# Remove old images (optional - uncomment if you want to force rebuild)
# echo "🗑️  Removing old images..."
# docker-compose -f docker-compose.prod.yml rm -f

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check container status
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔍 Checking application health..."
MAX_RETRIES=12
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            echo "❌ Application health check failed after $MAX_RETRIES attempts"
            echo ""
            echo "Check logs with:"
            echo "  docker-compose -f docker-compose.prod.yml logs app"
            exit 1
        fi
        echo "⏳ Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

echo ""
echo "============================================"
echo "Deployment Complete! 🎉"
echo "============================================"
echo ""
echo "Application is running:"
echo "  Internal: http://localhost:3000"
echo "  Domain: https://kasmpartners.workoverip.app (after nginx/SSL setup)"
echo ""
echo "Useful commands:"
echo "  View logs:       docker-compose -f docker-compose.prod.yml logs -f"
echo "  View app logs:   docker-compose -f docker-compose.prod.yml logs -f app"
echo "  View qdrant logs: docker-compose -f docker-compose.prod.yml logs -f qdrant"
echo "  Stop services:   docker-compose -f docker-compose.prod.yml down"
echo "  Restart:         docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "Next steps:"
echo "  1. Test the application: curl http://localhost:3000/api/health"
echo "  2. Setup Nginx reverse proxy: ./deployment/nginx/nginx-setup.sh"
echo "  3. Setup SSL certificate: ./deployment/nginx/ssl-setup.sh kasmpartners.workoverip.app"
echo "============================================"
