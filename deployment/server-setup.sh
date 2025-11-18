#!/bin/bash
# ============================================
# KasmChannelGPT Server Setup Script
# Ubuntu 22.04 LTS
# Server: 146.235.215.36
# ============================================

set -e

echo "============================================"
echo "KasmChannelGPT Server Setup"
echo "Ubuntu 22.04 - Production Environment"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install essential packages
echo "📦 Installing essential packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    wget \
    git \
    ufw \
    htop \
    vim \
    net-tools

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose (standalone)
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Install Node.js (for local tools if needed)
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js installed successfully"
else
    echo "✅ Node.js already installed"
fi

# Install Nginx
echo "🌐 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo "✅ Nginx installed successfully"
else
    echo "✅ Nginx already installed"
fi

# Install Certbot for Let's Encrypt
echo "🔒 Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot installed successfully"
else
    echo "✅ Certbot already installed"
fi

# Configure Firewall
echo "🔥 Configuring UFW firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 6333/tcp  # Qdrant (optional - for external access)
echo "✅ Firewall configured"

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /opt/kasmchannelgpt
chown -R $SUDO_USER:$SUDO_USER /opt/kasmchannelgpt

# Configure Git
echo "🔧 Configuring Git..."
if [ ! -f /home/$SUDO_USER/.gitconfig ]; then
    sudo -u $SUDO_USER git config --global user.email "roguedev@roguereality.co"
    sudo -u $SUDO_USER git config --global user.name "roguedev"
    echo "✅ Git configured"
else
    echo "✅ Git already configured"
fi

# Display versions
echo ""
echo "============================================"
echo "Installation Complete! 🎉"
echo "============================================"
echo ""
echo "Installed versions:"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker-compose --version)"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Nginx: $(nginx -v 2>&1)"
echo "  Certbot: $(certbot --version 2>&1 | head -n1)"
echo ""
echo "============================================"
echo "Next Steps:"
echo "============================================"
echo "1. Clone repository:"
echo "   cd /opt/kasmchannelgpt"
echo "   git clone https://github.com/roguedev-ai/kasmchannelgpt.git ."
echo ""
echo "2. Configure environment:"
echo "   cp .env.docker.example .env.production"
echo "   nano .env.production"
echo ""
echo "3. Deploy application:"
echo "   ./deployment/deploy.sh"
echo ""
echo "4. Setup SSL (after deployment works):"
echo "   ./deployment/nginx/ssl-setup.sh kasmpartners.workoverip.app"
echo "============================================"
