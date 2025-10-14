import { useState, useCallback } from 'react';
import { QueryResponse } from '@/types/backend';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  
  const sendMessage = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      
      // Send query
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          partnerId,
          conversationId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data: QueryResponse = await response.json();
      
      // Add assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      
      // Update conversation ID
      setConversationId(data.conversationId);
      
    } catch (error) {
      console.error('[Chat] Error:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId, conversationId, onError]);
  
  const uploadFile = useCallback(async (text: string, metadata: any) => {
    try {
      setIsUploading(true);
      
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  
  return {
    messages,
    isLoading,
    isUploading,
    sendMessage,
    uploadFile,
    clearMessages,
  };
}
