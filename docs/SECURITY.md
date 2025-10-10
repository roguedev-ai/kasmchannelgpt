# Security Guide

## Authentication System

### Password Security
- Passwords are hashed using bcrypt
- Salt rounds: 10 (configurable)
- No plain-text storage
- Minimum length enforced
- Complexity requirements recommended

### JWT Implementation
- Signed with HS256
- Required claims: partnerId, email, namespace
- Expiration enforced
- Token refresh flow available
- Blacklisting supported via sessions table

### Session Management
- JWT-based stateless auth
- Optional session tracking
- IP and user agent logging
- Automatic expiration
- Manual revocation support

## Partner Isolation

### Data Segregation
- Unique partner namespaces
- Isolated document storage
- Separate vector collections
- Cross-partner access prevented
- Audit logging of all operations

### Access Control
- Role-based permissions (admin/partner)
- Token validation on every request
- Active status checking
- Resource ownership verification
- Audit trail for all actions

## API Security

### Rate Limiting
```nginx
# API endpoints
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# File uploads
limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/m;

# Apply limits
location /api/rag/query {
    limit_req zone=api burst=20 nodelay;
}

location /api/rag/upload {
    limit_req zone=upload burst=2 nodelay;
}
```

### CORS Configuration
```typescript
// Allowed methods
'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'

// Required headers
'Access-Control-Allow-Headers': 'Content-Type, Authorization'

// Origin handling
'Access-Control-Allow-Origin': '*' // Configure for production
```

### Input Validation
- Request body validation
- File type checking
- Size limits enforced
- SQL injection prevention
- XSS protection headers

## Database Security

### SQLite Configuration
- WAL journal mode
- Secure file permissions
- Regular backups
- Integrity checks
- Transaction safety

### Query Safety
- Prepared statements
- Parameter binding
- Input sanitization
- Error handling
- Transaction rollback

## Audit System

### Logged Events
- Authentication attempts
- File uploads
- Document queries
- Admin operations
- System changes

### Log Format
```typescript
interface AuditLog {
  user_id: number;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  created_at: string;
}
```

### Audit Retention
- Configurable retention period
- Secure storage
- Tamper detection
- Export capability
- Analysis tools

## Production Hardening

### SSL/TLS
1. Install certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obtain certificate:
   ```bash
   sudo ./scripts/setup-ssl.sh
   ```

3. Configure Nginx:
   ```bash
   sudo ./scripts/deploy.sh
   # Choose 'y' when asked about Nginx
   ```

### Nginx Security
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000" always;

# Hide server info
server_tokens off;

# File upload limits
client_max_body_size 11M;
```

### System Hardening
1. Update system packages
2. Configure firewall
3. Set up monitoring
4. Enable automatic updates
5. Configure backup system

## Security Checklist

### Initial Setup
- [ ] Change default admin password
- [ ] Configure SSL certificates
- [ ] Set secure file permissions
- [ ] Configure environment variables
- [ ] Set up monitoring

### Regular Maintenance
- [ ] Review access logs
- [ ] Check audit trail
- [ ] Update dependencies
- [ ] Rotate access keys
- [ ] Test backups

### Incident Response
1. Detect
   - Monitor logs
   - Check alerts
   - Review metrics

2. Analyze
   - Review audit trail
   - Check access logs
   - Verify integrity

3. Respond
   - Block access
   - Reset tokens
   - Update systems
   - Notify users

4. Recover
   - Restore backups
   - Update security
   - Document incident
   - Implement fixes

## Security Contacts

For security issues:
1. Create private issue
2. Email security@example.com
3. Include detailed report
4. Await acknowledgment

Response times:
- Critical: 24 hours
- High: 48 hours
- Medium: 72 hours
- Low: 1 week
