import { OpenAIEmbeddings } from '@langchain/openai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { backendConfig } from '../config/backend';

export type EmbeddingProvider = 'openai' | 'gemini';

export interface EmbeddingsClient {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
  getDimensions(): number;
  getProvider(): EmbeddingProvider;
}

class OpenAIEmbeddingsClient implements EmbeddingsClient {
  private embeddings: OpenAIEmbeddings;
  private dimensions: number = 1536;
  
  constructor(apiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: 'text-embedding-3-small',
    });
    console.log('[Embeddings] Initialized OpenAI embeddings (1536 dimensions)');
  }
  
  async embedDocuments(texts: string[]): Promise<number[][]> {
    return await this.embeddings.embedDocuments(texts);
  }
  
  async embedQuery(text: string): Promise<number[]> {
    return await this.embeddings.embedQuery(text);
  }
  
  getDimensions(): number {
    return this.dimensions;
  }
  
  getProvider(): EmbeddingProvider {
    return 'openai';
  }
}

class GeminiEmbeddingsClient implements EmbeddingsClient {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private dimensions: number = 768;
  
  constructor(apiKey: string) {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      modelName: 'text-embedding-004',
    });
    console.log('[Embeddings] Initialized Gemini embeddings (768 dimensions)');
  }
  
  async embedDocuments(texts: string[]): Promise<number[][]> {
    return await this.embeddings.embedDocuments(texts);
  }
  
  async embedQuery(text: string): Promise<number[]> {
    return await this.embeddings.embedQuery(text);
  }
  
  getDimensions(): number {
    return this.dimensions;
  }
  
  getProvider(): EmbeddingProvider {
    return 'gemini';
  }
}

/**
 * Factory to create embeddings client based on configuration
 */
export function createEmbeddingsClient(provider?: EmbeddingProvider): EmbeddingsClient {
  const selectedProvider = provider || backendConfig.embeddingProvider;
  
  console.log(`[Embeddings Factory] Creating client for provider: ${selectedProvider}`);
  
  switch (selectedProvider) {
    case 'gemini':
      if (!backendConfig.geminiApiKey) {
        throw new Error('GEMINI_API_KEY is required when using Gemini embeddings');
      }
      return new GeminiEmbeddingsClient(backendConfig.geminiApiKey);
    
    case 'openai':
    default:
      if (!backendConfig.openaiApiKey) {
        throw new Error('OPENAI_API_KEY or CUSTOMGPT_API_KEY is required when using OpenAI embeddings');
      }
      return new OpenAIEmbeddingsClient(backendConfig.openaiApiKey);
  }
}
