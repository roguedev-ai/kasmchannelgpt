/**
 * Unified API Client
 * 
 * Provides a single interface for API operations with mock/real implementation switching.
 * Uses environment variable NEXT_PUBLIC_USE_MOCK_API to determine mode.
 */

import type { 
  LoginResponse, 
  UploadResponse, 
  QueryResponse, 
  Conversation,
  APIResponse,
  Source
} from './types';

/**
 * Mock API Client Implementation
 * 
 * Uses simulated data and responses for development.
 */
class MockAPIClient {
  private debugMode: boolean;

  constructor(debug = true) {
    this.debugMode = debug;
    this.log('Mock API Client initialized');
  }

  private log(...args: any[]) {
    if (this.debugMode) {
      console.log('[MockAPI]', ...args);
    }
  }

  async login(partnerId: string, email: string): Promise<APIResponse<LoginResponse>> {
    this.log('Login attempt:', { partnerId, email });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: {
        token: `mock_jwt_${partnerId}_${Date.now()}`,
        partnerId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        permissions: ['read', 'write', 'upload']
      },
      metadata: {
        requestId: Math.random().toString(36).substring(7),
        timestamp: Date.now()
      }
    };
  }

  async uploadFile(file: File, partnerId: string): Promise<APIResponse<UploadResponse>> {
    this.log('Upload started:', { fileName: file.name, partnerId });
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      data: {
        fileId: Math.random().toString(36).substring(7),
        url: `https://mock-storage.example.com/${partnerId}/${file.name}`,
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: Date.now(),
          processingStatus: 'completed'
        }
      },
      metadata: {
        requestId: Math.random().toString(36).substring(7),
        timestamp: Date.now()
      }
    };
  }

  async query(query: string, partnerId: string): Promise<APIResponse<QueryResponse>> {
    this.log('Processing query:', { query, partnerId });
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockSource: Source = {
      id: 'src_001',
      fileId: 'file_001',
      fileName: 'document.pdf',
      snippet: 'Relevant content from the document...',
      pageNumber: 1,
      confidence: 0.95,
      metadata: {
        section: 'Introduction',
        category: 'Documentation',
        lastUpdated: Date.now()
      }
    };
    
    return {
      success: true,
      data: {
        answer: `Mock response to: ${query}`,
        sources: [mockSource],
        metadata: {
          tokensUsed: 150,
          processingTime: 1200,
          modelVersion: 'mock-1.0'
        }
      },
      metadata: {
        requestId: Math.random().toString(36).substring(7),
        timestamp: Date.now()
      }
    };
  }

  async getConversations(partnerId: string): Promise<APIResponse<Conversation[]>> {
    this.log('Fetching conversations:', { partnerId });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: [
        {
          id: 'conv_001',
          partnerId,
          title: 'Mock Conversation 1',
          createdAt: Date.now() - 3600000, // 1 hour ago
          updatedAt: Date.now(),
          messages: [],
          metadata: {
            totalMessages: 5,
            totalTokens: 1250,
            lastActive: Date.now()
          }
        }
      ],
      metadata: {
        requestId: Math.random().toString(36).substring(7),
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Real API Client Implementation
 * 
 * Will be implemented when backend is ready.
 * Currently throws "Not implemented" errors.
 */
class RealAPIClient {
  async login(partnerId: string, email: string): Promise<APIResponse<LoginResponse>> {
    throw new Error('Real API client not implemented yet');
  }

  async uploadFile(file: File, partnerId: string): Promise<APIResponse<UploadResponse>> {
    throw new Error('Real API client not implemented yet');
  }

  async query(query: string, partnerId: string): Promise<APIResponse<QueryResponse>> {
    throw new Error('Real API client not implemented yet');
  }

  async getConversations(partnerId: string): Promise<APIResponse<Conversation[]>> {
    throw new Error('Real API client not implemented yet');
  }
}

// Determine which implementation to use
const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';

// Export singleton instance
export const apiClient = useMockApi 
  ? new MockAPIClient()
  : new RealAPIClient();
