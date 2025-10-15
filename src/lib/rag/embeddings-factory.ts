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
  private apiKey: string;
  private model: string = 'text-embedding-004';

  constructor() {
    if (!backendConfig.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is required for Gemini embeddings');
    }
    this.apiKey = backendConfig.geminiApiKey;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Process in batches to avoid rate limits
    for (const text of texts) {
      const embedding = await this.embedQuery(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        content: {
          parts: [{ text }]
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.embedding.values;
  }

  getProvider(): string {
    return 'gemini';
  }

  getDimensions(): number {
    return 768; // Gemini text-embedding-004 dimensions
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
