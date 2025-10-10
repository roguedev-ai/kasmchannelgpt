#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

log_info "Stopping Next.js application..."

# Find and kill Next.js processes
if pgrep -f "next" > /dev/null; then
    pkill -f "next"
    log_info "Next.js processes stopped"
else
    log_warn "No Next.js processes found"
fi

# Check if port 3000 is still in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    log_warn "Port 3000 is still in use. Force killing process..."
    lsof -ti:3000 | xargs kill -9
    log_info "Port 3000 freed"
fi

log_info "Application stopped successfully"
