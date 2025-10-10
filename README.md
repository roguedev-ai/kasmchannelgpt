# CustomGPT RAG Platform

A secure, multi-tenant RAG (Retrieval Augmented Generation) platform built with Next.js, SQLite, and Qdrant.

## Features

### Authentication & Authorization
- User management with SQLite
- JWT-based authentication
- Role-based access (admin/partner)
- Partner isolation
- Audit logging

### RAG Pipeline
- Document processing
- Vector embeddings (OpenAI)
- Semantic search (Qdrant)
- Context retrieval
- CustomGPT integration

### Security
- Password hashing (bcrypt)
- Partner data isolation
- Rate limiting
- SSL/TLS support
- Audit trail

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-org/customgpt-starter-kit.git
cd customgpt-starter-kit
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local

# Edit .env.local:
OPENAI_API_KEY=your-key
CUSTOMGPT_API_KEY=your-key
JWT_SECRET=min-32-chars-secret
```

### 4. Start Qdrant
```bash
docker run -d -p 6333:6333 qdrant/qdrant
```

### 5. Run Development Server
```bash
npm run dev
```

### 6. Initialize Database
The system will automatically:
- Create SQLite database
- Initialize schema
- Create default admin:
  * Email: admin@rag-platform.local
  * Password: admin123
  * ⚠️ Change these in production!

### 7. Test Setup
```bash
# Test database
npx ts-node scripts/test-database.ts

# Test authentication
npx ts-node scripts/test-auth.ts

# Test RAG pipeline
npx ts-node scripts/test-query.ts
```

## Production Deployment

### 1. SSL Setup
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo ./scripts/setup-ssl.sh

# Configure Nginx
sudo ./scripts/deploy.sh
# Choose 'y' when asked about Nginx
```

### 2. Security Checklist
- [ ] Change default admin password
- [ ] Configure SSL certificates
- [ ] Set secure file permissions
- [ ] Configure environment variables
- [ ] Set up monitoring

### 3. Start Server
```bash
npm run build
npm run start
```

## API Endpoints

### Authentication
```typescript
// Login
POST /api/auth/login
{
  "email": "user@partner.com",
  "password": "secure123"
}

// Response
{
  "token": "jwt.token.here",
  "partnerId": "partner1",
  "namespace": "partner_partner1",
  "role": "partner"
}
```

### Admin Operations
```typescript
// List partners
GET /api/admin/partners
Authorization: Bearer <admin-token>

// Create partner
POST /api/admin/partners
Authorization: Bearer <admin-token>
{
  "partnerId": "partner2",
  "email": "user@partner2.com",
  "password": "secure456"
}
```

### RAG Operations
```typescript
// Upload document
POST /api/rag/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
file: <document>

// Query
POST /api/rag/query
Authorization: Bearer <token>
{
  "query": "What is RAG?",
  "conversationId": "optional-id"
}
```

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Security Guide](docs/SECURITY.md)
- [Testing Guide](docs/TESTING.md)

## Development

### Directory Structure
```
src/
  ├── app/              # Next.js app router
  ├── components/       # React components
  ├── lib/             # Core libraries
  │   ├── database/    # SQLite client
  │   ├── isolation/   # Partner isolation
  │   └── rag/         # RAG pipeline
  └── types/           # TypeScript types

scripts/               # Utility scripts
docs/                 # Documentation
```

### Testing
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Scripts
- `deploy.sh`: Production deployment
- `setup-ssl.sh`: SSL certificate setup
- `test-database.ts`: Database tests
- `test-auth.ts`: Authentication tests
- `test-query.ts`: RAG pipeline tests

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Create pull request

## License

MIT License - see [LICENSE](LICENSE)
