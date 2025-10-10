/**
 * Partner Chat Container
 * 
 * Wrapper around ChatContainer that integrates with partner message store.
 * Handles message conversion between store format and ChatContainer format.
 */

import React from 'react';
import { ChatContainer } from './ChatContainer';
import { Message, Source } from '@/store/partner-messages';
import type { ChatMessage, Citation } from '@/types';
import { cn } from '@/lib/utils';

interface PartnerChatContainerProps {
  messages: Message[];
  streamingMessage: Message | null;
  isStreaming: boolean;
  onMessage: (content: string, files?: File[]) => Promise<void>;
  className?: string;
}

/**
 * Convert source to citation format
 */
function convertSourceToCitation(source: Source, index: number): Citation {
  return {
    id: source.id,
    index: index + 1,
    title: source.fileName,
    content: source.snippet,
    source: source.fileName, // Use fileName as source
    url: '', // No URL in mock data
  };
}

/**
 * Convert partner message format to ChatContainer format
 */
function convertMessage(msg: Message): ChatMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp).toISOString(),
    status: msg.status,
    citations: msg.sources?.map((source, index) => 
      convertSourceToCitation(source, index)
    ) || [],
  };
}

// Extend ChatContainer props to include our overrides
interface ExtendedChatContainerProps {
  mode: 'standalone' | 'widget' | 'floating';
  className?: string;
  onMessage: (content: string, files?: File[]) => Promise<void>;
  overrideMessages?: ChatMessage[];
  overrideStreamingMessage?: ChatMessage | null;
  overrideIsStreaming?: boolean;
}

// Create a type-safe wrapper component
const ExtendedChatContainer: React.FC<ExtendedChatContainerProps> = ChatContainer as any;

export function PartnerChatContainer({
  messages,
  streamingMessage,
  isStreaming,
  onMessage,
  className
}: PartnerChatContainerProps) {
  // Convert messages to ChatContainer format
  const convertedMessages = messages.map(convertMessage);
  
  return (
    <ExtendedChatContainer
      mode="standalone"
      className={cn("h-full", className)}
      onMessage={onMessage}
      // Override message store with our converted messages
      overrideMessages={convertedMessages}
      // Pass streaming state
      overrideStreamingMessage={streamingMessage ? convertMessage(streamingMessage) : null}
      overrideIsStreaming={isStreaming}
    />
  );
}
