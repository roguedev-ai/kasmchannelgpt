import { Document } from '@langchain/core/documents';
import { createEmbeddingsClient, EmbeddingsClient } from './embeddings-factory';
import { qdrantClient } from './qdrant-client';

export class UploadHandler {
  private embeddings: EmbeddingsClient;
  private qdrant = qdrantClient;
  
  constructor() {
    this.embeddings = createEmbeddingsClient();
    console.log(`[Upload] Using ${this.embeddings.getProvider()} embeddings`);
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
    await this.qdrant.createCollection(partnerId, this.embeddings.getDimensions());
    
    // Create embeddings
    const texts = docs.map(doc => doc.pageContent);
    const embeddings = await this.embeddings.embedDocuments(texts);
    
    // Upload to Qdrant
    await this.qdrant.uploadVectors(partnerId, embeddings, docs);
  }
}

// Export singleton instance
export const uploadHandler = new UploadHandler();
