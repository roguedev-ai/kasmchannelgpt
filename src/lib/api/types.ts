/**
 * API Types
 * 
 * Type definitions for API requests and responses.
 */

// Common Response Type
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    requestId: string;
    timestamp: number;
  };
}

// Error Type
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Login Types
export interface LoginRequest {
  partnerId: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  partnerId: string;
  expiresAt: number;
  permissions: string[];
}

// Upload Types
export interface UploadRequest {
  file: File;
  partnerId: string;
  metadata?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: number;
  };
}

export interface UploadMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface UploadResponse {
  fileId: string;
  url?: string;
  metadata: UploadMetadata;
}

// Query Types
export interface QueryRequest {
  query: string;
  partnerId: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    includeSourceDetails?: boolean;
  };
}

export interface Source {
  id: string;
  fileId: string;
  fileName: string;
  snippet: string;
  pageNumber?: number;
  confidence: number;
  metadata?: {
    section?: string;
    category?: string;
    lastUpdated?: number;
  };
}

export interface QueryMetadata {
  tokensUsed: number;
  processingTime: number;
  modelVersion: string;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
  metadata: QueryMetadata;
}

// Conversation Types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ConversationMetadata {
  totalMessages: number;
  totalTokens: number;
  lastActive: number;
}

export interface Conversation {
  id: string;
  partnerId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  metadata: ConversationMetadata;
}
