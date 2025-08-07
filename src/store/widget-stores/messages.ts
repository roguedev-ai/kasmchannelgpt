/**
 * Widget-specific Message Store Factory
 * 
 * Creates an isolated message store instance for each widget.
 * This ensures messages are not shared between different widget instances.
 */

import { create, StoreApi } from 'zustand';
import type { ChatMessage, Citation, FeedbackType } from '@/types';
import { getClient } from '@/lib/api/client';
import { generateId } from '@/lib/utils';
import { globalStreamManager } from '@/lib/streaming/handler';
import { logger } from '@/lib/logger';
import type { AgentStore } from './agents';
import type { ConversationStore } from './conversations';

// Message Store interface - copied from original to maintain compatibility
export interface MessageStore {
  messages: Map<string, ChatMessage[]>;
  streamingMessage: ChatMessage | null;
  isStreaming: boolean;
  loading: boolean;
  error: string | null;
  
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateStreamingMessage: (content: string, citations?: Citation[]) => void;
  clearMessages: (conversationId?: string) => void;
  updateMessageFeedback: (messageId: string, feedback: FeedbackType) => void;
  cancelStreaming: () => void;
  getMessagesForConversation: (conversationId: string) => ChatMessage[];
  reset: () => void;
}

/**
 * Create a message store instance for a specific widget
 * @param sessionId - The widget's session ID for isolation
 * @param agentStore - Reference to the agent store
 * @param conversationStore - Reference to the conversation store
 */
