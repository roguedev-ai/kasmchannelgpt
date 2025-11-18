# KasmChannelGPT Deployment Guide

Production deployment configuration for Ubuntu 22.04 server.

## Server Details
- **IP**: 146.235.215.36
- **Domain**: kasmpartners.workoverip.app
- **OS**: Ubuntu 22.04 LTS
- **Resources**: 2 vCPU, 8GB RAM, 200GB disk

## Quick Start

### 1. Initial Server Setup

SSH into your server and run the setup script:

```bash
ssh root@146.235.215.36
curl -o setup.sh https://raw.githubusercontent.com/roguedev-ai/kasmchannelgpt/main/deployment/server-setup.sh
chmod +x setup.sh
./setup.sh
```

This installs:
- Docker & Docker Compose
- Node.js 18.x
- Nginx
- Certbot (Let's Encrypt)
- Git and essentials

### 2. Clone Repository

```bash
cd /opt/kasmchannelgpt
git clone https://github.com/roguedev-ai/kasmchannelgpt.git .
```

### 3. Configure Environment

```bash
cp .env.docker.example .env.production
nano .env.production
```

**Required variables:**
- `GEMINI_API_KEY` - From https://makersuite.google.com/app/apikey
- `JWT_SECRET` - Generate: `openssl rand -base64 32`
- `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`
- `ADMIN_PASSWORD` - Set a strong password

### 4. Deploy Application

```bash
./deployment/deploy.sh
```

Waits for services to start and performs health checks.

### 5. Setup SSL (After deployment works)

```bash
sudo ./deployment/nginx/ssl-setup.sh kasmpartners.workoverip.app
```

## Development Workflow

### In Kasm Workspace:
```bash
# Make changes
git add .
git commit -m "feat: description"
git push origin main
```

### On Production Server:
```bash
ssh root@146.235.215.36
cd /opt/kasmchannelgpt
./deployment/deploy.sh  # Pulls latest changes and rebuilds
```

## Useful Scripts

### Health Check
```bash
./deployment/scripts/health-check.sh
```

### View Logs
```bash
./deployment/scripts/logs.sh          # All services
./deployment/scripts/logs.sh app -f   # Follow app logs
./deployment/scripts/logs.sh qdrant   # Qdrant logs
```

### Backup Data
```bash
./deployment/scripts/backup.sh
```

## Manual Docker Commands

```bash
# View running containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## Service URLs

- **Internal**: http://localhost:3000
- **Public**: https://kasmpartners.workoverip.app
- **Qdrant**: http://localhost:6333

## Troubleshooting

### Application won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check environment variables
cat .env.production

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

### SSL certificate issues
```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

### Port conflicts
```bash
# Check what's using ports
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :6333
```

## File Structure

```
deployment/
├── README.md                    # This file
├── server-setup.sh             # Initial server setup
├── deploy.sh                   # Deployment script
├── docker-compose.prod.yml     # Production Docker config
├── nginx/
│   ├── nginx.conf             # Nginx reverse proxy config
│   └── ssl-setup.sh           # Let's Encrypt SSL setup
└── scripts/
    ├── backup.sh              # Backup utility
    ├── health-check.sh        # Health monitoring
    └── logs.sh                # Log viewer
```

## Security Notes

- Never commit `.env.production` to Git
- Use strong passwords for ADMIN_PASSWORD
- Generate unique secrets for JWT_SECRET and NEXTAUTH_SECRET
- Keep your GEMINI_API_KEY secure
- Firewall is configured to allow only SSH, HTTP, HTTPS

## Support

For issues or questions, refer to:
- Main README.md
- PROJECT-STATUS.md
- STATUS-CHECKPOINT-7.md
