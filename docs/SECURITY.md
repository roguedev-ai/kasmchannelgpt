# Security Documentation

## Overview
This document details the security measures, threat model, and best practices for the CustomGPT Multi-Tenant RAG Platform.

## Security Principles

### 1. Defense in Depth
Multiple layers of security:
- Network (Nginx, HTTPS)
- Application (JWT, input validation)
- Database (Physical isolation)
- System (File permissions, least privilege)

### 2. Principle of Least Privilege
- Qdrant: No external access
- JWT: Minimal claims
- File system: Restricted permissions
- API keys: Minimal scopes

### 3. Zero Trust
- Every request validated
- No implicit trust between components
- All inter-service communication authenticated

## Authentication Security

### JWT Implementation

#### Token Generation:
```typescript
// Strong secret (256-bit minimum)
JWT_SECRET = crypto.randomBytes(32).toString('base64');

// Token structure
{
  partnerId: "partner_a",      // Immutable
  email: "user@example.com",
  namespace: "partner_a",      // Computed server-side
  iat: 1234567890,
  exp: 1234654290             // 24h expiration
}

// Signature algorithm: HS256 (HMAC-SHA256)
```

#### Token Validation Rules:
- ✅ Signature verified with JWT_SECRET
- ✅ Expiration checked (exp claim)
- ✅ Not-before checked (nbf claim if present)
- ✅ Issued-at is reasonable (not future)
- ❌ No acceptance of "none" algorithm
- ❌ No acceptance of expired tokens
- ❌ No acceptance of tampered tokens

### Session Management
Best Practices:
- Tokens stored in memory only (never localStorage)
- HTTPS only (no HTTP transmission)
- Short expiration (24 hours)
- No refresh tokens in MVP (re-auth required)

## Data Isolation Security

### Collection-Based Isolation

#### Why Physical Isolation:
- Metadata filtering can be bypassed
- Application bugs can leak data
- Physical separation = database-enforced

#### Implementation:
```typescript
// WRONG - Metadata filter (app-level)
await qdrant.query({
  filter: { partnerId: "partner_a" }  // Can be manipulated
});

// RIGHT - Collection isolation (database-level)
await qdrant.query({
  collection: "partner_a"  // Physical boundary
});
```

### Namespace Computation

#### Server-Side Only:
```typescript
// ✅ Correct: Server computes namespace
const namespace = `partner_${jwt.partnerId}`;

// ❌ Wrong: Client provides namespace
const namespace = request.body.namespace;  // Exploitable!
```

#### Validation:
- partnerId must be alphanumeric only
- No special characters: ../, ;, etc.
- Maximum length: 50 characters
- Logged for audit trail

## Input Validation

### File Upload Security

#### Validation Rules:
```typescript
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): ValidationResult {
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  // Check file extension matches MIME type
  const ext = file.name.split('.').pop();
  if (!isValidExtension(ext, file.type)) {
    throw new Error('Extension mismatch');
  }
  
  // Scan for malicious content (future: virus scan)
  
  return { valid: true };
}
```

#### Content Sanitization:
- Strip HTML tags from text files
- Remove scripts from documents
- Validate UTF-8 encoding
- Limit text length per chunk

### Query Input Security

#### Validation:
```typescript
const MAX_QUERY_LENGTH = 1000;
const FORBIDDEN_PATTERNS = [
  /(?:SELECT|INSERT|UPDATE|DELETE|DROP)/i,  // SQL injection
  /<script>/i,                              // XSS
  /\.\.\//,                                 // Path traversal
];

function validateQuery(query: string): string {
  // Length check
  if (query.length > MAX_QUERY_LENGTH) {
    throw new Error('Query too long');
  }
  
  // Pattern check
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(query)) {
      throw new Error('Invalid query pattern');
    }
  }
  
  // Sanitize
  return query.trim();
}
```

## API Security

### Rate Limiting

#### Implementation (Nginx):
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/m;

location /api/rag/query {
    limit_req zone=api burst=20;
}

