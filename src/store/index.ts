/**
 * Store Index - Central State Management
 * 
 * This file exports all Zustand stores used in the application.
 * Each store manages a specific domain of the application state.
 * 
 * Architecture:
 * - Uses Zustand for lightweight state management
 * - Each store is independent but can interact via imports
 * - Stores handle both state and async operations (API calls)
 * - All stores use TypeScript for type safety
 * 
 * Store Overview:
 * - config: API keys, base URLs, theme settings
 * - agents: Agent/chatbot management and CRUD operations
 * - conversations: Chat session management
 * - messages: Message handling, streaming, and history
 * - ui: UI preferences and layout state
 * - analytics: Usage tracking and metrics
 * - pages: Agent knowledge base pages
 * - sources: Citation sources and references
 * - profile: User profile and limits
 * - project-settings: Agent-specific settings
 * - licenses: License key management
 * 
 * Features:
 * - Centralized state management with TypeScript support
 * - Domain-specific stores for organized architecture
 * - Automated error handling and recovery
 * - Cross-store communication and data consistency
 */

// Export all stores from a single entry point
export { useConfigStore } from './config';
export { useAgentStore } from './agents';
export { useConversationStore } from './conversations';
export { useMessageStore } from './messages';
export { useUIStore } from './ui';
export { useAnalyticsStore } from './analytics';
export { usePageStore } from './pages';
export { useSourceStore } from './sources';
export { useProfileStore } from './profile';
export { useProjectSettingsStore } from './project-settings';
export { useLicenseStore } from './licenses';

/**
 * Store initialization helper
 * 
 * Currently, Zustand stores auto-initialize on first access.
 * This function is provided for future use cases where
 * manual initialization might be needed (e.g., SSR, testing).
 * 
 * @example
 * // In your app initialization
 * initializeStores();
 */
export function initializeStores() {
  // Stores will auto-initialize when first accessed
  // This function can be used for any additional setup if needed
}

/**
 * Store cleanup helper
 * 
 * Zustand automatically handles cleanup when components unmount.
 * This function is provided for manual cleanup scenarios
 * (e.g., user logout, testing teardown).
 * 
 * To implement cleanup:
 * 1. Add a reset() method to each store
 * 2. Call each store's reset() method here
 * 
 * @example
 * // On user logout
 * cleanupStores();
 */
export function cleanupStores() {
  // Add any cleanup logic if needed
  // Currently, Zustand handles cleanup automatically
}