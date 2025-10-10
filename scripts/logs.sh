#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to show Next.js logs
show_nextjs_logs() {
    log_info "Showing Next.js application logs..."
    
    # Check for .next/logs directory
    if [ -d ".next/logs" ]; then
        # Show last 100 lines of all log files and follow
        tail -f -n 100 .next/logs/*.log 2>/dev/null
    else
        log_warn "No Next.js log files found in .next/logs/"
    fi
}

# Function to show PM2 logs if available
show_pm2_logs() {
    if command_exists pm2; then
        log_info "PM2 detected, showing PM2 logs..."
        pm2 logs
    else
        show_nextjs_logs
    fi
}

# Function to show Docker logs
show_docker_logs() {
    if docker ps | grep -q "customgpt-ui"; then
        log_info "Showing Docker container logs..."
        docker logs -f --tail=100 customgpt-ui
    else
        show_nextjs_logs
    fi
}

# Main execution
main() {
    # Check if we're running in Docker
    if [ -f /.dockerenv ]; then
        show_docker_logs
    else
        show_pm2_logs
    fi
}

# Run main function
main
