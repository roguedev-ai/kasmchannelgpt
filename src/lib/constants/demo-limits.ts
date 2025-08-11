/**
 * Demo Mode Usage Limits Constants
 * 
 * Central configuration for all demo mode restrictions and limits.
 * Modify these values to adjust demo mode behavior.
 */

// Free Trial Mode Limits (No API Key)
export const FREE_TRIAL_LIMITS = {
  // Resource Limits
  MAX_PROJECTS: 1,
  MAX_CONVERSATIONS: 2,
  MAX_MESSAGES_PER_CONVERSATION: 2,
  
  // Time Limits (in milliseconds)
  SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  SESSION_WARNING_TIME: 5 * 60 * 1000, // Show warning 5 minutes before expiry
  
  // Rate Limits
  MAX_REQUESTS_PER_MINUTE: 10,
  COOLDOWN_BETWEEN_MESSAGES: 2000, // 2 seconds between messages
  
  // Feature Restrictions
  ALLOW_FILE_UPLOAD: false,
  ALLOW_SITEMAP_UPLOAD: false,
  ALLOW_DELETE_OPERATIONS: false,
  ALLOW_PROJECT_SETTINGS: false,
  ALLOW_VOICE_MODE: false,
  
  // UI Messages
  SESSION_EXPIRY_WARNING: "Your free trial session will expire in 5 minutes",
  SESSION_EXPIRED_MESSAGE: "Your free trial session has expired. Please refresh to start a new session.",
  LIMIT_REACHED_MESSAGE: {
    projects: "Free trial limit reached: Maximum 1 project allowed",
    conversations: "Free trial limit reached: Maximum 2 conversations allowed",
    messages: "Free trial limit reached: Maximum 2 messages per conversation"
  }
} as const;

// User API Key Demo Mode Limits
export const USER_DEMO_LIMITS = {
  // Time Limits (in milliseconds)
  SESSION_DURATION: 120 * 60 * 1000, // 120 minutes (2 hours)
  SESSION_WARNING_TIME: 10 * 60 * 1000, // Show warning 10 minutes before expiry
  
  // No resource limits for user API key mode
  MAX_PROJECTS: Infinity,
  MAX_CONVERSATIONS: Infinity,
  MAX_MESSAGES_PER_CONVERSATION: Infinity,
  
  // Features all enabled
  ALLOW_FILE_UPLOAD: true,
  ALLOW_SITEMAP_UPLOAD: true,
  ALLOW_DELETE_OPERATIONS: true,
  ALLOW_PROJECT_SETTINGS: true,
  ALLOW_VOICE_MODE: true,
  
  // UI Messages
  SESSION_EXPIRY_WARNING: "Your demo session will expire in 10 minutes",
  SESSION_EXPIRED_MESSAGE: "Your demo session has expired. Please refresh to start a new session."
} as const;

// Session Storage Keys
export const DEMO_STORAGE_KEYS = {
  DEPLOYMENT_MODE: 'customgpt.deploymentMode',
  FREE_TRIAL_MODE: 'customgpt.freeTrialMode',
  FREE_TRIAL_SESSION: 'customgpt.freeTrialSession',
  DEMO_SESSION: 'customgpt.demoSession',
  API_KEY: 'customgpt.apiKey',
  OPENAI_KEY: 'customgpt.openAIApiKey',
  SESSION_START: 'customgpt.sessionStart',
  AUTO_DETECTED: 'customgpt.autoDetected'
} as const;

// API Headers
export const DEMO_API_HEADERS = {
  DEPLOYMENT_MODE: 'X-Deployment-Mode',
  API_KEY: 'X-CustomGPT-API-Key',
  SESSION_ID: 'X-Demo-Session-ID',
  FREE_TRIAL: 'X-Free-Trial-Mode'
} as const;

// Type definitions for session data
export interface FreeTrialSession {
  sessionId: string;
  startTime: number;
  projectCount: number;
  conversationCount: number;
  messageCount: number;
  lastActivity: number;
}

export interface DemoSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
}

// Helper functions
export function isSessionExpired(startTime: number, duration: number): boolean {
  return Date.now() - startTime > duration;
}

export function getTimeRemaining(startTime: number, duration: number): number {
  const elapsed = Date.now() - startTime;
  const remaining = duration - elapsed;
  return Math.max(0, remaining);
}

export function shouldShowWarning(startTime: number, duration: number, warningTime: number): boolean {
  const remaining = getTimeRemaining(startTime, duration);
  return remaining > 0 && remaining <= warningTime;
}