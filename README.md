# CustomGPT Multi-Tenant RAG Platform

A privacy-preserving RAG (Retrieval-Augmented Generation) system with isolated partner namespaces. This platform enables secure document management and AI-powered chat interactions while maintaining strict data isolation between different partners.

## Features

- **JWT-based Authentication**
  - Secure partner authentication
  - Session management
  - Role-based access control

- **Partner-Isolated Document Storage**
  - Separate document namespaces per partner
  - Secure file upload and management
  - Document versioning and tracking

- **Qdrant Vector Database Integration**
  - High-performance vector similarity search
  - Isolated vector spaces per partner
  - Efficient document retrieval

- **CustomGPT.ai Integration**
  - Advanced language model capabilities
  - Context-aware responses
  - Customizable AI behavior

- **File Upload with RAG**
  - Document processing and chunking
  - Automatic embedding generation
  - Real-time search and retrieval

## Tech Stack

- **Frontend**
  - Next.js 14
  - TypeScript
  - Tailwind CSS
  - React Query

- **Backend**
  - Node.js
  - Express
  - LangChain
  - CustomGPT.ai API

- **Database**
  - Qdrant Vector Database
  - PostgreSQL (for metadata)

- **Infrastructure**
  - Docker
  - Docker Compose
  - Nginx (reverse proxy)

## Prerequisites

Before deploying, ensure you have:

1. **System Requirements**
   - Node.js >= 18
   - npm >= 8
   - Docker and Docker Compose
   - 4GB RAM minimum
   - 20GB free disk space

2. **Required Services**
   - Qdrant instance running (local or remote)
   - PostgreSQL database (if using metadata storage)

3. **API Keys**
   - CustomGPT API key
   - JWT secret (will be auto-generated if not provided)

## Deployment

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/roguedev-ai/kasmchannelgpt.git
   cd kasmchannelgpt
   ```

2. **Run the deployment script**
   ```bash
   ./scripts/deploy.sh
   ```
   This will:
   - Check prerequisites
   - Set up environment variables
   - Install dependencies
   - Build the application
   - Start the server

### Manual Deployment

1. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit environment variables
   nano .env.local
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Docker Deployment

1. **Build and start containers**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f
   ```

## Deployment Scripts

The project includes several utility scripts in the `scripts/` directory:

### deploy.sh
Comprehensive deployment script that:
- Checks prerequisites (Docker, Node.js, etc.)
- Sets up environment variables
- Installs dependencies
- Builds and starts the application

```bash
./scripts/deploy.sh
# Follow the prompts for configuration
```

### stop.sh
Safely stops the application:
- Terminates Next.js processes
- Frees up port 3000
- Cleans up resources

```bash
./scripts/stop.sh
```

### restart.sh
Combines stop and deploy operations:
- Stops existing instance
- Deploys fresh instance
- Preserves configuration

```bash
./scripts/restart.sh
```

### logs.sh
View application logs:
- Shows Next.js logs
- Supports PM2 logs if available
- Shows Docker logs if running in container
- Auto-detects environment

```bash
./scripts/logs.sh
```

### health-check.sh
System health monitoring:
- CPU, Memory, and Disk usage
- Application status
- Dependencies check
- Service health
- Environment validation

```bash
./scripts/health-check.sh
```

## Monitoring

1. **Application Status**
   ```bash
   # Check system health
   ./scripts/health-check.sh
   
   # View logs
   ./scripts/logs.sh
   ```

2. **Resource Usage**
   - The health check script provides CPU, memory, and disk usage
   - Monitor Qdrant metrics at http://localhost:6333/metrics

3. **Error Tracking**
   - Check application logs: `.next/logs/`
   - Check Docker logs: `docker-compose logs`

## Troubleshooting

1. **Application won't start**
   - Check if port 3000 is in use: `lsof -i :3000`
   - Verify environment variables: `./scripts/health-check.sh`
   - Check logs: `./scripts/logs.sh`

2. **Database Connection Issues**
   - Verify Qdrant is running: `curl http://localhost:6333`
   - Check connection string in .env.local
   - Ensure proper network access

3. **Build Failures**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `npm ci`
   - Check Node.js version: `node --version`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
