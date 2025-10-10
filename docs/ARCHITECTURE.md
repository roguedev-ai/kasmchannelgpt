# CustomGPT Multi-Tenant RAG Platform - Architecture

## Overview
Privacy-preserving RAG system with strict partner data isolation using Qdrant vector database and CustomGPT.ai.

## System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────────┐
│                        INTERNET (HTTPS)                              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Port 443
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     NGINX REVERSE PROXY                              │
│  - SSL Termination                                                  │
│  - Rate Limiting                                                    │
│  - Request Logging                                                  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ localhost:3000
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  FRONTEND LAYER (React/TypeScript)                          │   │
│  │  - Chat Interface                                           │   │
│  │  - File Upload UI                                          │   │
│  │  - Partner Session Display                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                            │                                        │
│                            │ API Calls                             │
│                            ↓                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  API ROUTES LAYER (/app/api/rag/*)                          │   │
│  │  - /api/rag/upload  → File upload endpoint                  │   │
│  │  - /api/rag/query   → RAG query endpoint                    │   │
│  │  - /api/auth/login  → Authentication                        │   │
│  └──────────────────┬──────────────────────────────────────────┘   │
│                     │                                               │
│                     │ Calls isolation layer                        │
│                     ↓                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SECURITY/ISOLATION LAYER                                    │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │  Partner Context Manager                             │    │   │
│  │  │  - JWT Token Validation                              │    │   │
│  │  │  - Partner ID → Collection Mapping                   │    │   │
│  │  │  - Namespace Enforcement                             │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └──────────────────┬──────────────────────────────────────────┘   │
│                     │                                               │
│                     │ Enforced partner context                     │
│                     ↓                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  RAG ORCHESTRATION LAYER                                     │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │  File Processing Pipeline                            │    │   │
│  │  │  1. File validation & parsing                        │    │   │
│  │  │  2. Text extraction (PDF/DOCX/TXT)                   │    │   │
│  │  │  3. Chunking (1000 chars, 200 overlap)               │    │   │
│  │  │  4. Generate embeddings (OpenAI)                     │    │   │
│  │  │  5. Store in partner's Qdrant collection             │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │  Query Pipeline                                      │    │   │
│  │  │  1. Generate query embedding                         │    │   │
│  │  │  2. Search partner's collection ONLY                 │    │   │
│  │  │  3. Retrieve top-k relevant chunks                   │    │   │
│  │  │  4. Build context from retrieved docs                │    │   │
│  │  │  5. Send to CustomGPT with context                   │    │   │
│  │  │  6. Stream response back                             │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └──────────────────┬──────────────────────────────────────────┘   │
└────────────────────┼────────────────────────────────────────────────┘
                     │
┌────────────┴────────────┐
│                         │
↓                         ↓
┌──────────────────┐      ┌──────────────────┐
│  QDRANT          │      │  CUSTOMGPT.AI    │
│  localhost:6333  │      │  External API    │
│                  │      │                  │
│  Collections:    │      │  - GPT Model     │
│  ├─ partner_a    │      │  - Agent Logic   │
│  ├─ partner_b    │      │  - Streaming     │
│  └─ partner_c    │      └──────────────────┘
│                  │
│  🔒 ISOLATED     │
└──────────────────┘
```

## Security Model

### 1. Authentication & Authorization

**JWT-Based Session Management:**
- Partners authenticate with partnerId + email
- Server generates JWT token with:
  - partnerId
  - email
  - namespace (computed: partner_{partnerId})
  - expiration (24 hours)
- Token signed with JWT_SECRET
- All API requests require valid JWT in Authorization header

**Security Boundaries:**
```
Request → JWT Validation → Partner Context → Namespace Enforcement → Data Access
↓           ↓                ↓                   ↓                    ↓
401      if invalid        Maps to         Only allows         Isolated data
         token             collection      partner's namespace
```

### 2. Data Isolation Model

**Physical Isolation via Qdrant Collections:**
- Each partner gets dedicated Qdrant collection: `partner_{partnerId}`
- Collections are physically separate in Qdrant
- No shared data structures
- Cannot query across collections

**Isolation Enforcement Points:**
1. **API Layer:** JWT validates partner identity
2. **Context Manager:** Maps partnerId → collection name
3. **Qdrant Client:** Only accesses specified collection
4. **Query Pipeline:** Hardcoded to search single collection

**Attack Resistance:**
❌ Partner A cannot access Partner B's data because:
- JWT contains Partner A's ID
- Context manager computes: partner_a collection
- Qdrant query ONLY searches partner_a
- No way to specify different collection in request
- Collection name not exposed to frontend

### 3. Data Flow with Security Checkpoints

**File Upload Flow:**
```
Frontend → JWT token + file
API Route → Verify JWT ✓ (401 if invalid)
Context Manager → Extract partnerId ✓ (403 if mismatch)
Context Manager → Compute collection: partner_{id} ✓
File Processor → Parse file ✓
File Processor → Generate embeddings ✓
Qdrant Client → Store in partner_{id} collection ✓ (isolated)
Response → Success (no collection name exposed)
```

**Query Flow:**
```
Frontend → JWT token + query
API Route → Verify JWT ✓ (401 if invalid)
Context Manager → Extract partnerId ✓ (403 if mismatch)
Context Manager → Compute collection: partner_{id} ✓
Query Pipeline → Generate embedding ✓
Qdrant Client → Search ONLY partner_{id} collection ✓ (isolated)
Query Pipeline → Retrieve relevant chunks ✓
CustomGPT Client → Send context + query ✓
Response → Stream answer back ✓
```

## Technology Stack

### Frontend:
- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- React Hooks for state management

### Backend:
- Next.js API Routes (serverless functions)
- LangChain (RAG orchestration)
- Qdrant (vector database)
- OpenAI (embeddings: text-embedding-3-small)
- CustomGPT.ai (LLM responses)

### Infrastructure:
- Qdrant Docker container
- Nginx reverse proxy
- SSL/TLS encryption
- Ubuntu server (agent-01)

## Data Models

### Partner Session (JWT Payload):
```typescript
{
  partnerId: string;    // e.g., "partner_a"
  email: string;        // e.g., "john@company.com"
  namespace: string;    // e.g., "partner_a" (computed)
  exp: number;          // Unix timestamp
  iat: number;          // Unix timestamp
}
```

### Document Chunk (Qdrant):
```typescript
{
  id: string;              // UUID
  vector: number[];        // 1536-dim embedding
  payload: {
    text: string;          // Chunk content
    filename: string;      // Original file
    partnerId: string;     // Owner
    uploadedAt: string;    // ISO timestamp
    chunkIndex: number;    // Position in document
  }
}
```

### Query Request:
```typescript
{
  query: string;           // User's question
  partnerId: string;       // From JWT
  conversationId?: string; // Optional context
}
```

### Query Response:
```typescript
{
  answer: string;          // CustomGPT response
  sources: Array<{
    text: string;          // Relevant chunk
    filename: string;      // Source document
    score: number;         // Similarity score
  }>;
  conversationId: string;  // For follow-ups
}
```

## Scalability Considerations

### Current Capacity:
- Single Qdrant instance on agent-01
- Handles ~100 partners, ~10GB vectors
- ~1000 queries/day

### Future Scaling:
- Qdrant cluster (horizontal scaling)
- Multiple Next.js instances (load balanced)
- Redis for session caching
- Separate worker processes for file uploads

## Deployment Architecture

### agent-01 Server:
```
├── /home/user/customgpt-rag-platform/  (Next.js app)
├── ~/qdrant_storage/                   (Qdrant data)
├── Docker (Qdrant container)
└── Nginx (reverse proxy)
```

### Ports:
- 443: Nginx (public)
- 3000: Next.js (localhost only)
- 6333: Qdrant (localhost only)

## Monitoring & Logging

### Application Logs:
- Next.js logs: .next/server.log
- API request logs: Custom middleware
- Error tracking: Console errors

### System Monitoring:
- Qdrant health: curl http://localhost:6333/
- Next.js health: curl http://localhost:3000/api/health
- Disk usage: Monitor ~/qdrant_storage/

### Alerts:
- Qdrant down
- Disk space > 80%
- API error rate > 5%
