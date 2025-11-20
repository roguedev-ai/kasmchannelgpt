# Deployment Guide

## Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Domain name with DNS access (for production)

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/roguedev-ai/kasmchannelgpt.git
cd kasmchannelgpt
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set required variables:
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `GEMINI_API_KEY` or `OPENAI_API_KEY` - Your API key

### 3. Initialize Database

```bash
npm run db:setup
```

### 4. Create Admin User

```bash
npm run create:admin
```

Follow the prompts to create your admin account.

### 5. Start Qdrant (Vector Database)

```bash
docker-compose up -d qdrant
```

### 6. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 and login with your admin credentials.

## Production Deployment

### Quick Start

1. Set up environment variables
2. Run database setup
3. Start Qdrant: `docker-compose up -d qdrant`
4. Build app: `npm run build`
5. Start app: `npm start` (or use PM2)

### Detailed Production Setup

For complete production deployment including:
- Nginx reverse proxy configuration
- SSL certificate setup (DNS challenge method)
- Firewall configuration (especially for Oracle Cloud)
- PM2 process management

See: `deployment/README.md`

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Your application URL | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | NextAuth secret key | Generate with openssl |
| `JWT_SECRET` | JWT signing secret | Generate with openssl |
| `DATABASE_URL` | SQLite database path | `file:./data/app.db` |
| `QDRANT_URL` | Qdrant server URL | `http://localhost:6333` |
| `EMBEDDING_PROVIDER` | Embedding service | `gemini` or `openai` |
| `GEMINI_API_KEY` | Google Gemini API key | Your API key |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI embeddings) |
| `CUSTOMGPT_API_KEY` | CustomGPT integration |
| `CUSTOMGPT_PROJECT_ID` | CustomGPT project ID |

## Troubleshooting

### Build Errors

**Error: Cannot find module**
- Run `npm install` to ensure all dependencies are installed
- Check Node version: `node --version` (must be 20+)

**TypeScript errors**
- Run `npm run build` to see detailed errors
- Ensure all environment variables are set

### Runtime Errors

**Database errors**
- Ensure `npm run db:setup` was run
- Check DATABASE_URL path exists and is writable

**Qdrant connection failed**
- Verify Qdrant is running: `docker ps | grep qdrant`
- Check QDRANT_URL in environment

**Authentication errors**
- Verify NEXTAUTH_SECRET and JWT_SECRET are set
- Check admin user exists: `sqlite3 data/app.db "SELECT * FROM partners;"`

## Oracle Cloud Specific Notes

If deploying to Oracle Cloud Infrastructure (OCI):

1. **Firewall Configuration**: OCI uses both cloud security lists AND iptables
   ```bash
   # Open ports in iptables (BEFORE the REJECT rule)
   sudo iptables -I INPUT 5 -p tcp --dport 443 -j ACCEPT
   sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
   sudo netfilter-persistent save
   ```

2. **Security Lists**: Also open ports 80 and 443 in OCI console security lists

## Support

For issues or questions, please open a GitHub issue.