export function createMessageStore(
  sessionId: string,
  agentStore?: StoreApi<AgentStore>,
  conversationStore?: StoreApi<ConversationStore>
): StoreApi<MessageStore> {
  const MESSAGES_STORAGE_KEY = `customgpt-messages-cache-${sessionId}`;
  
  // Local storage helpers scoped to this instance
  function saveMessagesToStorage(conversationId: string, messages: ChatMessage[]) {
    try {
      const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
      const cache = stored ? JSON.parse(stored) : {};
      cache[conversationId] = messages;
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save messages to local storage:', error);
    }
  }

  function loadMessagesFromStorage(conversationId: string): ChatMessage[] | null {
    try {
      const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (!stored) return null;
      const cache = JSON.parse(stored);
      return cache[conversationId] || null;
    } catch (error) {
      console.error('Failed to load messages from local storage:', error);
      return null;
    }
  }

  return create<MessageStore>((set, get) => ({
    messages: new Map(),
    streamingMessage: null,
    isStreaming: false,
    loading: false,
    error: null,

    sendMessage: async (content: string, files?: File[]) => {
      const isDemoMode = typeof window !== 'undefined' && (window as any).__customgpt_demo_mode;
      
      // Use the passed store references
      if (!agentStore || !conversationStore) {
        logger.error('MESSAGES', 'Store references not provided');
        throw new Error('Store references not provided');
      }
      
      const currentAgent = agentStore.getState().currentAgent;
      if (!currentAgent) {
        logger.error('MESSAGES', 'No agent selected');
        throw new Error('No agent selected');
      }

      logger.info('MESSAGES', 'Sending message from widget store', {
        sessionId,
        agentId: currentAgent.id,
        agentName: currentAgent.project_name,
        messageLength: content.length,
        hasFiles: files && files.length > 0
      });

      // Ensure we have a conversation
      const conversation = await conversationStore.getState().ensureConversation(
        typeof currentAgent.id === 'string' ? parseInt(currentAgent.id) : currentAgent.id,
        content
      );

      logger.info('MESSAGES', 'Conversation ensured', {
        conversationId: conversation.id,
        sessionId: conversation.session_id,
        hasSessionId: !!conversation.session_id,
        isNew: !conversation.message_count || conversation.message_count === 0
      });

      if (!conversation.session_id) {
        logger.error('MESSAGES', 'Conversation missing session_id', { conversation });
        throw new Error('Conversation missing session_id');
      }

      set({ loading: true, error: null });

      const conversationId = conversation.id.toString();

      // Create user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      // Add user message to store
      get().addMessage(conversationId, userMessage);

      // Create assistant message placeholder
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        citations: [],
      };

      set({ 
        streamingMessage: assistantMessage,
        isStreaming: true,
        loading: false,
      });

      try {
        // Handle file uploads if present
        if (files && files.length > 0) {
          const client = getClient();
          await Promise.all(
            files.map(file => client.uploadFile(currentAgent.id, file))
          );
        }

        // Update user message status
        userMessage.status = 'sent';
        get().addMessage(conversationId, userMessage);

        // Start streaming with correct parameters
        const client = getClient();
        
        logger.info('MESSAGES', 'Starting message stream', {
          agentId: currentAgent.id,
          sessionId: conversation.session_id,
          messageContent: content.substring(0, 50)
        });
        
        if (isDemoMode) {
          // Demo mode - simulate streaming response
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const demoResponse = `This is a demo response to: "${content}"`;
          get().updateStreamingMessage(demoResponse);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const finalMessage = get().streamingMessage;
          if (finalMessage) {
            finalMessage.status = 'sent';
            get().addMessage(conversationId, finalMessage);
          }
          
          set({ 
            streamingMessage: null,
            isStreaming: false,
          });
          return;
        }
        
        // Real API streaming
        try {
          await client.sendMessageStream(
            currentAgent.id,
            conversation.session_id,
            { 
              prompt: content
            },
            (chunk) => {
                logger.info('MESSAGES', 'Received stream chunk', { 
                  type: chunk.type, 
                  hasContent: !!chunk.content,
                  contentLength: chunk.content?.length,
                  contentPreview: chunk.content?.substring(0, 50)
                });
                
                if (chunk.type === 'content' && chunk.content) {
                  get().updateStreamingMessage(chunk.content, chunk.citations);
                } else if (chunk.type === 'citation' && chunk.citations) {
                  // Handle citation-only chunks
                  const current = get().streamingMessage;
                  if (current) {
                    set({
                      streamingMessage: {
                        ...current,
                        citations: chunk.citations
                      }
                    });
                  }
                }
              },
            async (streamError) => {
                logger.error('MESSAGES', 'Streaming failed, attempting fallback to non-streaming', streamError);
                
                // Try fallback to non-streaming API
                try {
                  const response = await client.sendMessage(
                    currentAgent.id,
                    conversation.session_id,
                    { 
                      prompt: content,
                      stream: false
                    }
                  );
                  
                  // Update streaming message with the complete response
                  const finalMessage = get().streamingMessage;
                  if (finalMessage && response) {
                    let messageData: any;
                    if (response.data) {
                      messageData = response.data;
                    } else {
                      messageData = response as any;
                    }
                    
                    finalMessage.content = messageData?.openai_response || messageData?.content || 'No response received';
                    finalMessage.citations = messageData?.citations || [];
                    finalMessage.status = 'sent';
                    get().addMessage(conversationId, finalMessage);
                  }
                  
                  set({ 
                    streamingMessage: null,
                    isStreaming: false,
                  });
                  
                } catch (fallbackError) {
                  logger.error('MESSAGES', 'Both streaming and non-streaming failed', fallbackError);
                  throw fallbackError;
                }
              },
            () => {
                // onComplete callback
                const finalMessage = get().streamingMessage;
                if (finalMessage) {
                  finalMessage.status = 'sent';
                  get().addMessage(conversationId, finalMessage);
                }
                
                set({ 
                  streamingMessage: null,
                  isStreaming: false,
                });
                
                // Update conversation message count
                conversationStore.getState().updateConversation(
                  conversation.id,
                  conversation.session_id,
                  { name: conversation.name }
                );
              }
          );
        } catch (error) {
          logger.error('MESSAGES', 'Failed to send message', error);
          
          // Remove assistant message placeholder on error
          set({ 
            streamingMessage: null,
            isStreaming: false,
            error: error instanceof Error ? error.message : 'Failed to send message'
          });
          
          throw error;
        }
      } catch (error) {
        logger.error('MESSAGES', 'Error in sendMessage', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to send message',
          streamingMessage: null,
          isStreaming: false,
          loading: false,
        });
        throw error;
      }
    },

    loadMessages: async (conversationId: string) => {
      set({ loading: true, error: null });

      try {
        // Try to load from storage first
        const cachedMessages = loadMessagesFromStorage(conversationId);
        if (cachedMessages) {
          set(state => ({
            messages: new Map(state.messages).set(conversationId, cachedMessages),
            loading: false,
          }));
          return;
        }

        // In a real implementation, would load from API
        set(state => ({
          messages: new Map(state.messages).set(conversationId, []),
          loading: false,
        }));
      } catch (error) {
        logger.error('MESSAGES', 'Failed to load messages', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load messages',
          loading: false 
        });
      }
    },

    addMessage: (conversationId: string, message: ChatMessage) => {
      set(state => {
        const newMessages = new Map(state.messages);
        const messages = newMessages.get(conversationId) || [];
        
        // Check if message already exists
        const existingIndex = messages.findIndex(m => m.id === message.id);
        if (existingIndex >= 0) {
          messages[existingIndex] = message;
        } else {
          messages.push(message);
        }
        
        newMessages.set(conversationId, messages);
        
        // Save to storage
        saveMessagesToStorage(conversationId, messages);
        
        return { messages: newMessages };
      });
    },

    updateStreamingMessage: (content: string, citations?: Citation[]) => {
      set(state => {
        if (!state.streamingMessage) return state;
        
        return {
          streamingMessage: {
            ...state.streamingMessage,
            content: state.streamingMessage.content + content,
            citations: citations || state.streamingMessage.citations,
          },
        };
      });
    },

    clearMessages: (conversationId?: string) => {
      if (conversationId) {
        set(state => {
          const newMessages = new Map(state.messages);
          newMessages.delete(conversationId);
          return { messages: newMessages };
        });
        
        // Clear from storage
        try {
          const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
          if (stored) {
            const cache = JSON.parse(stored);
            delete cache[conversationId];
            localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(cache));
          }
        } catch (error) {
          console.error('Failed to clear messages from storage:', error);
        }
      } else {
        // Clear all messages
        set({ messages: new Map() });
        
        // Clear all from storage
        try {
          localStorage.removeItem(MESSAGES_STORAGE_KEY);
        } catch (error) {
          console.error('Failed to clear all messages from storage:', error);
        }
      }
    },

    cancelStreaming: () => {
      globalStreamManager.cancelAllStreams();
      set({ isStreaming: false, streamingMessage: null });
    },

    getMessagesForConversation: (conversationId: string): ChatMessage[] => {
      return get().messages.get(conversationId) || [];
    },

    updateMessageFeedback: (messageId: string, feedback: FeedbackType) => {
      set(state => {
        const newMessages = new Map(state.messages);
        
        for (const [convId, messages] of newMessages) {
          const messageIndex = messages.findIndex(m => m.id === messageId);
          if (messageIndex !== -1) {
            const updatedMessages = [...messages];
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              feedback,
            };
            newMessages.set(convId, updatedMessages);
            saveMessagesToStorage(convId, updatedMessages);
            break;
          }
        }
        
        return { messages: newMessages };
      });
    },

    reset: () => {
      set({
        messages: new Map(),
        streamingMessage: null,
        isStreaming: false,
        loading: false,
        error: null,
      });
    },
  }));
}