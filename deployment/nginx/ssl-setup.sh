#!/bin/bash
# ============================================
# SSL/TLS Setup Script using Let's Encrypt
# Domain: kasmpartners.workoverip.app
# ============================================

set -e

DOMAIN="${1:-kasmpartners.workoverip.app}"
EMAIL="roguedev@roguereality.co"

echo "============================================"
echo "SSL Certificate Setup"
echo "Domain: $DOMAIN"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Error: Nginx is not installed!"
    echo "Run ./deployment/server-setup.sh first"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "❌ Error: Certbot is not installed!"
    echo "Run ./deployment/server-setup.sh first"
    exit 1
fi

# Create certbot webroot directory
echo "📁 Creating certbot webroot..."
mkdir -p /var/www/certbot

# Copy nginx configuration (without SSL first)
echo "🔧 Setting up Nginx configuration..."
TEMP_CONF="/etc/nginx/sites-available/kasmchannelgpt-temp"

# Create temporary config for HTTP only (for certbot challenge)
cat > $TEMP_CONF << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name kasmpartners.workoverip.app;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable temporary configuration
ln -sf $TEMP_CONF /etc/nginx/sites-enabled/kasmchannelgpt
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Reload nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo ""
echo "📜 Obtaining SSL certificate from Let's Encrypt..."
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Obtain certificate
certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    echo ""
    
    # Now install the full nginx configuration with SSL
    echo "🔧 Installing full Nginx configuration with SSL..."
    cp deployment/nginx/nginx.conf /etc/nginx/sites-available/kasmchannelgpt
    ln -sf /etc/nginx/sites-available/kasmchannelgpt /etc/nginx/sites-enabled/kasmchannelgpt
    
    # Test configuration
    echo "🧪 Testing final Nginx configuration..."
    nginx -t
    
    # Reload nginx
    echo "🔄 Reloading Nginx with SSL..."
    systemctl reload nginx
    
    echo ""
    echo "============================================"
    echo "SSL Setup Complete! 🎉"
    echo "============================================"
    echo ""
    echo "Your site is now available at:"
    echo "  https://$DOMAIN"
    echo ""
    echo "Certificate information:"
    echo "  Location: /etc/letsencrypt/live/$DOMAIN/"
    echo "  Expires: $(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem | cut -d= -f2)"
    echo ""
    echo "Auto-renewal:"
    echo "  Certbot will automatically renew certificates"
    echo "  Test renewal: certbot renew --dry-run"
    echo ""
    echo "Verify SSL:"
    echo "  curl https://$DOMAIN/api/health"
    echo "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    echo "============================================"
else
    echo "❌ Failed to obtain SSL certificate"
    echo ""
    echo "Common issues:"
    echo "  1. DNS not pointing to this server (146.235.215.36)"
    echo "  2. Firewall blocking port 80/443"
    echo "  3. Domain not yet propagated"
    echo ""
    echo "Check DNS:"
    echo "  dig $DOMAIN"
    echo "  nslookup $DOMAIN"
    echo ""
    echo "Test connectivity:"
    echo "  curl -I http://$DOMAIN"
    exit 1
fi
