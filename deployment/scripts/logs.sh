#!/bin/bash
# ============================================
# Logs Viewer for KasmChannelGPT
# View container logs easily
# ============================================

# Display usage
usage() {
    echo "Usage: $0 [service] [options]"
    echo ""
    echo "Services:"
    echo "  all        - All services (default)"
    echo "  app        - Application container only"
    echo "  qdrant     - Qdrant container only"
    echo ""
    echo "Options:"
    echo "  -f, --follow    Follow log output"
    echo "  -n, --lines N   Show last N lines (default: 100)"
    echo ""
    echo "Examples:"
    echo "  $0              # Show all logs (last 100 lines)"
    echo "  $0 app -f       # Follow app logs"
    echo "  $0 qdrant -n 50 # Show last 50 lines of qdrant logs"
    exit 1
}

SERVICE="all"
FOLLOW=""
LINES="100"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        all|app|qdrant)
            SERVICE=$1
            shift
            ;;
        -f|--follow)
            FOLLOW="-f"
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

echo "============================================"
echo "KasmChannelGPT Logs"
echo "Service: $SERVICE"
echo "============================================"
echo ""

# Check if containers are running
if ! docker ps | grep -q "kasmchannelgpt"; then
    echo "⚠️  No KasmChannelGPT containers are running"
    echo ""
    echo "Start the services with:"
    echo "  docker-compose -f docker-compose.prod.yml up -d"
    exit 1
fi

# View logs based on service
case $SERVICE in
    all)
        if [ -n "$FOLLOW" ]; then
            docker-compose -f docker-compose.prod.yml logs -f --tail=$LINES
        else
            docker-compose -f docker-compose.prod.yml logs --tail=$LINES
        fi
        ;;
    app)
        if [ -n "$FOLLOW" ]; then
            docker-compose -f docker-compose.prod.yml logs -f --tail=$LINES app
        else
            docker-compose -f docker-compose.prod.yml logs --tail=$LINES app
        fi
        ;;
    qdrant)
        if [ -n "$FOLLOW" ]; then
            docker-compose -f docker-compose.prod.yml logs -f --tail=$LINES qdrant
        else
            docker-compose -f docker-compose.prod.yml logs --tail=$LINES qdrant
        fi
        ;;
esac
