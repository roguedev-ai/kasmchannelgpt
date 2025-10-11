import { useState, useCallback } from 'react';
import { AgentFunction } from '@/lib/rag/agent-router';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export function useChat(partnerId: string, agentFunction?: AgentFunction) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    try {
      setIsLoading(true);

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        isUser: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to API
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          partnerId,
          agentFunction,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add bot response
      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.answer,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, there was an error processing your message.',
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId, agentFunction]);

  const uploadFile = useCallback(async (file: File) => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('partnerId', partnerId);

      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      // Add success message
      const successMessage: Message = {
        id: Date.now().toString(),
        text: `File "${file.name}" uploaded successfully. You can now ask questions about its content.`,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, successMessage]);

    } catch (error) {
      console.error('Error uploading file:', error);
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, there was an error uploading your file.',
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
    }
  }, [partnerId]);

  return {
    messages,
    isLoading,
    sendMessage,
    uploadFile,
    isUploading,
  };
}
