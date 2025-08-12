/**
 * Usage Analytics Tracker
 * 
 * Tracks usage across different deployment modes and sends analytics
 * to your backend for monitoring and analysis.
 */

import { DEMO_STORAGE_KEYS } from '@/lib/constants/demo-limits';

export interface UsageEvent {
  // Event identification
  eventType: 'api_call' | 'session_start' | 'session_end' | 'limit_reached' | 'error';
  eventName: string;
  timestamp: number;
  
  // Deployment information
  deploymentMode: 'production' | 'demo';
  demoType?: 'free-trial' | 'user-api-key' | 'none';
  
  // Session information
  sessionId?: string;
  userId?: string; // If available from your auth system
  
  // Request details
  endpoint?: string;
  method?: string;
  statusCode?: number;
  
  // Usage metrics
  projectCount?: number;
  conversationCount?: number;
  messageCount?: number;
  
  // Client information
  clientVersion?: string;
  userAgent?: string;
  referrer?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

class UsageTracker {
  private static instance: UsageTracker;
  private analyticsEndpoint: string = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics';
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private eventQueue: UsageEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Start flush timer
    this.startFlushTimer();
  }

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  /**
   * Track a usage event
   */
  track(event: Partial<UsageEvent>): void {
    const fullEvent: UsageEvent = {
      eventType: event.eventType || 'api_call',
      eventName: event.eventName || 'unknown',
      timestamp: Date.now(),
      deploymentMode: this.getDeploymentMode(),
      demoType: this.getDemoType(),
      sessionId: this.getSessionId(),
      clientVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      ...event
    };

    this.eventQueue.push(fullEvent);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Track API call
   */
  trackApiCall(endpoint: string, method: string, statusCode?: number): void {
    this.track({
      eventType: 'api_call',
      eventName: `${method} ${endpoint}`,
      endpoint,
      method,
      statusCode
    });
  }

  /**
   * Track session start
   */
  trackSessionStart(): void {
    this.track({
      eventType: 'session_start',
      eventName: 'session_started',
      metadata: {
        mode: this.getDemoType() || 'production'
      }
    });
  }

  /**
   * Track session end
   */
  trackSessionEnd(reason?: string): void {
    this.track({
      eventType: 'session_end',
      eventName: 'session_ended',
      metadata: {
        reason,
        mode: this.getDemoType() || 'production'
      }
    });
  }

  /**
   * Track limit reached
   */
  trackLimitReached(limitType: 'projects' | 'conversations' | 'messages'): void {
    this.track({
      eventType: 'limit_reached',
      eventName: `${limitType}_limit_reached`,
      metadata: {
        limitType
      }
    });
  }

  /**
   * Track error
   */
  trackError(error: string, context?: any): void {
    this.track({
      eventType: 'error',
      eventName: 'error_occurred',
      metadata: {
        error,
        context
      }
    });
  }

  /**
   * Get deployment mode
   */
  private getDeploymentMode(): 'production' | 'demo' {
    if (typeof window === 'undefined') return 'production';
    
    const mode = localStorage.getItem(DEMO_STORAGE_KEYS.DEPLOYMENT_MODE);
    return mode === 'demo' ? 'demo' : 'production';
  }

  /**
   * Get demo type
   */
  private getDemoType(): 'free-trial' | 'user-api-key' | 'none' {
    if (typeof window === 'undefined') return 'none';
    
    const deploymentMode = localStorage.getItem(DEMO_STORAGE_KEYS.DEPLOYMENT_MODE);
    if (deploymentMode !== 'demo') return 'none';
    
    const isFreeTrialMode = localStorage.getItem(DEMO_STORAGE_KEYS.FREE_TRIAL_MODE) === 'true';
    return isFreeTrialMode ? 'free-trial' : 'user-api-key';
  }

  /**
   * Get session ID
   */
  private getSessionId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    // Try to get from session storage (for free trial)
    const sessionData = sessionStorage.getItem(DEMO_STORAGE_KEYS.FREE_TRIAL_SESSION);
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        return session.sessionId;
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // Try to get from regular demo session
    const demoSession = sessionStorage.getItem(DEMO_STORAGE_KEYS.DEMO_SESSION);
    if (demoSession) {
      try {
        const session = JSON.parse(demoSession);
        return session.sessionId;
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    return undefined;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * Flush events to backend
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // If you have a custom analytics endpoint, send the data there
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        await fetch(this.analyticsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
        });
      } else {
        // Otherwise, just log to console for now
        console.log('[UsageTracker] Analytics events:', events);
      }
    } catch (error) {
      console.error('[UsageTracker] Failed to send analytics:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Force flush all pending events
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }
}

// Export singleton instance
export const usageTracker = UsageTracker.getInstance();

// Add event listeners for automatic tracking
if (typeof window !== 'undefined') {
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      usageTracker.forceFlush();
    }
  });
  
  // Track before unload
  window.addEventListener('beforeunload', () => {
    usageTracker.forceFlush();
  });
}