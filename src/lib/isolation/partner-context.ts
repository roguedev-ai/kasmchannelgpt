import jwt from 'jsonwebtoken';
import { backendConfig } from '../config/backend';
import {
  PartnerSession,
  AuthenticationError,
  IsolationViolationError,
  ValidationError
} from '../../types/backend';

export class PartnerContextManager {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = backendConfig.jwtSecret;
    if (!this.jwtSecret || this.jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }
  }

  /**
   * Create a JWT token for a partner
   */
  createToken(partnerId: string, email: string): string {
    // Validate partnerId format (alphanumeric only)
    if (!/^[a-zA-Z0-9_-]+$/.test(partnerId)) {
      throw new ValidationError('Partner ID must be alphanumeric');
    }
    if (partnerId.length > 50) {
      throw new ValidationError('Partner ID too long (max 50 chars)');
    }

    // Compute namespace
    const namespace = this.computeNamespace(partnerId);

    // Create token payload
    const payload: PartnerSession = {
      partnerId,
      email,
      namespace,
      exp: Math.floor(Date.now() / 1000) + (backendConfig.jwtExpirationHours * 3600),
      iat: Math.floor(Date.now() / 1000),
    };

    // Sign token
    const token = jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256',
    });

    console.log(`[Auth] Created token for partner: ${partnerId}`);
    return token;
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): PartnerSession {
    try {
      // Verify signature and expiration
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as PartnerSession;

      // Additional validation
      if (!decoded.partnerId || !decoded.namespace) {
        throw new AuthenticationError('Invalid token payload');
      }

      // Verify namespace matches partnerId
      const expectedNamespace = this.computeNamespace(decoded.partnerId);
      if (decoded.namespace !== expectedNamespace) {
        throw new IsolationViolationError(
          `Namespace mismatch: expected ${expectedNamespace}, got ${decoded.namespace}`
        );
      }

      console.log(`[Auth] Verified token for partner: ${decoded.partnerId}`);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Compute the Qdrant collection name for a partner
   * This is the ONLY place namespace computation happens (security!)
   */
  private computeNamespace(partnerId: string): string {
    // Validate partnerId
    if (!partnerId || typeof partnerId !== 'string') {
      throw new ValidationError('Invalid partner ID');
    }

    // Sanitize (remove any special characters)
    const sanitized = partnerId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized !== partnerId) {
      throw new ValidationError('Partner ID contains invalid characters');
    }

    return `partner_${sanitized}`;
  }

  /**
   * Enforce that a requested namespace matches the partner's allowed namespace
   * Throws IsolationViolationError if mismatch
   */
  enforceIsolation(partnerId: string, requestedNamespace: string): void {
    const allowedNamespace = this.computeNamespace(partnerId);
    if (requestedNamespace !== allowedNamespace) {
      console.error(
        `[Security] ISOLATION VIOLATION ATTEMPT: Partner ${partnerId} ` +
        `tried to access namespace ${requestedNamespace} ` +
        `(allowed: ${allowedNamespace})`
      );

      throw new IsolationViolationError(
        'Access denied: Namespace mismatch'
      );
    }
  }

  /**
   * Extract partner context from Authorization header
   */
  extractFromHeader(authHeader: string | null): PartnerSession {
    if (!authHeader) {
      throw new AuthenticationError('Authorization header missing');
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError('Invalid authorization header format');
    }

    const token = parts[1];
    return this.verifyToken(token);
  }
}

// Singleton instance
export const partnerContext = new PartnerContextManager();
