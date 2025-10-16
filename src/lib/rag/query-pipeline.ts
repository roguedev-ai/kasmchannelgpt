import { Document } from '@langchain/core/documents';
import { EmbeddingsInterface } from '@langchain/core/embeddings';
import { QdrantVectorStore } from '@langchain/qdrant';
import { QdrantClient } from '@qdrant/js-client-rest';

interface DocumentPayload {
  text: string;
  document_id: string;
  document_title: string;
  page_count: number;
  partner_id: string;
  created_at: string;
}

interface QdrantSearchResult {
  id: string | number;
  version: number;
  score: number;
  payload?: Record<string, unknown>;
  vector?: number[];
}

function isValidPayload(payload: unknown): payload is DocumentPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'text' in payload &&
    'document_id' in payload &&
    'document_title' in payload &&
    'page_count' in payload &&
    'partner_id' in payload &&
    'created_at' in payload &&
    typeof (payload as any).text === 'string' &&
    typeof (payload as any).document_id === 'string' &&
    typeof (payload as any).document_title === 'string' &&
    typeof (payload as any).page_count === 'number' &&
    typeof (payload as any).partner_id === 'string' &&
    typeof (payload as any).created_at === 'string'
  );
}

export class QueryPipeline {
  private embeddings: EmbeddingsInterface;
  private qdrant: QdrantClient;
  
  constructor(embeddings: EmbeddingsInterface, qdrant: QdrantClient) {
    this.embeddings = embeddings;
    this.qdrant = qdrant;
  }
  
  async query(query: string, partnerId: string): Promise<Document[]> {
    try {
      console.log('[Query] Using gemini embeddings');
      
      // Generate query embedding
      const embedding = await this.embeddings.embedQuery(query);
      
      // Search in partner's collection
      try {
        const searchResults = await this.qdrant.search(partnerId, {
          vector: embedding,
          limit: 5,
          with_payload: true
        }) as QdrantSearchResult[];
        
        // Convert to Documents
        return searchResults
          .filter(result => result.payload && isValidPayload(result.payload))
          .map(result => {
            // We can safely cast here because we've validated the payload
            const validPayload = result.payload as unknown as DocumentPayload;
            return new Document({
              pageContent: validPayload.text,
              metadata: {
                document_id: validPayload.document_id,
                document_title: validPayload.document_title,
                page_count: validPayload.page_count,
                partner_id: validPayload.partner_id,
                created_at: validPayload.created_at,
                score: result.score
              }
            });
          });
        
      } catch (searchError: any) {
        // Handle collection not found gracefully
        if (searchError.status === 404 || searchError.message?.includes("doesn't exist")) {
          console.log(`[Query] Collection ${partnerId} is empty or doesn't exist yet`);
          return [];
        }
        throw searchError;
      }
      
    } catch (error) {
      console.error('[Query] Error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const queryPipeline = new QueryPipeline(
  // These will be initialized in embeddings-factory.ts
  {} as EmbeddingsInterface,
  new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' })
);
