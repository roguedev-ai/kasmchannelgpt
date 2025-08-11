/**
 * Demo Session Manager
 * 
 * Manages free trial session tracking and enforces usage limits.
 * Tracks projects, conversations, and messages created during the session.
 */

import { 
  FREE_TRIAL_LIMITS, 
  DEMO_STORAGE_KEYS,
  FreeTrialSession,
  isSessionExpired,
  getTimeRemaining,
  shouldShowWarning
} from '@/lib/constants/demo-limits';

export class DemoSessionManager {
  private static instance: DemoSessionManager | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private warningShown: boolean = false;

  private constructor() {
    // Start session monitoring
    this.startSessionMonitoring();
  }

  static getInstance(): DemoSessionManager {
    if (!DemoSessionManager.instance) {
      DemoSessionManager.instance = new DemoSessionManager();
    }
    return DemoSessionManager.instance;
  }

  /**
   * Get current free trial session data
   */
  getSession(): FreeTrialSession | null {
    if (typeof window === 'undefined') return null;
    
    const sessionData = sessionStorage.getItem(DEMO_STORAGE_KEYS.FREE_TRIAL_SESSION);
    if (!sessionData) return null;
    
    try {
      return JSON.parse(sessionData) as FreeTrialSession;
    } catch {
      return null;
    }
  }

  /**
   * Update session data
   */
  private updateSession(updates: Partial<FreeTrialSession>): void {
    const session = this.getSession();
    if (!session) return;
    
    const updatedSession = {
      ...session,
      ...updates,
      lastActivity: Date.now()
    };
    
    sessionStorage.setItem(DEMO_STORAGE_KEYS.FREE_TRIAL_SESSION, JSON.stringify(updatedSession));
  }

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    const session = this.getSession();
    if (!session) return true;
    
    return isSessionExpired(session.startTime, FREE_TRIAL_LIMITS.SESSION_DURATION);
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime(): number {
    const session = this.getSession();
    if (!session) return 0;
    
    return getTimeRemaining(session.startTime, FREE_TRIAL_LIMITS.SESSION_DURATION);
  }

  /**
   * Check if a resource limit has been reached
   */
  canCreate(resourceType: 'project' | 'conversation' | 'message'): boolean {
    const session = this.getSession();
    if (!session) return false;
    
    if (this.isExpired()) return false;
    
    switch (resourceType) {
      case 'project':
        return session.projectCount < FREE_TRIAL_LIMITS.MAX_PROJECTS;
      case 'conversation':
        return session.conversationCount < FREE_TRIAL_LIMITS.MAX_CONVERSATIONS;
      case 'message':
        return session.messageCount < FREE_TRIAL_LIMITS.MAX_MESSAGES_PER_CONVERSATION;
      default:
        return false;
    }
  }

  /**
   * Increment resource count
   */
  incrementCount(resourceType: 'project' | 'conversation' | 'message'): void {
    const session = this.getSession();
    if (!session) return;
    
    switch (resourceType) {
      case 'project':
        this.updateSession({ projectCount: session.projectCount + 1 });
        break;
      case 'conversation':
        this.updateSession({ conversationCount: session.conversationCount + 1 });
        break;
      case 'message':
        this.updateSession({ messageCount: session.messageCount + 1 });
        break;
    }
  }

  /**
   * Get limit reached message
   */
  getLimitMessage(resourceType: 'project' | 'conversation' | 'message'): string {
    return FREE_TRIAL_LIMITS.LIMIT_REACHED_MESSAGE[
      resourceType === 'project' ? 'projects' : 
      resourceType === 'conversation' ? 'conversations' : 
      'messages'
    ];
  }

  /**
   * Start monitoring session expiry
   */
  private startSessionMonitoring(): void {
    // Check every 30 seconds
    this.sessionCheckInterval = setInterval(() => {
      const session = this.getSession();
      if (!session) return;
      
      // Check if session expired
      if (this.isExpired()) {
        this.handleSessionExpiry();
        return;
      }
      
      // Check if should show warning
      if (!this.warningShown && shouldShowWarning(
        session.startTime, 
        FREE_TRIAL_LIMITS.SESSION_DURATION, 
        FREE_TRIAL_LIMITS.SESSION_WARNING_TIME
      )) {
        this.showExpiryWarning();
        this.warningShown = true;
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Show expiry warning
   */
  private showExpiryWarning(): void {
    // This will be replaced with a proper toast/notification
    console.warn(FREE_TRIAL_LIMITS.SESSION_EXPIRY_WARNING);
    
    // Dispatch custom event for UI components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freeTrialWarning', {
        detail: { message: FREE_TRIAL_LIMITS.SESSION_EXPIRY_WARNING }
      }));
    }
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpiry(): void {
    console.log('[DemoSessionManager] Free trial session expired');
    
    // Clear interval
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    
    // Dispatch expiry event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freeTrialExpired', {
        detail: { message: FREE_TRIAL_LIMITS.SESSION_EXPIRED_MESSAGE }
      }));
      
      // Clear session data
      sessionStorage.removeItem(DEMO_STORAGE_KEYS.FREE_TRIAL_SESSION);
      localStorage.removeItem(DEMO_STORAGE_KEYS.FREE_TRIAL_MODE);
      
      // Reload page to reset
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  /**
   * Clean up on page unload
   */
  cleanup(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

// Initialize singleton on module load
if (typeof window !== 'undefined') {
  const manager = DemoSessionManager.getInstance();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    manager.cleanup();
  });
}