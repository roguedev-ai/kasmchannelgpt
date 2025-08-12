/**
 * Rate Limit Handler for Demo Mode
 * 
 * Implements client-side rate limiting to prevent hitting CustomGPT's rate limits
 */

interface RateLimitInfo {
  endpoint: string;
  lastRequest: number;
  requestCount: number;
  windowStart: number;
}

class RateLimitHandler {
  private limits: Map<string, RateLimitInfo> = new Map();
  
  // Rate limit configuration (requests per minute)
  private readonly RATE_LIMITS = {
    '/conversations': 10, // 10 conversation creations per minute
    '/messages': 30,      // 30 messages per minute
    '/projects': 5,       // 5 project operations per minute
    'default': 60         // 60 requests per minute for other endpoints
  };
  
  // Minimum delay between requests (ms)
  private readonly MIN_DELAY = 1000; // 1 second between requests
  
  canMakeRequest(endpoint: string): { allowed: boolean; waitTime?: number } {
    const now = Date.now();
    const limit = this.getRateLimit(endpoint);
    const info = this.limits.get(endpoint);
    
    if (!info) {
      // First request for this endpoint
      this.limits.set(endpoint, {
        endpoint,
        lastRequest: now,
        requestCount: 1,
        windowStart: now
      });
      return { allowed: true };
    }
    
    // Check minimum delay
    const timeSinceLastRequest = now - info.lastRequest;
    if (timeSinceLastRequest < this.MIN_DELAY) {
      return { 
        allowed: false, 
        waitTime: this.MIN_DELAY - timeSinceLastRequest 
      };
    }
    
    // Check rate limit window (1 minute)
    const windowElapsed = now - info.windowStart;
    if (windowElapsed >= 60000) {
      // Reset window
      info.windowStart = now;
      info.requestCount = 1;
      info.lastRequest = now;
      return { allowed: true };
    }
    
    // Check if under rate limit
    if (info.requestCount < limit) {
      info.requestCount++;
      info.lastRequest = now;
      return { allowed: true };
    }
    
    // Calculate wait time until window resets
    const waitTime = 60000 - windowElapsed;
    return { allowed: false, waitTime };
  }
  
  recordRequest(endpoint: string) {
    const info = this.limits.get(endpoint);
    if (info) {
      info.lastRequest = Date.now();
    }
  }
  
  private getRateLimit(endpoint: string): number {
    // Extract base endpoint
    const baseEndpoint = endpoint.split('/').slice(0, 2).join('/');
    return this.RATE_LIMITS[baseEndpoint as keyof typeof this.RATE_LIMITS] || this.RATE_LIMITS.default;
  }
  
  reset() {
    this.limits.clear();
  }
}

// Export singleton instance
export const rateLimitHandler = new RateLimitHandler();

// Helper function to wait
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}