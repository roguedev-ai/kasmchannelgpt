#!/bin/bash

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function: Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Check Docker
check_docker() {
    log_info "Checking Docker installation..."
    if ! command_exists docker; then
        log_error "Docker is not installed!"
        exit 1
    fi
    log_info "Docker is installed: $(docker --version)"
}

# 2. Check Qdrant container
check_qdrant() {
    log_info "Checking Qdrant container..."
    if ! docker ps | grep -q qdrant; then
        log_error "Qdrant container is not running!"
        log_info "Start it with: docker run -d --name qdrant -p 6333:6333 -v ~/qdrant_storage:/qdrant/storage --restart always qdrant/qdrant:latest"
        exit 1
    fi
    
    # Test Qdrant API
    if ! curl -s http://localhost:6333/ > /dev/null; then
        log_error "Qdrant is running but not responding!"
        exit 1
    fi
    log_info "Qdrant is running and healthy"
}

# 3. Check Node.js
check_node() {
    log_info "Checking Node.js installation..."
    if ! command_exists node; then
        log_error "Node.js is not installed!"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version must be 18 or higher. Current: $(node --version)"
        exit 1
    fi
    log_info "Node.js is installed: $(node --version)"
}

# 4. Setup environment
setup_env() {
    log_info "Setting up environment variables..."
    
    if [ ! -f .env.local ]; then
        log_warn ".env.local not found. Creating from template..."
        
        # Prompt for CustomGPT API key
        read -p "Enter CustomGPT API key: " CUSTOMGPT_KEY
        
        # Generate JWT secret if not provided
        JWT_SECRET=$(openssl rand -base64 32)
        
        # Create .env.local
        cat > .env.local << EOF
# Backend Configuration
CUSTOMGPT_API_KEY=${CUSTOMGPT_KEY}
JWT_SECRET=${JWT_SECRET}
QDRANT_URL=http://localhost:6333

# Frontend Configuration
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_APP_NAME="RAG Platform"
EOF
        log_info ".env.local created successfully"
    else
        log_info ".env.local already exists"
    fi
}

# 5. Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    if [ ! -f package-lock.json ] || [ package.json -nt package-lock.json ]; then
        npm install --production=false
        log_info "Dependencies installed"
    else
        log_info "Dependencies are up to date"
    fi
}

# 6. Build application
build_app() {
    log_info "Building application..."
    npm run build
    log_info "Build completed successfully"
}

# 7. Start application
start_app() {
    MODE=${1:-production}
    
    log_info "Starting application in $MODE mode..."
    
    # Check if port 3000 is in use
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        log_warn "Port 3000 is in use. Stopping existing process..."
        pkill -f "next" || true
        sleep 2
    fi
    
    if [ "$MODE" = "development" ]; then
        npm run dev
    else
        npm start
    fi
}

# Main execution
main() {
    log_info "=== Starting Deployment ==="
    
    check_docker
    check_qdrant
    check_node
    setup_env
    install_deps
    build_app
    
    # Ask user for run mode
    read -p "Start in [d]evelopment or [p]roduction mode? (d/p): " MODE_CHOICE
    
    if [ "$MODE_CHOICE" = "d" ]; then
        start_app development
    else
        start_app production
    fi
    
    log_info "=== Deployment Complete ==="
    log_info "Application should be running on http://localhost:3000"
}

# Run main function
main
