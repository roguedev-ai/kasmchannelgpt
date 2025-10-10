# Testing Guide

## Prerequisites

- Qdrant running on localhost:6333
- All environment variables set in `.env.local`
- Application built: `npm run build`

## Unit Tests

### 1. Test Partner Context Manager
```bash
npx ts-node -e "
import { partnerContext } from './src/lib/isolation/partner-context';
const token = partnerContext.createToken('test_partner', 'test@example.com');
console.log('Token created:', token);
const decoded = partnerContext.verifyToken(token);
console.log('Token verified:', decoded);
"
```

### 2. Test Qdrant Connection
```bash
npx ts-node scripts/test-qdrant.ts
```

### 3. Test File Upload
```bash
npx ts-node scripts/test-upload.ts
```

## Integration Tests

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```
Expected: `{"status":"healthy",...}`

### 2. Authentication
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"partnerId":"partner_a","email":"test@example.com"}'
```
Expected: JWT token in response

### 3. File Upload
```bash
TOKEN="<your-jwt-token>"
curl -X POST http://localhost:3000/api/rag/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.txt"
```
Expected: Success with chunk count

### 4. Query
```bash
TOKEN="<your-jwt-token>"
curl -X POST http://localhost:3000/api/rag/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is this document about?"}'
```
Expected: Answer with sources

## End-to-End Test

1. Open http://localhost:3000
2. Login as partner_a with email test_a@example.com
3. Upload a test document (PDF/DOCX/TXT)
4. Wait for upload to complete
5. Ask a question about the document
6. Verify response includes relevant information
7. Logout
8. Login as partner_b with email test_b@example.com
9. Verify partner_b cannot see partner_a's documents
10. Upload a different document
11. Query and verify isolation

## Security Tests

### Test 1: Invalid Token
```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'
```
Expected: 401 Unauthorized

### Test 2: Expired Token
1. Create token with past expiration
2. Attempt to use
Expected: 401 Unauthorized

### Test 3: Cross-Partner Access
1. Login as partner_a, get token
2. Manually decode token, change partnerId to partner_b
3. Attempt to query
Expected: Should fail signature verification

## Performance Tests

### Upload Performance
- Small file (< 1MB): Should complete in < 5 seconds
- Medium file (1-5MB): Should complete in < 15 seconds
- Large file (5-10MB): Should complete in < 30 seconds

### Query Performance
- Simple query: Should respond in < 2 seconds
- Complex query: Should respond in < 5 seconds

## Troubleshooting

### Issue: Qdrant connection failed
- Check: `docker ps | grep qdrant`
- Fix: `docker start qdrant`

### Issue: JWT validation failed
- Check: JWT_SECRET is set and correct
- Fix: Regenerate JWT_SECRET, restart app

### Issue: Upload fails
- Check: File size < 10MB
- Check: File type is PDF/DOCX/TXT
- Check: Temp directory is writable

### Issue: Query returns no sources
- Check: Documents are uploaded
- Check: Qdrant collection exists
- Check: Embeddings were generated

## Deployment Checklist

### 1. Environment Setup
- [ ] Set all required environment variables
- [ ] Configure CORS settings
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting

### 2. Database Setup
- [ ] Deploy Qdrant instance
- [ ] Configure backups
- [ ] Set up monitoring
- [ ] Test replication if needed

### 3. Application Deployment
- [ ] Build application: `npm run build`
- [ ] Test production build locally
- [ ] Deploy to production server
- [ ] Configure reverse proxy
- [ ] Set up health monitoring

### 4. Security Verification
- [ ] Run security tests
- [ ] Check SSL configuration
- [ ] Verify JWT settings
- [ ] Test partner isolation
- [ ] Configure logging

### 5. Performance Verification
- [ ] Run load tests
- [ ] Monitor response times
- [ ] Check resource usage
- [ ] Test auto-scaling

### 6. Monitoring Setup
- [ ] Configure error alerts
- [ ] Set up performance monitoring
- [ ] Enable security alerts
- [ ] Configure backup alerts

## Regular Maintenance

### Daily
- Check error logs
- Monitor system health
- Review security alerts

### Weekly
- Review performance metrics
- Check backup status
- Update security patches

### Monthly
- Rotate access keys
- Review partner usage
- Update documentation
- Test disaster recovery
