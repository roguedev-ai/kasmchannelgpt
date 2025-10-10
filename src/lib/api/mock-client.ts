/**
 * Mock API Client
 * 
 * Simulates API responses for development.
 */

import type { 
  LoginResponse, 
  UploadResponse, 
  QueryResponse, 
  Conversation,
  APIResponse
} from './types';

class MockClient {
  async mockLogin(partnerId: string, email: string): Promise<APIResponse<LoginResponse>> {
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

  async mockUploadFile(file: File, partnerId: string): Promise<APIResponse<UploadResponse>> {
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

  async mockQuery(query: string, partnerId: string): Promise<APIResponse<QueryResponse>> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      data: {
        answer: `Mock response to: ${query}`,
        sources: [
          {
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
          }
        ],
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

  async mockGetConversations(partnerId: string): Promise<APIResponse<Conversation[]>> {
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

export const mockClient = new MockClient();
