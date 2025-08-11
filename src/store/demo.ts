/**
 * Demo Mode Store
 * 
 * Manages API key storage and authentication for demo/playground mode.
 * Uses encrypted sessionStorage for temporary key storage that survives
 * page refreshes but is cleared when the browser tab is closed.
 */

import { create } from 'zustand';
import { encrypt, decrypt, generateKey, isValidApiKey } from '@/lib/crypto';

interface DemoStore {
  // Demo mode configuration
  isDemoMode: boolean;
  
  // API key management
  apiKey: string | null;
  openAIApiKey: string | null;
  encryptionKey: string | null;
  
  // UI state
  isAuthenticated: boolean;
  error: string | null;
  
  // Session management
  sessionStartTime: number | null;
  sessionTimeout: number; // 2 hours in milliseconds
  
  // Actions
  setApiKey: (key: string) => void;
  setOpenAIApiKey: (key: string) => void;
  clearApiKey: () => void;
  validateSession: () => boolean;
  setError: (error: string | null) => void;
  initializeFromStorage: () => void;
  restoreSession: () => boolean;
}

const STORAGE_KEY = 'customgpt-demo-key';
const OPENAI_STORAGE_KEY = 'customgpt-demo-openai-key';
const ENCRYPTION_KEY = 'customgpt-demo-enc';
const SESSION_KEY = 'customgpt-demo-session';
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

export const useDemoStore = create<DemoStore>((set, get) => ({
  // Check if demo mode is enabled from localStorage deployment mode
  isDemoMode: typeof window !== 'undefined' ? localStorage.getItem('customgpt.deploymentMode') === 'demo' : false,
  
  apiKey: null,
  openAIApiKey: null,
  encryptionKey: null,
  isAuthenticated: false,
  error: null,
  sessionStartTime: null,
  sessionTimeout: SESSION_TIMEOUT,
  
  setApiKey: (key: string) => {
    const trimmedKey = key.trim();
    
    // Validate API key format
    if (!isValidApiKey(trimmedKey)) {
      set({ error: 'Invalid API key format' });
      return;
    }
    
    try {
      // Generate encryption key
      const encKey = generateKey();
      
      // Encrypt and store in sessionStorage
      const encrypted = encrypt(trimmedKey, encKey);
      sessionStorage.setItem(STORAGE_KEY, encrypted);
      sessionStorage.setItem(ENCRYPTION_KEY, encKey);
      
      // Store session info
      const sessionInfo = {
        startTime: Date.now(),
        encKey: encKey
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionInfo));
      
      // Update store state
      set({
        apiKey: trimmedKey,
        encryptionKey: encKey,
        isAuthenticated: true,
        error: null,
        sessionStartTime: Date.now()
      });
    } catch (error) {
      set({ error: 'Failed to store API key' });
    }
  },
  
  setOpenAIApiKey: (key: string) => {
    const trimmedKey = key.trim();
    const state = get();
    
    // Only allow if already authenticated with CustomGPT key
    if (!state.isAuthenticated) {
      set({ error: 'Please enter CustomGPT.ai API key first' });
      return;
    }
    
    // OpenAI keys typically start with 'sk-'
    if (trimmedKey && !trimmedKey.startsWith('sk-')) {
      set({ error: 'Invalid OpenAI API key format' });
      return;
    }
    
    try {
      // Use same encryption key as CustomGPT key
      const encKey = state.encryptionKey;
      if (!encKey) {
        set({ error: 'Encryption key not found' });
        return;
      }
      
      if (trimmedKey) {
        // Encrypt and store
        const encrypted = encrypt(trimmedKey, encKey);
        sessionStorage.setItem(OPENAI_STORAGE_KEY, encrypted);
        set({ openAIApiKey: trimmedKey, error: null });
      } else {
        // Clear OpenAI key
        sessionStorage.removeItem(OPENAI_STORAGE_KEY);
        set({ openAIApiKey: null, error: null });
      }
    } catch (error) {
      set({ error: 'Failed to store OpenAI API key' });
    }
  },
  
  clearApiKey: () => {
    // Clear from storage
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(OPENAI_STORAGE_KEY);
    sessionStorage.removeItem(ENCRYPTION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    
    // Clear from memory
    set({
      apiKey: null,
      openAIApiKey: null,
      encryptionKey: null,
      isAuthenticated: false,
      error: null,
      sessionStartTime: null
    });
  },
  
  validateSession: () => {
    const state = get();
    
    // Check if session has expired
    if (state.sessionStartTime) {
      const elapsed = Date.now() - state.sessionStartTime;
      if (elapsed > state.sessionTimeout) {
        state.clearApiKey();
        state.setError('Session expired. Please enter your API key again.');
        return false;
      }
    }
    
    return state.isAuthenticated;
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  initializeFromStorage: () => {
    const state = get();
    
    // Only initialize if demo mode is enabled
    if (!state.isDemoMode) return;
    
    // Try to restore the session
    state.restoreSession();
  },
  
  restoreSession: () => {
    const state = get();
    
    try {
      // Check for session info
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (!sessionData) return false;
      
      const sessionInfo = JSON.parse(sessionData);
      const { startTime, encKey } = sessionInfo;
      
      // Check if session expired
      const elapsed = Date.now() - startTime;
      if (elapsed > SESSION_TIMEOUT) {
        state.clearApiKey();
        state.setError('Session expired. Please enter your API key again.');
        return false;
      }
      
      // Try to restore encrypted keys
      const encrypted = sessionStorage.getItem(STORAGE_KEY);
      const encryptedOpenAI = sessionStorage.getItem(OPENAI_STORAGE_KEY);
      
      if (!encrypted || !encKey) return false;
      
      // Decrypt API keys
      const apiKey = decrypt(encrypted, encKey);
      if (!apiKey || !isValidApiKey(apiKey)) {
        state.clearApiKey();
        return false;
      }
      
      // Restore OpenAI key if present
      let openAIKey = null;
      if (encryptedOpenAI) {
        openAIKey = decrypt(encryptedOpenAI, encKey);
      }
      
      // Restore state
      set({
        apiKey: apiKey,
        openAIApiKey: openAIKey,
        encryptionKey: encKey,
        isAuthenticated: true,
        sessionStartTime: startTime,
        error: null
      });
      
      return true;
    } catch {
      // Session restore failed, clear everything
      state.clearApiKey();
      return false;
    }
  }
}));

// Auto-clear on tab visibility change (optional security feature)
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Optional: Clear API key when tab is hidden
      // Uncomment for extra security
      // const { clearApiKey } = useDemoStore.getState();
      // clearApiKey();
    }
  });
  
  // Check session validity periodically
  setInterval(() => {
    const { validateSession } = useDemoStore.getState();
    validateSession();
  }, 60000); // Check every minute
}