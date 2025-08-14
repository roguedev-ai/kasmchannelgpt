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
import { widgetDebugger } from '@/widget/debug-utils';
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
  clearError: () => void;
  setMessagesForConversation: (conversationId: string, messages: ChatMessage[]) => void;
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
      // Use a consistent storage key that includes both session ID and conversation ID
      const storageKey = `${MESSAGES_STORAGE_KEY}-${conversationId}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
      
      // Also update the main cache storage
      const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
      const cache = stored ? JSON.parse(stored) : {};
      cache[conversationId] = messages;
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(cache));
      
      // Enhanced debugging
      widgetDebugger.log('STORAGE', 'Saved messages to localStorage', {
        conversationId,
        messageCount: messages.length,
        storageKey,
        cacheKey: MESSAGES_STORAGE_KEY,
        sessionId,
        actualKeys: [storageKey, MESSAGES_STORAGE_KEY],
        messageIds: messages.map(m => ({ id: m.id, role: m.role }))
      });
      
      widgetDebugger.traceMessageFlow('SAVE_MESSAGES', {
        conversationId,
        messageCount: messages.length,
        sessionId,
        storageKeys: [storageKey, MESSAGES_STORAGE_KEY]
      });
    } catch (error) {
      console.error('Failed to save messages to local storage:', error);
      widgetDebugger.log('STORAGE', 'Failed to save messages', { 
        conversationId, 
        error,
        sessionId 
      }, 'error');
    }
  }

  function loadMessagesFromStorage(conversationId: string): ChatMessage[] | null {
    try {
      // First try the session-specific storage key
      const sessionStorageKey = `${MESSAGES_STORAGE_KEY}-${conversationId}`;
      const sessionStored = localStorage.getItem(sessionStorageKey);
      
      widgetDebugger.log('STORAGE', 'Attempting to load messages', {
        conversationId,
        sessionId,
        sessionStorageKey,
        hasSessionStored: !!sessionStored,
        sessionStoredLength: sessionStored?.length
      });
      
      if (sessionStored) {
        try {
          const messages = JSON.parse(sessionStored);
          widgetDebugger.log('STORAGE', 'Successfully loaded from session storage', {
            conversationId,
            messageCount: messages.length,
            sessionId,
            messageIds: messages.map((m: ChatMessage) => ({ id: m.id, role: m.role }))
          });
          
          widgetDebugger.traceMessageFlow('LOAD_SUCCESS_SESSION', {
            conversationId,
            messageCount: messages.length,
            fromKey: sessionStorageKey
          });
          
          return messages;
        } catch (e) {
          widgetDebugger.log('STORAGE', 'Failed to parse session storage', { error: e }, 'error');
        }
      }
      
      // Then try the main cache
      const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
      widgetDebugger.log('STORAGE', 'Checking main cache', {
        cacheKey: MESSAGES_STORAGE_KEY,
        hasCache: !!stored,
        cacheSize: stored?.length
      });
      
      if (stored) {
        try {
          const cache = JSON.parse(stored);
          const messages = cache[conversationId];
          
          widgetDebugger.log('STORAGE', 'Cache lookup result', {
            conversationId,
            foundMessages: !!messages,
            messageCount: messages?.length || 0,
            cacheKeys: Object.keys(cache),
            conversationIdType: typeof conversationId,
            cacheKeyTypes: Object.keys(cache).map(k => ({ key: k, type: typeof k }))
          });
          
          if (messages) {
            widgetDebugger.traceMessageFlow('LOAD_SUCCESS_CACHE', {
              conversationId,
              messageCount: messages.length,
              fromKey: MESSAGES_STORAGE_KEY
            });
          }
          
          return messages || null;
        } catch (e) {
          widgetDebugger.log('STORAGE', 'Failed to parse cache storage', { error: e }, 'error');
        }
      }
      
      widgetDebugger.log('STORAGE', 'No messages found in any storage', {
        conversationId,
        sessionId,
        checkedKeys: [sessionStorageKey, MESSAGES_STORAGE_KEY],
        allLocalStorageKeys: Object.keys(localStorage).filter(k => k.includes('customgpt'))
      }, 'warn');
      
      widgetDebugger.traceMessageFlow('LOAD_EMPTY', {
        conversationId,
        sessionId,
        reason: 'No messages found in storage'
      });
      
      return null;
    } catch (error) {
      widgetDebugger.log('STORAGE', 'Exception loading messages', {
        conversationId,
        error,
        sessionId
      }, 'error');
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

      widgetDebugger.log('MESSAGES', 'Adding user message', {
        conversationId,
        conversationIdType: typeof conversationId,
        messageId: userMessage.id,
        currentMapKeys: Array.from(get().messages.keys()),
        sessionId
      });
      
      widgetDebugger.traceMessageFlow('ADD_USER_MESSAGE', {
        conversationId,
        messageId: userMessage.id,
        sessionId,
        content: content.substring(0, 50) + '...'
      });

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
      widgetDebugger.log('MESSAGES', 'loadMessages called', {
        conversationId,
        conversationIdType: typeof conversationId,
        sessionId,
        storageKey: MESSAGES_STORAGE_KEY,
        currentMapSize: get().messages.size,
        currentMapKeys: Array.from(get().messages.keys())
      });
      
      widgetDebugger.traceMessageFlow('LOAD_MESSAGES_START', {
        conversationId,
        sessionId
      });
      
      set({ loading: true, error: null });

      try {
        // Try to load from storage first
        const cachedMessages = loadMessagesFromStorage(conversationId);
        
        widgetDebugger.log('MESSAGES', 'Storage load result', {
          conversationId,
          messageCount: cachedMessages?.length || 0,
          hasMessages: !!cachedMessages,
          firstMessage: cachedMessages?.[0] ? {
            id: cachedMessages[0].id,
            role: cachedMessages[0].role,
            contentPreview: cachedMessages[0].content.substring(0, 50)
          } : null
        });
        
        if (cachedMessages && cachedMessages.length > 0) {
          set(state => {
            const newMap = new Map(state.messages);
            newMap.set(conversationId, cachedMessages);
            
            widgetDebugger.log('MESSAGES', 'Updated message map', {
              conversationId,
              messageCount: cachedMessages.length,
              newMapSize: newMap.size,
              newMapKeys: Array.from(newMap.keys()),
              mapNowHasConversation: newMap.has(conversationId)
            });
            
            widgetDebugger.traceMessageFlow('LOAD_MESSAGES_SUCCESS', {
              conversationId,
              messageCount: cachedMessages.length,
              sessionId
            });
            
            return {
              messages: newMap,
              loading: false,
            };
          });
          return;
        }

        // No messages found in storage
        widgetDebugger.log('MESSAGES', 'No messages in storage, setting empty array', {
          conversationId,
          sessionId
        }, 'warn');
        
        set(state => {
          const newMap = new Map(state.messages);
          newMap.set(conversationId, []);
          
          widgetDebugger.traceMessageFlow('LOAD_MESSAGES_EMPTY', {
            conversationId,
            reason: 'No messages found',
            sessionId
          });
          
          return {
            messages: newMap,
            loading: false,
          };
        });
      } catch (error) {
        widgetDebugger.log('MESSAGES', 'Exception in loadMessages', {
          conversationId,
          error,
          sessionId
        }, 'error');
        
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load messages',
          loading: false 
        });
      }
    },

    addMessage: (conversationId: string, message: ChatMessage) => {
      widgetDebugger.log('MESSAGES', 'addMessage called', {
        conversationId,
        conversationIdType: typeof conversationId,
        messageId: message.id,
        messageRole: message.role,
        sessionId
      });
      
      set(state => {
        const newMessages = new Map(state.messages);
        const messages = newMessages.get(conversationId) || [];
        
        widgetDebugger.log('MESSAGES', 'Current messages for conversation', {
          conversationId,
          existingMessageCount: messages.length,
          mapHasConversation: state.messages.has(conversationId)
        });
        
        // Check if message already exists
        const existingIndex = messages.findIndex(m => m.id === message.id);
        if (existingIndex >= 0) {
          messages[existingIndex] = message;
          widgetDebugger.log('MESSAGES', 'Updated existing message', { messageId: message.id });
        } else {
          messages.push(message);
          widgetDebugger.log('MESSAGES', 'Added new message', { 
            messageId: message.id,
            newMessageCount: messages.length 
          });
        }
        
        newMessages.set(conversationId, messages);
        
        // Save to storage
        saveMessagesToStorage(conversationId, messages);
        
        widgetDebugger.traceMessageFlow('MESSAGE_ADDED', {
          conversationId,
          messageId: message.id,
          messageCount: messages.length,
          role: message.role
        });
        
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
    
    clearError: () => {
      set({ error: null });
    },
    
    setMessagesForConversation: (conversationId: string, messages: ChatMessage[]) => {
      set(state => {
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, messages);
        return { messages: newMessages };
      });
    },
  }));
}