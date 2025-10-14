import { QdrantClient as Qdrant } from '@qdrant/js-client-rest';
import { Document } from '@langchain/core/documents';
import { backendConfig } from '../config/backend';

export class QdrantClient {
  private client: Qdrant;
  
  constructor() {
    this.client = new Qdrant({
      url: backendConfig.qdrantUrl,
      timeout: backendConfig.qdrantTimeout || 30000,
    });
  }
  
  async healthCheck(): Promise<void> {
    try {
      // Try to list collections as a health check
      await this.client.getCollections();
    } catch (error) {
      throw new Error('Qdrant health check failed');
    }
  }
  
  async createCollection(name: string, dimensions: number): Promise<void> {
    try {
      await this.client.getCollection(name);
      console.log(`[Qdrant] Collection ${name} already exists`);
    } catch (error) {
      console.log(`[Qdrant] Creating collection ${name} (${dimensions}d)`);
      await this.client.createCollection(name, {
        vectors: {
          size: dimensions,
          distance: 'Cosine',
        },
      });
    }
  }
  
  async uploadVectors(collectionName: string, vectors: number[][], docs: Document[]): Promise<void> {
    if (!vectors.length || !docs.length) {
      return;
    }
    
    const points = vectors.map((vector, i) => ({
      id: Date.now() + i,
      vector,
      payload: {
        text: docs[i].pageContent,
        metadata: docs[i].metadata,
      },
    }));
    
    await this.client.upsert(collectionName, {
      wait: true,
      points,
    });
  }
  
  async search(collectionName: string, vector: number[]): Promise<Document[]> {
    const results = await this.client.search(collectionName, {
      vector,
      limit: 5,
    });
    
    return results.map(result => new Document({
      pageContent: (result.payload?.text as string) || '',
      metadata: (result.payload?.metadata as Record<string, any>) || {},
    }));
  }
}

// Export singleton instance
export const qdrantClient = new QdrantClient();
