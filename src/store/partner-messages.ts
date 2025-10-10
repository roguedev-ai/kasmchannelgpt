/**
 * Partner Message Store
 * 
 * Manages chat messages with mock API integration and partner session management.
 * Simplified version of the original message store focused on core functionality.
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { mockClient } from '@/lib/api/mock-client';
import { sessionManager } from '@/lib/session/partner-session';
import { generateId } from '@/lib/utils';

// Message Types
export interface Source {
  id: string;
  fileName: string;
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
  sources?: Source[];
}

interface PartnerMessageStore {
  messages: Map<string, Message[]>;
  streamingMessage: Message | null;
  isStreaming: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  getMessages: (partnerId: string) => Promise<void>;
  clearMessages: (partnerId?: string) => void;
  clearError: () => void;
}

// Local storage helpers
const STORAGE_KEY = 'partner-messages-cache';

const saveToStorage = (partnerId: string, messages: Message[]) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const cache = stored ? JSON.parse(stored) : {};
    cache[partnerId] = messages;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save messages to storage:', error);
  }
};

const loadFromStorage = (partnerId: string): Message[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const cache = JSON.parse(stored);
    return cache[partnerId] || null;
  } catch (error) {
    console.error('Failed to load messages from storage:', error);
    return null;
  }
};

export const usePartnerMessageStore = create<PartnerMessageStore>((set, get) => ({
  messages: new Map(),
  streamingMessage: null,
  isStreaming: false,
  error: null,

  sendMessage: async (content: string, files?: File[]) => {
    const partnerId = sessionManager.getPartnerId();
    if (!partnerId) {
      toast.error('Not authenticated. Please log in first.');
      return;
    }

    // Create optimistic user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      status: 'sending'
    };

    // Add user message to store
    const currentMessages = get().messages.get(partnerId) || [];
    const newMessages = [...currentMessages, userMessage];
    set(state => {
      const messages = new Map(state.messages);
      messages.set(partnerId, newMessages);
      return { messages };
    });
    saveToStorage(partnerId, newMessages);

    try {
      // Handle file uploads first
      if (files?.length) {
        const uploadPromises = files.map(file => 
          mockClient.mockUploadFile(file, partnerId)
        );
        await Promise.all(uploadPromises);
      }

      // Start streaming response
      set({ isStreaming: true });
      
      // Create initial streaming message
      const streamingMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      set({ streamingMessage });

      // Simulate streaming with mock API
      const response = await mockClient.mockQuery(content, partnerId);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get response');
      }

      // Update streaming message with complete response
      streamingMessage.content = response.data.answer;
      streamingMessage.sources = response.data.sources.map(source => ({
        id: source.id,
        fileName: source.fileName,
        snippet: source.snippet
      }));
      streamingMessage.status = 'sent';

      // Add final message to store
      const finalMessages = [...newMessages, streamingMessage];
      set(state => {
        const messages = new Map(state.messages);
        messages.set(partnerId, finalMessages);
        return { 
          messages,
          streamingMessage: null,
          isStreaming: false
        };
      });
      saveToStorage(partnerId, finalMessages);

      // Update user message status
      userMessage.status = 'sent';
      set(state => {
        const messages = new Map(state.messages);
        messages.set(partnerId, finalMessages.map(m => 
          m.id === userMessage.id ? userMessage : m
        ));
        return { messages };
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Update user message status
      userMessage.status = 'error';
      set(state => {
        const messages = new Map(state.messages);
        messages.set(partnerId, newMessages.map(m => 
          m.id === userMessage.id ? userMessage : m
        ));
        return { 
          messages,
          streamingMessage: null,
          isStreaming: false,
          error: error instanceof Error ? error.message : 'Failed to send message'
        };
      });
      
      toast.error('Failed to send message. Please try again.');
    }
  },

  getMessages: async (partnerId: string) => {
    try {
      // Try to load from storage first
      const cachedMessages = loadFromStorage(partnerId);
      if (cachedMessages) {
        set(state => {
          const messages = new Map(state.messages);
          messages.set(partnerId, cachedMessages);
          return { messages };
        });
      }

      // Get messages from mock API
      const response = await mockClient.mockGetConversations(partnerId);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get messages');
      }

      // Convert conversations to messages
      const messages: Message[] = [];
      response.data.forEach(conv => {
        conv.messages.forEach(msg => {
          messages.push({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            status: 'sent'
          });
        });
      });

      // Sort by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);

      // Update store
      set(state => {
        const newMessages = new Map(state.messages);
        newMessages.set(partnerId, messages);
        return { messages: newMessages };
      });
      saveToStorage(partnerId, messages);

    } catch (error) {
      console.error('Failed to get messages:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to get messages' });
      
      // If we have cached messages, show toast but keep showing messages
      if (get().messages.get(partnerId)) {
        toast.error('Failed to refresh messages. Showing cached messages.');
      } else {
        toast.error('Failed to load messages. Please try again.');
      }
    }
  },

  clearMessages: (partnerId?: string) => {
    set(state => {
      const messages = new Map(state.messages);
      if (partnerId) {
        messages.delete(partnerId);
        localStorage.removeItem(`${STORAGE_KEY}-${partnerId}`);
      } else {
        messages.clear();
        localStorage.removeItem(STORAGE_KEY);
      }
      return { messages };
    });
  },

  clearError: () => set({ error: null })
}));
