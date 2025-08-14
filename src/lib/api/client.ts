/**
 * API Client Abstraction
 * 
 * This module provides the appropriate API client based on the configuration.
 * It can switch between:
 * - Proxy mode: For Next.js app (API key stored server-side)
 * - Direct mode: For widget deployments (API key provided client-side)
 */

import { ProxyCustomGPTClient, proxyClient } from './proxy-client';
import { DirectCustomGPTClient } from './direct-client';

// Type that represents either client
export type CustomGPTClient = ProxyCustomGPTClient | DirectCustomGPTClient;

// Configuration interface
interface ClientConfig {
  mode?: 'proxy' | 'direct';
  apiKey?: string;
  apiUrl?: string;
}

// Singleton instance
let clientInstance: CustomGPTClient | null = null;
let initialized = false;

/**
 * Initialize the API client
 * @param config Configuration object with mode, apiKey, and optional apiUrl
 */
export function initializeClient(config?: ClientConfig): void {
  if (config) {
    if (config.mode === 'direct' && config.apiKey) {
      // Direct mode for widget deployments
      clientInstance = new DirectCustomGPTClient(config.apiKey, config.apiUrl);
      initialized = true;
    } else {
      // Proxy mode (default)
      clientInstance = proxyClient;
      if (config.apiUrl) {
        proxyClient.setApiUrl(config.apiUrl);
      }
      initialized = true;
    }
  } else {
    // Default to proxy client
    clientInstance = proxyClient;
    initialized = true;
  }
}

/**
 * Get the API client instance
 */
export function getClient(): CustomGPTClient {
  if (!clientInstance) {
    // Default to proxy client if not initialized
    clientInstance = proxyClient;
  }
  return clientInstance;
}

/**
 * Get or create the API client instance
 * @deprecated Use getClient() instead
 */
export function getApiClient(config?: ClientConfig): CustomGPTClient {
  if (config) {
    initializeClient(config);
  }
  return getClient();
}

/**
 * Check if client is initialized
 */
export function isClientInitialized(): boolean {
  return initialized || clientInstance !== null;
}

/**
 * Reset the client instance
 */
export function resetApiClient(): void {
  clientInstance = null;
  initialized = false;
}

// Export default client getter for backward compatibility
export const apiClient = getClient();