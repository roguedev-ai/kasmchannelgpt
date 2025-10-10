interface Session {
  token: string;
  partnerId: string;
}

class SessionManager {
  private readonly TOKEN_KEY = 'customgpt_token';
  private readonly PARTNER_ID_KEY = 'customgpt_partner_id';
  
  constructor() {
    // Initialize if in browser environment
    if (typeof window !== 'undefined') {
      console.log('[Session] Initialized session manager');
    }
  }
  
  setSession(token: string, partnerId: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.PARTNER_ID_KEY, partnerId);
    console.log(`[Session] Stored session for partner: ${partnerId}`);
  }
  
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  getPartnerId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.PARTNER_ID_KEY);
  }
  
  clearSession(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.PARTNER_ID_KEY);
    console.log('[Session] Cleared session');
  }
  
  hasValidSession(): boolean {
    return !!(this.getToken() && this.getPartnerId());
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
