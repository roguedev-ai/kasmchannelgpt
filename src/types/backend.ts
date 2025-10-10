// Partner authentication types
export interface PartnerSession {
  partnerId: string;
  email: string;
  namespace: string;  // Computed: partner_{partnerId}
  exp: number;
  iat: number;
}

export interface LoginRequest {
  partnerId: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  partnerId: string;
  namespace: string;
  expiresAt: string;
}

// File upload types
export interface UploadRequest {
  file: File;
  partnerId: string;
}

export interface UploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  chunkCount: number;
  namespace: string;
}

// Query types
export interface QueryRequest {
  query: string;
  partnerId: string;
  conversationId?: string;
}

export interface QueryResponse {
  answer: string;
  sources: DocumentSource[];
  conversationId: string;
}

export interface DocumentSource {
  text: string;
  filename: string;
  score: number;
  chunkIndex: number;
}

// Qdrant types
export interface QdrantDocument {
  id: string;
  vector: number[];
  payload: {
    text: string;
    filename: string;
    partnerId: string;
    uploadedAt: string;
    chunkIndex: number;
    metadata?: Record<string, any>;
  };
}

// Error types
export class IsolationViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IsolationViolationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
