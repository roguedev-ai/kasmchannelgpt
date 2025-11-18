# 🚀 Quick Start Deployment Guide

**Server**: 146.235.215.36  
**Domain**: kasmpartners.workoverip.app  
**Date**: 11/18/2025

---

## ✅ Repository Setup Complete

All repository fixes and deployment assets have been created. You're ready to deploy!

---

## 📋 Deployment Steps

### Step 1: Push Changes to GitHub (In Kasm)

```bash
cd /home/kasm-user/Desktop/kasmchannelgpt
git add .
git commit -m "feat: Add production deployment configuration and fix missing dependencies"
git push origin main
```

### Step 2: Setup Production Server

SSH into your server:
```bash
ssh root@146.235.215.36
```

Download and run the server setup script:
```bash
curl -o setup.sh https://raw.githubusercontent.com/roguedev-ai/kasmchannelgpt/main/deployment/server-setup.sh
chmod +x setup.sh
./setup.sh
```

This installs Docker, Node.js, Nginx, Certbot, and all dependencies.

### Step 3: Clone Repository on Server

```bash
mkdir -p /opt/kasmchannelgpt
cd /opt/kasmchannelgpt
git clone https://github.com/roguedev-ai/kasmchannelgpt.git .
```

### Step 4: Configure Environment

```bash
cp .env.docker.example .env.production
nano .env.production
```

**Required values to set:**
```bash
GEMINI_API_KEY="your-gemini-api-key"           # From https://makersuite.google.com/app/apikey
JWT_SECRET="$(openssl rand -base64 32)"        # Auto-generate
NEXTAUTH_SECRET="$(openssl rand -base64 32)"   # Auto-generate
ADMIN_PASSWORD="YourStrongPassword123"         # Choose a strong password
```

### Step 5: Deploy Application

```bash
chmod +x deployment/*.sh deployment/nginx/*.sh deployment/scripts/*.sh
./deployment/deploy.sh
```

This will:
- Pull latest code from GitHub
- Build Docker containers
- Start application and Qdrant
- Run health checks

### Step 6: Setup SSL Certificate

After the application is running:
```bash
sudo ./deployment/nginx/ssl-setup.sh kasmpartners.workoverip.app
```

---

## 🔍 Verify Deployment

### Check Health
```bash
./deployment/scripts/health-check.sh
```

### Test Application
```bash
curl http://localhost:3000/api/health
curl https://kasmpartners.workoverip.app/api/health
```

### View Logs
```bash
./deployment/scripts/logs.sh app -f
```

---

## 🔄 Update Workflow (Daily Use)

### In Kasm Workspace:
```bash
# Make code changes
git add .
git commit -m "feat: your changes"
git push origin main
```

### On Production Server:
```bash
ssh root@146.235.215.36
cd /opt/kasmchannelgpt
./deployment/deploy.sh  # Auto-pulls and rebuilds
```

---

## 📞 Useful Commands

```bash
# View all containers
docker-compose -f docker-compose.prod.yml ps

# View app logs
./deployment/scripts/logs.sh app -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Backup data
./deployment/scripts/backup.sh

# Health check
./deployment/scripts/health-check.sh
```

---

## 🛠️ Troubleshooting

### Application won't start
```bash
docker-compose -f docker-compose.prod.yml logs app
```

### Check environment
```bash
cat .env.production
```

### Rebuild everything
```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📚 Full Documentation

- **Deployment Details**: `deployment/README.md`
- **Status Tracking**: `STATUS-CHECKPOINT-7.md`
- **Project Overview**: `PROJECT-STATUS.md`
- **Main README**: `README.md`

---

## ✅ Checklist

- [ ] Push changes to GitHub from Kasm
- [ ] SSH into server (146.235.215.36)
- [ ] Run server-setup.sh
- [ ] Clone repository
- [ ] Configure .env.production (add API keys)
- [ ] Run deploy.sh
- [ ] Setup SSL with ssl-setup.sh
- [ ] Test application
- [ ] Verify https://kasmpartners.workoverip.app

---

**You're ready to deploy! 🎉**
