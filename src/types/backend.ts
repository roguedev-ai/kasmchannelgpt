// Error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class IsolationViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IsolationViolationError';
  }
}

// Partner session type
export interface PartnerSession {
  partnerId: string;
  email: string;
  namespace: string;
  exp: number;
  iat: number;
}

// Login types
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

// Query types
export interface QueryRequest {
  query: string;
  partnerId: string;
  conversationId?: string;
}

export interface DocumentSource {
  text: string;
  filename: string;
  score: number;
  chunkIndex: number;
}

export interface QueryResponse {
  answer: string;
  sources: DocumentSource[];
  conversationId: string;
}
