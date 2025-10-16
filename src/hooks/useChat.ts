import { useState, useCallback } from 'react';
import { sessionManager } from '../lib/session/partner-session';

export interface Source {
  content: string;
  source: string;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  usedRag?: boolean;
}

interface UseChatOptions {
  partnerId: string;
  onError?: (error: Error) => void;
}

export function useChat({ partnerId, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [useRag, setUseRag] = useState(true);
  
  const sendMessage = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      
      // Get authentication token
      const { token } = sessionManager.useSession();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      
      // Send to chat endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          partnerId,
          conversationId,
          useRag,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Add assistant message with sources if available
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        usedRag: data.usedRag,
      }]);
      
      // Update conversation ID
      setConversationId(data.conversationId);
      
    } catch (error) {
      console.error('[Chat] Error:', error);
      onError?.(error as Error);
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId, conversationId, useRag, onError]);
  
  const uploadFile = useCallback(async (text: string, metadata: any) => {
    try {
      setIsUploading(true);
      
      // Get authentication token
      const { token } = sessionManager.useSession();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          metadata,
          partnerId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('[Chat] Upload error:', error);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [partnerId, onError]);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
  }, []);
  
  const toggleRag = useCallback(() => {
    setUseRag(prev => !prev);
  }, []);
  
  return {
    messages,
    isLoading,
    isUploading,
    useRag,
    sendMessage,
    uploadFile,
    clearMessages,
    toggleRag,
  };
}
