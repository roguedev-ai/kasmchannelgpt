import { Document } from '@langchain/core/documents';
import { EmbeddingsFactory } from './embeddings-factory';
import { qdrantClient } from './qdrant-client';

export class UploadHandler {
  private embeddings: EmbeddingsFactory;
  private qdrant = qdrantClient;
  
  constructor() {
    this.embeddings = new EmbeddingsFactory();
  }
  
  async processText(text: string, metadata: any, partnerId: string): Promise<void> {
    // Create document
    const doc = new Document({
      pageContent: text,
      metadata,
    });
    
    await this.processDocs([doc], partnerId);
  }
  
  async processFile(file: File, partnerId: string): Promise<void> {
    const text = await file.text();
    
    // Create document
    const doc = new Document({
      pageContent: text,
      metadata: {
        source: file.name,
        type: file.type,
        size: file.size,
      },
    });
    
    await this.processDocs([doc], partnerId);
  }
  
  private async processDocs(docs: Document[], partnerId: string): Promise<void> {
    // Ensure collection exists
    await this.qdrant.createCollection(partnerId);
    
    // Create embeddings
    const texts = docs.map(doc => doc.pageContent);
    const embeddings = await this.embeddings.embedDocuments(texts);
    
    // Upload to Qdrant
    await this.qdrant.uploadVectors(partnerId, embeddings, docs);
  }
}

// Export singleton instance
export const uploadHandler = new UploadHandler();
