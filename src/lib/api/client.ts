/**
 * CustomGPT API Client
 * 
 * This file now uses the proxy client that communicates with our Next.js API routes.
 * The API key is stored securely on the server and never exposed to the client.
 * 
 * Migration from direct API calls to proxy:
 * - All API calls now go through /api/proxy/* endpoints
 * - No API key is needed or stored client-side
 * - Server handles authentication with CustomGPT
 */

// Re-export everything from the proxy client
export { proxyClient as apiClient } from './proxy-client';
export type { ProxyCustomGPTClient as CustomGPTClient } from './proxy-client';

// Export a singleton instance getter
import { proxyClient } from './proxy-client';

let initialized = false;

/**
 * Initialize the API client
 * No longer needs API key as it's handled server-side
 */
export function initializeClient(config?: any): void {
  // Mark as initialized without needing API key
  initialized = true;
}

/**
 * Get the API client instance
 */
export function getClient() {
  return proxyClient;
}

/**
 * Check if client is initialized
 */
export function isClientInitialized(): boolean {
  // Always return true since proxy client doesn't need initialization
  return true;
}