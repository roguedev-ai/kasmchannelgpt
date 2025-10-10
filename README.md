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

## Quick Start

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd customgpt-multi-tenant-rag
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Development

### Prerequisites

- Node.js >= 18
- npm >= 8
- Docker and Docker Compose
- Qdrant instance (local or remote)

### Environment Variables

Required environment variables:
- `CUSTOMGPT_API_KEY`: Your CustomGPT API key
- `QDRANT_URL`: URL of your Qdrant instance
- `JWT_SECRET`: Secret for JWT token generation
- `DATABASE_URL`: PostgreSQL connection string

### Architecture

The platform follows a multi-tenant architecture with:
- Isolated partner namespaces
- Separate vector spaces per partner
- JWT-based authentication
- Middleware for request validation
- Real-time document processing

### API Routes

- `/api/auth/*`: Authentication endpoints
- `/api/documents/*`: Document management
- `/api/chat/*`: Chat interactions
- `/api/partners/*`: Partner management

## Deployment

1. **Build Docker images**
   ```bash
   docker-compose build
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Initialize database**
   ```bash
   docker-compose exec app npm run db:migrate
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
