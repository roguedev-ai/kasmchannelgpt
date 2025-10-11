# Deployment Guide

This guide covers deploying the RAG Platform to a production server.

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Docker installed and running
- Qdrant container running on port 6333
- Node.js 18+ installed
- Nginx installed (for production HTTPS)
- Domain name with SSL certificate (Let's Encrypt)

## Quick Deployment

```bash
# 1. Clone the repository
git clone https://github.com/your-org/your-repo.git
cd your-repo

# 2. Run deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The script will prompt you for:
- Embedding Provider: OpenAI or Gemini
- API Keys: Based on your embedding choice
- CustomGPT Configuration: API key and optional agent IDs
- Domain: Your application URL

## Configuration Options

### Embedding Providers

#### OpenAI (Default)
- **Model**: text-embedding-3-small
- **Dimensions**: 1536
- **Pros**: Excellent quality, widely tested
- **Cons**: Costs $0.00002 per 1K tokens
- **API Key**: From https://platform.openai.com/api-keys
- **Note**: Can use CustomGPT key if it starts with sk-

#### Google Gemini
- **Model**: text-embedding-004
- **Dimensions**: 768
- **Pros**: Free tier (15K requests/day), good quality
- **Cons**: Lower dimensions (768 vs 1536)
- **API Key**: From https://makersuite.google.com/app/apikey

### Agent Configuration

You can configure different agents for different functions:

- **Default Agent**: Fallback for all queries
- **Sales Agent**: Handles pricing, purchases, billing
- **Support Agent**: Handles troubleshooting, issues
- **Technical Agent**: Handles API, integration questions
- **General Agent**: Handles general information

Leave blank to use a single agent for all queries.

## Manual Configuration

If you prefer to configure manually:

1. Copy example environment file:
```bash
cp .env.example .env.local
```

2. Edit required variables:
```bash
# Required
JWT_SECRET=<32+ character secret>
CUSTOMGPT_API_KEY=<your-key>

# Embedding Provider (choose one)
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=<your-key>
# OR
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=<your-key>

# Optional Agent Configuration
CUSTOMGPT_DEFAULT_AGENT_ID=<default-id>
CUSTOMGPT_AGENT_SALES=<sales-id>
CUSTOMGPT_AGENT_SUPPORT=<support-id>
CUSTOMGPT_AGENT_TECHNICAL=<technical-id>
CUSTOMGPT_AGENT_GENERAL=<general-id>
```

## Production Setup

### 1. SSL Configuration

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Test renewal
sudo certbot renew --dry-run
```

### 2. Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Process Management

The deployment script uses PM2 to manage the Node.js process:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "rag-platform" -- start

# View logs
pm2 logs rag-platform

# Monitor status
pm2 monit
```

### 4. Database Backup

Set up regular backups of:
- SQLite database (DATABASE_PATH)
- Qdrant collections (/var/lib/qdrant/storage)

Example backup script:
```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d)

# Backup SQLite
cp ./data/rag-platform.db "$BACKUP_DIR/db-$DATE.sqlite"

# Backup Qdrant (if using Docker)
docker exec qdrant-container tar czf - /qdrant/storage > "$BACKUP_DIR/qdrant-$DATE.tar.gz"
```

## Monitoring

### 1. Application Logs

```bash
# View application logs
pm2 logs rag-platform

# View error logs only
pm2 logs rag-platform --err
```

### 2. Debug Mode

Enable debug logging in .env.local:
```env
DEBUG=true
```

This will show:
- API requests and responses
- Embedding operations
- Agent selection
- Vector operations

### 3. Health Checks

The platform provides a health check endpoint:
```bash
curl https://your-domain.com/api/health
```

## Troubleshooting

### 1. Embedding Issues

If embeddings fail:
- Check API key validity
- Verify provider selection in .env.local
- Check rate limits (especially for Gemini free tier)

### 2. Agent Routing Issues

If agent routing isn't working:
- Verify agent IDs in .env.local
- Check CustomGPT API key permissions
- Enable DEBUG mode to see routing decisions

### 3. Vector Store Issues

If Qdrant operations fail:
- Check Qdrant container status
- Verify collection dimensions match provider
- Check disk space for vector storage

## Security Considerations

1. **API Keys**:
   - Use different keys for development/production
   - Rotate keys regularly
   - Monitor usage for unusual patterns

2. **JWT Secret**:
   - Use a strong, unique secret
   - Rotate periodically
   - Monitor token usage

3. **Rate Limiting**:
   - Configure Nginx rate limiting
   - Monitor API usage
   - Set up alerts for abuse

4. **Data Isolation**:
   - Verify partner isolation
   - Monitor cross-partner access attempts
   - Regular security audits

## Maintenance

1. **Regular Updates**:
```bash
# Update dependencies
npm update

# Check for security issues
npm audit

# Update system packages
sudo apt update && sudo apt upgrade
```

2. **Backup Schedule**:
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

3. **Log Rotation**:
```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Support

For issues or questions:
1. Check the logs: `pm2 logs rag-platform`
2. Enable debug mode in .env.local
3. Review documentation in /docs
4. Open an issue on GitHub
