import { OpenAIEmbeddings } from '@langchain/openai';
import { backendConfig } from '../config/backend';

export interface EmbeddingsClient {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
  getProvider(): string;
  getDimensions(): number;
}

class OpenAIEmbeddingsClient implements EmbeddingsClient {
  private embeddings: OpenAIEmbeddings;
  
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: backendConfig.openaiApiKey || backendConfig.customGptApiKey,
      modelName: 'text-embedding-ada-002',
      batchSize: 512,
      stripNewLines: true,
    });
  }
  
  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }
  
  async embedQuery(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }
  
  getProvider(): string {
    return 'openai';
  }
  
  getDimensions(): number {
    return 1536; // OpenAI ada-002 dimensions
  }
}

class GeminiEmbeddingsClient implements EmbeddingsClient {
  constructor() {
    if (!backendConfig.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is required for Gemini embeddings');
    }
  }
  
  async embedDocuments(texts: string[]): Promise<number[][]> {
    // TODO: Implement Gemini embeddings
    throw new Error('Gemini embeddings not yet implemented');
  }
  
  async embedQuery(text: string): Promise<number[]> {
    // TODO: Implement Gemini embeddings
    throw new Error('Gemini embeddings not yet implemented');
  }
  
  getProvider(): string {
    return 'gemini';
  }
  
  getDimensions(): number {
    return 768; // Gemini dimensions
  }
}

export function createEmbeddingsClient(): EmbeddingsClient {
  switch (backendConfig.embeddingProvider) {
    case 'openai':
      return new OpenAIEmbeddingsClient();
    case 'gemini':
      return new GeminiEmbeddingsClient();
    default:
      throw new Error(`Unknown embedding provider: ${backendConfig.embeddingProvider}`);
  }
}
