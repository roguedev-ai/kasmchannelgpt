#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

log_info() {
    echo -e "${GREEN}INFO: $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}WARN: $1${NC}"
}

# Check if Docker is running
check_docker() {
    log_info "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    log_info "✓ Docker is running"
}

# Check if Qdrant is running
check_qdrant() {
    log_info "Checking Qdrant..."
    if ! curl -s http://localhost:6333/health > /dev/null; then
        log_error "Qdrant is not running"
        log_info "Start with: docker run -d -p 6333:6333 qdrant/qdrant"
        exit 1
    fi
    log_info "✓ Qdrant is running"
}

# Check Node.js version
check_node() {
    log_info "Checking Node.js..."
    if ! command -v node > /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    local version=$(node -v | cut -d'v' -f2)
    local major=$(echo $version | cut -d'.' -f1)
    
    if [ "$major" -lt 16 ]; then
        log_error "Node.js version must be >= 16 (current: $version)"
        exit 1
    fi
    log_info "✓ Node.js version $version"
}

# Setup environment
setup_env() {
    log_info "Checking environment..."
    if [ ! -f .env.local ]; then
        log_error ".env.local not found"
        log_info "Copy .env.example to .env.local and configure it"
        exit 1
    fi
    log_info "✓ Environment configured"
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    npm install
    log_info "✓ Dependencies installed"
}

# Build application
build_app() {
    log_info "Building application..."
    npm run build
    log_info "✓ Build complete"
}

# Configure Nginx
configure_nginx() {
    log_info "Configuring Nginx..."

    # Check if running as root/sudo
    if [ "$EUID" -ne 0 ]; then
        log_error "Nginx configuration requires sudo privileges"
        log_info "Please run: sudo ./scripts/deploy.sh"
        exit 1
    fi

    # Prompt for domain
    read -p "Enter your domain name (e.g., agent-01.workoverip.app): " DOMAIN

    if [ -z "$DOMAIN" ]; then
        log_error "Domain name is required"
        exit 1
    fi

    # Check if SSL certificates exist
    CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    KEY_PATH="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

    if [ ! -f "$CERT_PATH" ]; then
        log_error "SSL certificate not found at: $CERT_PATH"
        log_info "Please run: sudo ./scripts/setup-ssl.sh"
        exit 1
    fi

    log_info "Found SSL certificates for $DOMAIN"

    # Create Nginx config
    NGINX_CONFIG="/etc/nginx/sites-available/rag-platform"

    log_info "Creating Nginx configuration..."

    cat > "$NGINX_CONFIG" << 'NGINX_EOF'
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Hide server info
    server_tokens off;

    # File upload size
    client_max_body_size 11M;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/m;

    # Main proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limited endpoints
    location /api/rag/query {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        include proxy_params;
    }

    location /api/rag/upload {
        limit_req zone=upload burst=2 nodelay;
        proxy_pass http://localhost:3000;
        include proxy_params;
    }

    # Health check (no rate limit)
    location /api/health {
        proxy_pass http://localhost:3000;
        include proxy_params;
    }
}
NGINX_EOF

    # Replace domain placeholder
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$NGINX_CONFIG"

    # Enable site
    ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/rag-platform

    # Remove default site if exists
    rm -f /etc/nginx/sites-enabled/default

    # Test Nginx config
    log_info "Testing Nginx configuration..."
    if nginx -t; then
        log_info "Nginx configuration is valid"
    else
        log_error "Nginx configuration test failed!"
        exit 1
    fi

    # Reload Nginx
    log_info "Reloading Nginx..."
    systemctl reload nginx

    log_info "✓ Nginx configured successfully for https://$DOMAIN"

    # Update .env.local with domain
    if grep -q "NEXT_PUBLIC_APP_URL" .env.local; then
        sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|" .env.local
    else
        echo "NEXT_PUBLIC_APP_URL=https://$DOMAIN" >> .env.local
    fi
}

# Start application
start_app() {
    local mode=$1
    log_info "Starting application in $mode mode..."
    
    if [ "$mode" = "development" ]; then
        npm run dev
    else
        npm run start
    fi
}

# Main function
main() {
    log_info "=== Starting Deployment ==="

    check_docker
    check_qdrant
    check_node
    setup_env

    # Ask if user wants to configure Nginx
    read -p "Configure Nginx with SSL? (y/n): " SETUP_NGINX
    if [ "$SETUP_NGINX" = "y" ] || [ "$SETUP_NGINX" = "Y" ]; then
        configure_nginx
    fi

    install_deps
    build_app

    # Ask for run mode
    read -p "Start in [d]evelopment or [p]roduction mode? (d/p): " MODE_CHOICE

    if [ "$MODE_CHOICE" = "d" ]; then
        start_app development
    else
        start_app production
    fi

    log_info "=== Deployment Complete ==="
    log_info "Application: http://localhost:3000"
    if [ "$SETUP_NGINX" = "y" ] || [ "$SETUP_NGINX" = "Y" ]; then
        log_info "Public URL: https://$DOMAIN"
    fi
}

# Run main
main
