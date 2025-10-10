#!/bin/bash

echo "=== SSL Certificate Setup Helper ==="
echo ""
echo "This script will help you set up Let's Encrypt SSL"
echo ""

read -p "Enter your domain name: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "Error: Domain name is required"
    exit 1
fi

echo ""
echo "Installing Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

echo ""
echo "Obtaining SSL certificate for: $DOMAIN"
echo ""
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || 
sudo certbot --nginx -d "$DOMAIN"

echo ""
echo "Testing auto-renewal..."
sudo certbot renew --dry-run

echo ""
echo "✓ SSL setup complete!"
echo "Certificates located at:"
echo "  - /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  - /etc/letsencrypt/live/$DOMAIN/privkey.pem"
