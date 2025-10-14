import { Document } from '@langchain/core/documents';
import { EmbeddingsFactory } from './embeddings-factory';
import { qdrantClient } from './qdrant-client';

export class QueryPipeline {
  private embeddings: EmbeddingsFactory;
  private qdrant = qdrantClient;
  
  constructor() {
    this.embeddings = new EmbeddingsFactory();
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
