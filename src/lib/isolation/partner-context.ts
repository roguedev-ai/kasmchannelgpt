import jwt from 'jsonwebtoken';
import { backendConfig } from '../config/backend';
import { db, User } from '../database/client';
import { AuthenticationError, PartnerSession } from '../../types/backend';

export class PartnerContextManager {
  /**
   * Create a JWT token for a partner
   */
  createToken(partnerId: string, email: string): string {
    const payload: PartnerSession = {
      user: {
        id: `user_${Date.now()}`, // Mock user ID
        partner_id: partnerId,
        email: email,
        name: email.split('@')[0], // Mock name from email
      },
      token: '', // Will be set after signing
      expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(), // 24 hours
    };
    
    // Sign token
    const token = jwt.sign(payload, backendConfig.jwtSecret || 'dev-secret', {
      expiresIn: '24h',
    });
    
    // Update token in payload
    payload.token = token;
    
    return token;
  }
  
  /**
   * Verify a JWT token and return the partner session
   */
  async verifyTokenWithDatabase(token: string): Promise<PartnerSession> {
    if (!token) {
      throw new AuthenticationError('No token provided');
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, backendConfig.jwtSecret || 'dev-secret') as PartnerSession;
      
      // For now, just return the decoded session since we're using mock data
      return decoded;
      
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }
}

// Export singleton instance
export const partnerContext = new PartnerContextManager();
