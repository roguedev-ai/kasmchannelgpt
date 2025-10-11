import { DocumentMetadata } from '../lib/rag/qdrant-client';
import { EmbeddingProvider } from '../lib/rag/embeddings-factory';
import { AgentFunction } from '../lib/rag/agent-router';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface QueryRequest {
  query: string;
  partnerId: string;
  conversationId?: string;
  agentFunction?: AgentFunction;
  topK?: number;
}

export interface QueryResponse {
  query: string;
  documents: DocumentMetadata[];
  answer: string;
  conversationId: string;
  metadata: {
    provider: EmbeddingProvider;
    dimensions: number;
    timestamp: string;
    agentFunction: AgentFunction;
  };
}
