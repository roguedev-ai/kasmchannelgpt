# Architecture Overview

## System Components

### 1. Authentication & Authorization
- SQLite database for user management
- JWT-based authentication
- Role-based access control (admin/partner)
- Partner isolation
- Audit logging

### 2. RAG Pipeline
- Document processing
- Vector embeddings (OpenAI)
- Semantic search (Qdrant)
- Context retrieval
- CustomGPT integration

### 3. API Layer
- Next.js API routes
- CORS protection
- Rate limiting
- Error handling
- Health monitoring

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'partner')),
    display_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,
    metadata TEXT
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Audit Log
```sql
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## Authentication Flow

1. User Login
   ```mermaid
   sequenceDiagram
       Client->>API: POST /api/auth/login
       API->>Database: Verify credentials
       Database->>API: User details
       API->>API: Generate JWT
       API->>Client: Token + metadata
   ```

2. Partner Access
   ```mermaid
   sequenceDiagram
       Client->>API: Request + JWT
       API->>API: Verify token
       API->>Database: Check user status
       API->>API: Verify partner access
       API->>Client: Response
   ```

3. Admin Operations
   ```mermaid
   sequenceDiagram
       Admin->>API: Request + JWT
       API->>API: Verify token
       API->>Database: Check admin role
       API->>API: Execute admin action
       API->>Admin: Response
   ```

## Partner Isolation

Each partner has:
- Unique namespace
- Isolated document storage
- Separate vector collection
- Access control via JWT
- Audit trail

## API Endpoints

### Authentication
- POST `/api/auth/login`
  * Email/password login
  * Returns JWT token

### Admin
- GET `/api/admin/partners`
  * List all partners
  * Admin only
- POST `/api/admin/partners`
  * Create new partner
  * Admin only

### RAG
- POST `/api/rag/upload`
  * Upload documents
  * Partner-specific storage
- POST `/api/rag/query`
  * Query partner's documents
  * Context-aware responses

### System
- GET `/api/health`
  * System health check
  * Component status

## Security Measures

1. Authentication
   - Password hashing (bcrypt)
   - JWT validation
   - Role enforcement
   - Session tracking

2. Partner Isolation
   - Namespace separation
   - Token validation
   - Access control
   - Data segregation

3. API Security
   - CORS protection
   - Rate limiting
   - Input validation
   - Error handling

4. Monitoring
   - Health checks
   - Audit logging
   - Error tracking
   - Access logs

## Development Setup

1. Dependencies
   ```bash
   npm install
   ```

2. Environment
   ```bash
   cp .env.example .env.local
   # Configure variables
   ```

3. Database
   ```bash
   # SQLite database will be created at:
   ./data/rag-platform.db
   ```

4. Development
   ```bash
   npm run dev
   ```

5. Testing
   ```bash
   # Database tests
   npx ts-node scripts/test-database.ts
   
   # Auth tests
   npx ts-node scripts/test-auth.ts
   ```

## Production Deployment

1. Build
   ```bash
   npm run build
   ```

2. Environment
   - Set production variables
   - Configure SSL
   - Set up monitoring

3. Database
   - Configure backups
   - Set up replication
   - Monitor performance

4. Security
   - Update default admin
   - Configure rate limits
   - Set up alerts

## Maintenance

1. Daily
   - Check logs
   - Monitor errors
   - Review access

2. Weekly
   - Review metrics
   - Check backups
   - Update patches

3. Monthly
   - Rotate keys
   - Review access
   - Update docs
