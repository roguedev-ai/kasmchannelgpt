#!/bin/bash
# ============================================
# Health Check Script for KasmChannelGPT
# Monitors application and service health
# ============================================

echo "============================================"
echo "KasmChannelGPT Health Check"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check Docker
echo "🐳 Docker Status:"
if systemctl is-active --quiet docker; then
    echo -e "  ${GREEN}✓${NC} Docker service running"
else
    echo -e "  ${RED}✗${NC} Docker service not running"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check containers
echo "📦 Container Status:"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "kasmchannelgpt"; then
    docker ps --filter "name=kasmchannelgpt" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Check if app container is running
    if docker ps | grep -q "kasmchannelgpt-app.*Up"; then
        echo -e "  ${GREEN}✓${NC} Application container running"
    else
        echo -e "  ${RED}✗${NC} Application container not running"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check if qdrant container is running
    if docker ps | grep -q "kasmchannelgpt-qdrant.*Up"; then
        echo -e "  ${GREEN}✓${NC} Qdrant container running"
    else
        echo -e "  ${RED}✗${NC} Qdrant container not running"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${RED}✗${NC} No KasmChannelGPT containers running"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check application endpoint
echo "🌐 Application Health:"
if curl -f -s -o /dev/null http://localhost:3000/api/health; then
    echo -e "  ${GREEN}✓${NC} Application responding on port 3000"
    
    # Get health details
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
    echo "  Status: $HEALTH_RESPONSE"
else
    echo -e "  ${RED}✗${NC} Application not responding on port 3000"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check Qdrant
echo "🔍 Qdrant Health:"
if curl -f -s -o /dev/null http://localhost:6333/health; then
    echo -e "  ${GREEN}✓${NC} Qdrant responding on port 6333"
else
    echo -e "  ${RED}✗${NC} Qdrant not responding on port 6333"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check Nginx (if installed)
echo "🌐 Nginx Status:"
if command -v nginx &> /dev/null; then
    if systemctl is-active --quiet nginx; then
        echo -e "  ${GREEN}✓${NC} Nginx service running"
        
        # Check if serving application
        if curl -f -s -o /dev/null -I https://kasmpartners.workoverip.app 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} Application accessible via HTTPS"
        elif curl -f -s -o /dev/null -I http://kasmpartners.workoverip.app 2>/dev/null; then
            echo -e "  ${YELLOW}⚠${NC} Application accessible via HTTP (SSL not configured)"
        else
            echo -e "  ${YELLOW}⚠${NC} Application not accessible via domain"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} Nginx service not running"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Nginx not installed"
fi
echo ""

# Check disk space
echo "💾 Disk Space:"
df -h / | awk 'NR==2 {print "  Root: "$3" used / "$2" total ("$5" used)"}'
echo ""

# Check memory
echo "🧠 Memory Usage:"
free -h | awk 'NR==2 {print "  RAM: "$3" used / "$2" total"}'
echo ""

# Check Docker volumes
echo "📁 Docker Volumes:"
docker volume ls | grep kasmchannelgpt | while read -r line; do
    VOL_NAME=$(echo $line | awk '{print $2}')
    VOL_SIZE=$(docker system df -v | grep "$VOL_NAME" | awk '{print $3}')
    echo "  $VOL_NAME: $VOL_SIZE"
done
echo ""

# Summary
echo "============================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}All systems operational ✓${NC}"
    echo "============================================"
    exit 0
else
    echo -e "${RED}$ERRORS issue(s) detected ✗${NC}"
    echo "============================================"
    echo ""
    echo "Troubleshooting:"
    echo "  View logs: ./deployment/scripts/logs.sh"
    echo "  Restart:   docker-compose -f docker-compose.prod.yml restart"
    echo "  Redeploy:  ./deployment/deploy.sh"
    exit 1
fi
