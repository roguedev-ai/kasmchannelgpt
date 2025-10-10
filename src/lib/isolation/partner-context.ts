import jwt from 'jsonwebtoken';
import { backendConfig } from '../config/backend';
import { db, User } from '../database/client';
import { AuthenticationError, PartnerSession } from '../../types/backend';

export class PartnerContextManager {
  /**
   * Create JWT token from partner ID and email
   */
  createToken(partnerId: string, email: string): string {
    const payload: PartnerSession = {
      partnerId,
      email,
      namespace: this.computeNamespace(partnerId),
      exp: Math.floor(Date.now() / 1000) + (backendConfig.jwtExpirationHours * 3600),
      iat: Math.floor(Date.now() / 1000),
    };
    
    return jwt.sign(payload, backendConfig.jwtSecret);
  }
  
  /**
   * Create token from authenticated user
   */
  createTokenFromUser(user: User): string {
    return this.createToken(user.partner_id, user.email);
  }
  
  /**
   * Verify JWT token
   */
  verifyToken(token: string): PartnerSession {
    try {
      return jwt.verify(token, backendConfig.jwtSecret) as PartnerSession;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
  
  /**
   * Verify token and check if user still exists and is active
   */
  verifyTokenWithDatabase(token: string): { session: PartnerSession; user: User } {
    // Verify JWT
    const session = this.verifyToken(token);
    
    // Check user still exists and is active
    const user = db.getUserByPartnerId(session.partnerId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    if (!user.is_active) {
      throw new AuthenticationError('User is deactivated');
    }
    
    return { session, user };
  }
  
  /**
   * Extract token from Authorization header
   */
  extractFromHeader(authHeader?: string | null): PartnerSession {
    if (!authHeader) {
      throw new AuthenticationError('No authorization header');
    }
    
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer') {
      throw new AuthenticationError('Invalid authorization type');
    }
    
    if (!token) {
      throw new AuthenticationError('No token provided');
    }
    
    return this.verifyToken(token);
  }
  
  /**
   * Compute namespace from partner ID
   */
  computeNamespace(partnerId: string): string {
    return `partner_${partnerId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }
  
  /**
   * Get namespace from token
   */
  getNamespace(partnerId: string): string {
    return this.computeNamespace(partnerId);
  }
}

// Export singleton instance
export const partnerContext = new PartnerContextManager();
