interface Session {
  token: string;
  partnerId: string;
}

type SessionChangeCallback = () => void;

class SessionManager {
  private readonly TOKEN_KEY = 'customgpt_token';
  private readonly PARTNER_ID_KEY = 'customgpt_partner_id';
  private listeners: SessionChangeCallback[] = [];
  
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
    
    // Notify listeners
    this.notifyListeners();
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
    
    // Notify listeners
    this.notifyListeners();
  }
  
  hasValidSession(): boolean {
    return !!(this.getToken() && this.getPartnerId());
  }

  /**
   * Check if user is currently authenticated
   * @returns boolean indicating if both token and partnerId are set
   */
  isAuthenticated(): boolean {
    return this.hasValidSession();
  }

  /**
   * Subscribe to session changes
   * @param callback Function to call when session changes
   * @returns Cleanup function to unsubscribe
   */
  onSessionChange(callback: SessionChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Get current session information
   * @returns Object containing current token and partnerId
   */
  useSession(): { token: string | null; partnerId: string | null } {
    return {
      token: this.getToken(),
      partnerId: this.getPartnerId()
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
