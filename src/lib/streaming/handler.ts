import type { StreamChunk, Citation, StreamCallbacks, StreamHandlerConfig } from '@/types';
import { parseStreamChunk } from '@/lib/utils';

export interface StreamMessage {
  id: string;
  content: string;
  citations: Citation[];
  isComplete: boolean;
}

export class StreamHandler {
  private config: Required<StreamHandlerConfig>;
  private abortController: AbortController | null = null;
  private currentMessage: StreamMessage | null = null;

  constructor(config: StreamHandlerConfig = {}) {
    this.config = {
      timeout: config.timeout || 60000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  /**
   * Process a streaming response
   */
  async processStream(
    stream: ReadableStream,
    callbacks: StreamCallbacks
  ): Promise<StreamMessage> {
    this.abortController = new AbortController();
    this.currentMessage = {
      id: this.generateId(),
      content: '',
      citations: [],
      isComplete: false,
    };

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Set timeout
    const timeoutId = setTimeout(() => {
      this.cancel();
      callbacks.onError?.(new Error('Stream timeout'));
    }, this.config.timeout);

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.currentMessage.isComplete = true;
          callbacks.onComplete?.();
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            await this.processLine(line, callbacks);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        callbacks.onError?.(new Error('Stream cancelled'));
      } else {
        callbacks.onError?.(error instanceof Error ? error : new Error('Unknown streaming error'));
      }
    } finally {
      clearTimeout(timeoutId);
      reader.releaseLock();
      this.abortController = null;
    }

    return this.currentMessage;
  }

  /**
   * Process a single line from the stream
   */
  private async processLine(line: string, callbacks: StreamCallbacks): Promise<void> {
    const chunk = parseStreamChunk(line);
    
    if (!chunk || !this.currentMessage) return;

    switch (chunk.type) {
      case 'content':
        if (chunk.content) {
          this.currentMessage.content += chunk.content;
          callbacks.onChunk?.(chunk.content);
        }
        break;

      case 'citation':
        if (chunk.citations) {
          this.currentMessage.citations.push(...chunk.citations);
          chunk.citations.forEach((citation: Citation) => {
            callbacks.onCitation?.(citation);
          });
        }
        break;

      case 'done':
        this.currentMessage.isComplete = true;
        callbacks.onComplete?.();
        return;

      case 'error':
        callbacks.onError?.(new Error(chunk.error || 'Stream error'));
        return;

      default:
        // Handle unknown chunk types gracefully
        console.warn('Unknown stream chunk type:', chunk.type);
    }
  }

  /**
   * Cancel the current stream
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Get current message state
   */
  getCurrentMessage(): StreamMessage | null {
    return this.currentMessage;
  }

  /**
   * Check if streaming is active
   */
  isStreaming(): boolean {
    return this.abortController !== null && this.currentMessage !== null && !this.currentMessage.isComplete;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

/**
 * Utility class for managing multiple concurrent streams
 */
export class StreamManager {
  private streams: Map<string, StreamHandler> = new Map();
  private maxConcurrentStreams: number;

  constructor(maxConcurrentStreams: number = 3) {
    this.maxConcurrentStreams = maxConcurrentStreams;
  }

  /**
   * Start a new stream
   */
  async startStream(
    streamId: string,
    stream: ReadableStream,
    callbacks: StreamCallbacks,
    config?: StreamHandlerConfig
  ): Promise<StreamMessage> {
    // Check if we're at the concurrent limit
    if (this.streams.size >= this.maxConcurrentStreams) {
      throw new Error(`Maximum concurrent streams (${this.maxConcurrentStreams}) reached`);
    }

    // Cancel existing stream with same ID if it exists
    if (this.streams.has(streamId)) {
      this.cancelStream(streamId);
    }

    const handler = new StreamHandler(config);
    this.streams.set(streamId, handler);

    try {
      const result = await handler.processStream(stream, {
        ...callbacks,
        onComplete: () => {
          this.streams.delete(streamId);
          callbacks.onComplete?.();
        },
        onError: (error) => {
          this.streams.delete(streamId);
          callbacks.onError?.(error);
        },
      });

      return result;
    } catch (error) {
      this.streams.delete(streamId);
      throw error;
    }
  }

  /**
   * Cancel a specific stream
   */
  cancelStream(streamId: string): void {
    const handler = this.streams.get(streamId);
    if (handler) {
      handler.cancel();
      this.streams.delete(streamId);
    }
  }

  /**
   * Cancel all active streams
   */
  cancelAllStreams(): void {
    this.streams.forEach(handler => handler.cancel());
    this.streams.clear();
  }

  /**
   * Get active stream IDs
   */
  getActiveStreams(): string[] {
    return Array.from(this.streams.keys());
  }

  /**
   * Get stream status
   */
  getStreamStatus(streamId: string): {
    exists: boolean;
    isStreaming: boolean;
    message: StreamMessage | null;
  } {
    const handler = this.streams.get(streamId);
    
    if (!handler) {
      return { exists: false, isStreaming: false, message: null };
    }

    return {
      exists: true,
      isStreaming: handler.isStreaming(),
      message: handler.getCurrentMessage(),
    };
  }

  /**
   * Get number of active streams
   */
  getActiveStreamCount(): number {
    return this.streams.size;
  }
}

/**
 * Parse Server-Sent Events (SSE) data
 */
export function parseSSEData(data: string): any | null {
  try {
    if (data === '[DONE]') {
      return { type: 'done' };
    }
    
    const parsed = JSON.parse(data);
    
    // Handle different response formats
    if (parsed.choices && parsed.choices[0]) {
      const choice = parsed.choices[0];
      
      if (choice.delta && choice.delta.content) {
        return {
          type: 'content',
          content: choice.delta.content,
        };
      }
      
      if (choice.message && choice.message.content) {
        return {
          type: 'content',
          content: choice.message.content,
        };
      }
    }
    
    // Handle CustomGPT format
    if (parsed.content) {
      return {
        type: 'content',
        content: parsed.content,
        citations: parsed.citations || [],
      };
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse SSE data:', error);
    return null;
  }
}


/**
 * Validate stream format
 */
export function validateStreamChunk(chunk: any): boolean {
  if (!chunk || typeof chunk !== 'object') {
    return false;
  }

  // Must have a type
  if (!chunk.type || typeof chunk.type !== 'string') {
    return false;
  }

  // Validate specific types
  switch (chunk.type) {
    case 'content':
      return typeof chunk.content === 'string';
    
    case 'citation':
      return Array.isArray(chunk.citations);
    
    case 'done':
    case 'error':
      return true;
    
    default:
      return false;
  }
}

// Global stream manager instance
export const globalStreamManager = new StreamManager();