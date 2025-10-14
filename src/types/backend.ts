export class AuthenticationError extends Error {
  code: 'AUTHENTICATION_ERROR' = 'AUTHENTICATION_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  code: 'VALIDATION_ERROR' = 'VALIDATION_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface DocumentMetadata {
  source: string;
  type: string;
  [key: string]: any;
}

export interface QueryRequest {
  query: string;
  partnerId: string;
  conversationId?: string;
}

export interface QueryResponse {
  answer: string;
  conversationId: string;
}

export interface LoginResponse {
  token: string;
  partnerId: string;
  namespace: string;
  expiresAt: string;
}

export interface PartnerSession {
  user: {
    id: string;
    partner_id: string;
    email: string;
    name?: string;
  };
  token: string;
  expiresAt: string;
}
