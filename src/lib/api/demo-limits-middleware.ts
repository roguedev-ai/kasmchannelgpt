/**
 * Demo Limits Middleware
 * 
 * Enforces usage limits for free trial mode by intercepting API requests
 * and tracking resource creation per session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  FREE_TRIAL_LIMITS, 
  DEMO_API_HEADERS,
  FreeTrialSession,
  DEMO_STORAGE_KEYS
} from '@/lib/constants/demo-limits';

interface SessionResource {
  type: 'project' | 'conversation' | 'message';
  id: string;
  createdAt: number;
  conversationId?: string; // For tracking messages per conversation
}

interface SessionTracking {
  sessionId: string;
  sessionStartTime: number;
  resources: SessionResource[];
  messageCountByConversation: Record<string, number>;
  lastRequestTime: number;
}

// In-memory session tracking (in production, use Redis or similar)
const sessionTracker = new Map<string, SessionTracking>();

/**
 * Clean up old sessions (run periodically)
 */
function cleanupOldSessions() {
  const now = Date.now();
  const maxAge = FREE_TRIAL_LIMITS.SESSION_DURATION + 60000; // Add 1 minute buffer
  
  for (const [sessionId, tracking] of sessionTracker.entries()) {
    if (now - tracking.lastRequestTime > maxAge) {
      sessionTracker.delete(sessionId);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof global !== 'undefined' && !(global as any).demoCleanupInterval) {
  (global as any).demoCleanupInterval = setInterval(cleanupOldSessions, 5 * 60 * 1000);
}

/**
 * Get or create session tracking
 */
function getSessionTracking(sessionId: string): SessionTracking {
  let tracking = sessionTracker.get(sessionId);
  if (!tracking) {
    const now = Date.now();
    tracking = {
      sessionId,
      sessionStartTime: now,
      resources: [],
      messageCountByConversation: {},
      lastRequestTime: now
    };
    sessionTracker.set(sessionId, tracking);
  }
  tracking.lastRequestTime = Date.now();
  return tracking;
}

/**
 * Check if request is for free trial mode
 */
export function isFreeTrialRequest(request: NextRequest): boolean {
  return request.headers.get(DEMO_API_HEADERS.FREE_TRIAL) === 'true';
}

/**
 * Get session ID from request
 */
function getSessionId(request: NextRequest): string | null {
  // Try to get from header first
  const sessionId = request.headers.get(DEMO_API_HEADERS.SESSION_ID);
  if (sessionId) return sessionId;
  
  // Try to extract from cookies or generate one
  const cookies = request.cookies;
  const cookieSessionId = cookies.get('demo_session_id')?.value;
  if (cookieSessionId) return cookieSessionId;
  
  // Generate new session ID if none exists
  return `trial_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Check rate limiting
 */
function checkRateLimit(tracking: SessionTracking): boolean {
  const now = Date.now();
  const lastRequest = tracking.lastRequestTime || 0;
  
  // Check cooldown between messages
  if (now - lastRequest < FREE_TRIAL_LIMITS.COOLDOWN_BETWEEN_MESSAGES) {
    return false;
  }
  
  return true;
}

/**
 * Count resources by type
 */
function countResources(tracking: SessionTracking, type: 'project' | 'conversation'): number {
  return tracking.resources.filter(r => r.type === type).length;
}

/**
 * Count messages for a specific conversation
 */
function countMessagesInConversation(tracking: SessionTracking, conversationId: string): number {
  return tracking.messageCountByConversation[conversationId] || 0;
}

/**
 * Main middleware function to enforce demo limits
 */
export async function enforceDemoLimits(
  request: NextRequest,
  apiPath: string
): Promise<NextResponse | null> {
  // Only apply to free trial requests
  if (!isFreeTrialRequest(request)) {
    return null; // Continue to normal processing
  }
  
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
  
  const tracking = getSessionTracking(sessionId);
  const method = request.method;
  
  // Check if session has expired (30 minutes)
  const elapsed = Date.now() - tracking.sessionStartTime;
  if (elapsed >= FREE_TRIAL_LIMITS.SESSION_DURATION) {
    return NextResponse.json(
      { error: 'Your free trial session has expired. Please start a new session.' },
      { status: 403 }
    );
  }
  
  // Block all DELETE operations in free trial
  if (method === 'DELETE') {
    return NextResponse.json(
      { error: 'Delete operations are not allowed in free trial mode' },
      { status: 403 }
    );
  }
  
  // Block settings updates
  if ((method === 'PUT' || method === 'PATCH') && apiPath.includes('/settings')) {
    return NextResponse.json(
      { error: 'Settings changes are not allowed in free trial mode' },
      { status: 403 }
    );
  }
  
  // Check rate limiting for all POST requests
  if (method === 'POST' && !checkRateLimit(tracking)) {
    return NextResponse.json(
      { error: 'Please wait a moment before making another request' },
      { status: 429 }
    );
  }
  
  // Handle specific endpoints
  if (method === 'POST') {
    // Create project
    if (apiPath === '/projects' || apiPath === '/projects/') {
      const projectCount = countResources(tracking, 'project');
      if (projectCount >= FREE_TRIAL_LIMITS.MAX_PROJECTS) {
        return NextResponse.json(
          { error: FREE_TRIAL_LIMITS.LIMIT_REACHED_MESSAGE.projects },
          { status: 403 }
        );
      }
    }
    
    // Create conversation
    if (apiPath === '/conversations' || apiPath === '/conversations/') {
      const conversationCount = countResources(tracking, 'conversation');
      if (conversationCount >= FREE_TRIAL_LIMITS.MAX_CONVERSATIONS) {
        return NextResponse.json(
          { error: FREE_TRIAL_LIMITS.LIMIT_REACHED_MESSAGE.conversations },
          { status: 403 }
        );
      }
    }
    
    // Send message
    const messageMatch = apiPath.match(/^\/conversations\/([^\/]+)\/message\/?$/);
    if (messageMatch) {
      const conversationId = messageMatch[1];
      const messageCount = countMessagesInConversation(tracking, conversationId);
      
      if (messageCount >= FREE_TRIAL_LIMITS.MAX_MESSAGES_PER_CONVERSATION) {
        return NextResponse.json(
          { error: FREE_TRIAL_LIMITS.LIMIT_REACHED_MESSAGE.messages },
          { status: 403 }
        );
      }
    }
  }
  
  // Block file uploads in free trial
  if (apiPath.includes('/upload') || apiPath.includes('/sources')) {
    if (!FREE_TRIAL_LIMITS.ALLOW_FILE_UPLOAD) {
      return NextResponse.json(
        { error: 'File uploads are not allowed in free trial mode' },
        { status: 403 }
      );
    }
  }
  
  // Block voice endpoints if not allowed
  if (apiPath.includes('/voice') && !FREE_TRIAL_LIMITS.ALLOW_VOICE_MODE) {
    return NextResponse.json(
      { error: 'Voice features are not available in free trial mode' },
      { status: 403 }
    );
  }
  
  return null; // Continue to normal processing
}

/**
 * Track resource creation (call this after successful creation)
 */
export function trackResourceCreation(
  sessionId: string,
  resourceType: 'project' | 'conversation' | 'message',
  resourceId: string,
  conversationId?: string
): void {
  const tracking = getSessionTracking(sessionId);
  
  // Add to resources list
  tracking.resources.push({
    type: resourceType,
    id: resourceId,
    createdAt: Date.now(),
    conversationId
  });
  
  // Track messages per conversation
  if (resourceType === 'message' && conversationId) {
    tracking.messageCountByConversation[conversationId] = 
      (tracking.messageCountByConversation[conversationId] || 0) + 1;
  }
}

/**
 * Get resources created in a session (for cleanup)
 */
export function getSessionResources(sessionId: string): SessionResource[] {
  const tracking = sessionTracker.get(sessionId);
  return tracking?.resources || [];
}

/**
 * Clear session tracking
 */
export function clearSessionTracking(sessionId: string): void {
  sessionTracker.delete(sessionId);
}

/**
 * Get current usage stats for a session
 */
export function getSessionUsageStats(sessionId: string) {
  const tracking = getSessionTracking(sessionId);
  
  const projectCount = countResources(tracking, 'project');
  const conversationCount = countResources(tracking, 'conversation');
  const totalMessages = tracking.resources.filter(r => r.type === 'message').length;
  
  return {
    projects: {
      used: projectCount,
      limit: FREE_TRIAL_LIMITS.MAX_PROJECTS,
      remaining: FREE_TRIAL_LIMITS.MAX_PROJECTS - projectCount
    },
    conversations: {
      used: conversationCount,
      limit: FREE_TRIAL_LIMITS.MAX_CONVERSATIONS,
      remaining: FREE_TRIAL_LIMITS.MAX_CONVERSATIONS - conversationCount
    },
    messages: {
      total: totalMessages,
      limitPerConversation: FREE_TRIAL_LIMITS.MAX_MESSAGES_PER_CONVERSATION,
      byConversation: tracking.messageCountByConversation
    }
  };
}