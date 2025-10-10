/**
 * Partner Session Manager
 * 
 * Manages authentication state for partner sessions in memory.
 * Thread-safe singleton implementation for React components.
 * 
 * Security note: Tokens are stored in memory only, not in localStorage,
 * to prevent XSS attacks from accessing sensitive credentials.
 */

import { logger } from '../logger';

interface SessionData {
  token: string;
  partnerId: string;
  createdAt: number;
}

export class PartnerSessionManager {
  private session: SessionData | null = null;
  private readonly eventTarget: EventTarget;
  private static instance: PartnerSessionManager;

  private constructor() {
    // Create event target for session change notifications
    this.eventTarget = new EventTarget();
    logger.info('SESSION', 'Partner Session Manager initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PartnerSessionManager {
    if (!PartnerSessionManager.instance) {
      PartnerSessionManager.instance = new PartnerSessionManager();
    }
    return PartnerSessionManager.instance;
  }

  /**
   * Set active session
   * @param token JWT token
   * @param partnerId Partner identifier
   */
  public setSession(token: string, partnerId: string): void {
    if (!token || !partnerId) {
      throw new Error('Invalid session data: token and partnerId are required');
    }

    this.session = {
      token,
      partnerId,
      createdAt: Date.now()
    };

    logger.info('SESSION', 'Session established', { partnerId });
    
    // Notify listeners of session change
    this.eventTarget.dispatchEvent(new CustomEvent('sessionChange', {
      detail: { type: 'set', partnerId }
    }));
  }

  /**
   * Get current session token
   * @returns JWT token or null if not authenticated
   */
  public getToken(): string | null {
    return this.session?.token || null;
  }

  /**
   * Get current partner ID
   * @returns Partner ID or null if not authenticated
   */
  public getPartnerId(): string | null {
    return this.session?.partnerId || null;
  }

  /**
   * Clear current session
   */
  public clearSession(): void {
    const partnerId = this.session?.partnerId;
    this.session = null;
    
    logger.info('SESSION', 'Session cleared', { partnerId });
    
    // Notify listeners of session change
    this.eventTarget.dispatchEvent(new CustomEvent('sessionChange', {
      detail: { type: 'clear', partnerId }
    }));
  }

  /**
   * Check if user is currently authenticated
   * @returns true if valid session exists
   */
  public isAuthenticated(): boolean {
    return this.session !== null;
  }

  /**
   * Get session creation timestamp
   * @returns timestamp or null if no session
   */
  public getSessionCreatedAt(): number | null {
    return this.session?.createdAt || null;
  }

  /**
   * Subscribe to session changes
   * @param callback Function to call on session changes
   * @returns Cleanup function to unsubscribe
   */
  public onSessionChange(callback: (event: CustomEvent) => void): () => void {
    const handler = (event: Event) => {
      callback(event as CustomEvent);
    };
    
    this.eventTarget.addEventListener('sessionChange', handler);
    
    // Return cleanup function
    return () => {
      this.eventTarget.removeEventListener('sessionChange', handler);
    };
  }

  /**
   * React hook for session state
   * @returns Object containing session state and management functions
   */
  public useSession() {
    return {
      isAuthenticated: this.isAuthenticated(),
      token: this.getToken(),
      partnerId: this.getPartnerId(),
      createdAt: this.getSessionCreatedAt(),
      clearSession: () => this.clearSession(),
      setSession: (token: string, partnerId: string) => this.setSession(token, partnerId)
    };
  }
}

// Export singleton instance
export const sessionManager = PartnerSessionManager.getInstance();

// Example usage in React components:
/*
import { sessionManager } from './partner-session';

// Function component
function MyComponent() {
  const { isAuthenticated, partnerId } = sessionManager.useSession();
  
  useEffect(() => {
    // Subscribe to session changes
    const cleanup = sessionManager.onSessionChange((event) => {
      console.log('Session changed:', event.detail);
    });
    
    return cleanup; // Cleanup on unmount
  }, []);

  return isAuthenticated ? <div>Logged in as {partnerId}</div> : <div>Not logged in</div>;
}

// Login handler
function handleLogin(token: string, partnerId: string) {
  sessionManager.setSession(token, partnerId);
}

// Logout handler
function handleLogout() {
  sessionManager.clearSession();
}
*/