location /api/rag/upload {
    limit_req zone=upload burst=2;
}
```

#### Application-Level:
- 10 queries per minute per partner
- 5 uploads per hour per partner
- Track in Redis (future) or memory

### CORS Configuration
```typescript
// Next.js API Route
export const config = {
  api: {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ['POST', 'GET'],
      credentials: true,
    },
  },
};
```

### Error Handling
```typescript
// ❌ Bad
res.status(500).json({ error: error.stack });

// ✅ Good
res.status(500).json({ 
  error: 'Internal server error',
  code: 'INTERNAL_ERROR'
});

// Log full error server-side
logger.error('Upload failed', { error, partnerId, filename });
```

## Infrastructure Security

### Qdrant Security

#### Network Isolation:
- Bind to localhost only: --network host not used
- No external port exposure
- Docker network isolation

#### Access Control:
```bash
# Qdrant runs without authentication (safe because localhost)
# If exposing externally (DON'T), enable API keys:
docker run -e QDRANT__SERVICE__API_KEY=<secret> qdrant/qdrant
```

### Nginx Security

#### Configuration:
```nginx
# SSL/TLS
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Hide version
server_tokens off;

# Request size limits
client_max_body_size 11M;  # Slightly more than 10MB file limit
```

### System Security

#### File Permissions:
```bash
# Application directory
chmod 755 /home/user/customgpt-rag-platform
chown -R user:user /home/user/customgpt-rag-platform

# Qdrant data
chmod 700 ~/qdrant_storage
chown -R user:user ~/qdrant_storage

# Environment files
chmod 600 .env.local
```

#### Process Isolation:
- Next.js runs as non-root user
- Qdrant in Docker container
- No sudo access needed for app

## Secrets Management

### Environment Variables

#### Storage:
- .env.local - Not in git
- File permissions: 600 (owner read/write only)
- Backed up encrypted offline

#### Rotation Schedule:
- JWT_SECRET: Every 90 days
- CustomGPT API Key: Every 180 days or on breach
- SSL certificates: Auto-renewed (Let's Encrypt)

### Secret Generation
```bash
# JWT Secret (256-bit)
openssl rand -base64 32

# API Key rotation checklist:
# 1. Generate new key in CustomGPT dashboard
# 2. Update .env.local
# 3. Restart application
# 4. Verify functionality
# 5. Revoke old key
# 6. Update backup
```

## Incident Response

### Security Event Classification

#### Critical (P0):
- Data breach (partner data accessed by unauthorized party)
- System compromise (root access)
- API key leak

#### High (P1):
- Isolation bypass attempt
- DDoS attack
- Failed authentication spike

#### Medium (P2):
- Rate limit hit
- Invalid file upload attempts
- JWT validation failures

### Response Procedures

#### P0 - Critical:
1. Isolate affected systems
2. Rotate all secrets immediately
3. Notify affected partners
4. Preserve logs
5. Root cause analysis
6. Update security measures

#### P1 - High:
1. Enable aggressive rate limiting
2. Review logs
3. Block malicious IPs
4. Monitor for 24 hours

#### P2 - Medium:
1. Log event
2. Monitor patterns
3. Adjust thresholds if needed

## Compliance Considerations

### GDPR Compliance

#### Data Subject Rights:
- Right to access: API to retrieve partner's data
- Right to erasure: Delete partner's Qdrant collection
- Right to portability: Export embeddings and metadata

#### Data Processing:
- Partner data never used for model training
- CustomGPT.ai API: Verify DPA
- OpenAI embeddings: Check data usage policy

### Data Retention

#### Policy:
- Active partners: Data retained indefinitely
- Inactive partners (90 days): Delete collection
- Deleted accounts: Immediate collection deletion
- Logs: 30 days retention

## Security Checklist (Deployment)

- [ ] SSL/TLS certificates installed
- [ ] Nginx security headers configured
- [ ] JWT_SECRET is strong (256-bit)
- [ ] .env.local has 600 permissions
- [ ] Qdrant bound to localhost only
- [ ] Rate limiting enabled
- [ ] File upload validation working
- [ ] Error messages don't expose internals
- [ ] Logs configured properly
- [ ] Backup strategy defined
- [ ] Incident response plan documented
- [ ] Partner isolation tested
- [ ] Security monitoring in place
