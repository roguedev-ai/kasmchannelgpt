import { Document } from '@langchain/core/documents';
import { createEmbeddingsClient, EmbeddingsClient } from './embeddings-factory';
import { qdrantClient } from './qdrant-client';

export class QueryPipeline {
  private embeddings: EmbeddingsClient;
  private qdrant = qdrantClient;
  
  constructor() {
    this.embeddings = createEmbeddingsClient();
    console.log(`[Query] Using ${this.embeddings.getProvider()} embeddings`);
  }
  
  async query(text: string, partnerId: string): Promise<Document[]> {
    // Create embedding
    const embedding = await this.embeddings.embedQuery(text);
    
    // Search Qdrant
    const results = await this.qdrant.search(partnerId, embedding);
    
    return results;
  }
}

// Export singleton instance
export const queryPipeline = new QueryPipeline();
