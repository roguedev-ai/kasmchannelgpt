#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_header() { echo -e "\n${BLUE}=== $1 ===${NC}\n"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_warn() { echo -e "${YELLOW}!${NC} $1"; }

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system resources
check_resources() {
    log_header "System Resources"
    
    # CPU Usage
    echo "CPU Usage:"
    top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | awk '{printf "  %.1f%%\n", $1}'
    
    # Memory Usage
    echo -e "\nMemory Usage:"
    free -h | grep -v + | awk '
        /Mem:/ {
            printf "  Total: %s\n", $2;
            printf "  Used:  %s\n", $3;
            printf "  Free:  %s\n", $4;
        }'
    
    # Disk Usage
    echo -e "\nDisk Usage:"
    df -h | grep -E '^/dev/' | awk '{printf "  %s: %s used of %s\n", $6, $3, $2}'
}

# Check application status
check_application() {
    log_header "Application Status"
    
    # Check if Next.js is running
    if pgrep -f "next" > /dev/null; then
        log_success "Next.js application is running"
    else
        log_error "Next.js application is not running"
    fi
    
    # Check port 3000
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        log_success "Port 3000 is active"
    else
        log_error "Port 3000 is not active"
    fi
    
    # Check .next directory
    if [ -d ".next" ]; then
        log_success "Next.js build exists"
    else
        log_warn "Next.js build not found"
    fi
}

# Check dependencies
check_dependencies() {
    log_header "Dependencies"
    
    # Check Node.js
    if command_exists node; then
        log_success "Node.js $(node --version)"
    else
        log_error "Node.js not found"
    fi
    
    # Check npm
    if command_exists npm; then
        log_success "npm $(npm --version)"
    else
        log_error "npm not found"
    fi
    
    # Check Docker
    if command_exists docker; then
        log_success "Docker $(docker --version)"
    else
        log_error "Docker not found"
    fi
}

# Check services
check_services() {
    log_header "Services"
    
    # Check Qdrant
    if curl -s http://localhost:6333/ > /dev/null; then
        log_success "Qdrant is responding"
    else
        log_error "Qdrant is not responding"
    fi
    
    # Check if running in Docker
    if [ -f /.dockerenv ]; then
        log_success "Running in Docker container"
    else
        log_warn "Running outside Docker"
    fi
    
    # Check PM2 if available
    if command_exists pm2; then
        if pm2 list | grep -q "customgpt-ui"; then
            log_success "PM2 process is running"
        else
            log_warn "PM2 process not found"
        fi
    fi
}

# Check environment
check_environment() {
    log_header "Environment"
    
    # Check .env.local
    if [ -f .env.local ]; then
        log_success ".env.local exists"
        
        # Check required variables (without displaying values)
        if grep -q "CUSTOMGPT_API_KEY=" .env.local; then
            log_success "CUSTOMGPT_API_KEY is set"
        else
            log_error "CUSTOMGPT_API_KEY is missing"
        fi
        
        if grep -q "JWT_SECRET=" .env.local; then
            log_success "JWT_SECRET is set"
        else
            log_error "JWT_SECRET is missing"
        fi
    else
        log_error ".env.local not found"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}CustomGPT Multi-Tenant RAG Platform Health Check${NC}"
    echo -e "${BLUE}$(date)${NC}\n"
    
    check_resources
    check_application
    check_dependencies
    check_services
    check_environment
    
    log_header "Health Check Complete"
}

# Run main function
main
