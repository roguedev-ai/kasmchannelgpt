import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingsInterface } from './embeddings';

interface QueryResult {
  content: string;
  pageContent?: string; // For backward compatibility
  metadata: {
    source: string | undefined;
    documentId: string | undefined;
    partnerId: string | undefined;
    uploadedAt: string | undefined;
    chunkIndex?: number;
    pageCount?: number;
    [key: string]: any;
  };
  score: number;
}

interface QueryOptions {
  topK?: number;
  minScore?: number;
}

export class QueryPipeline {
  private embeddings: EmbeddingsInterface;
  private qdrant: QdrantClient;

  constructor(embeddings: EmbeddingsInterface, qdrant: QdrantClient) {
    this.embeddings = embeddings;
    this.qdrant = qdrant;
  }

  async query(
    query: string,
    partnerId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult[]> {
    try {
      const { topK = 5, minScore = 0.7 } = options;

      console.log(`[Query] Processing query for partner: ${partnerId}`);
      console.log(`[Query] Query text: "${query.substring(0, 50)}..."`);
      
      // Generate query embedding
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      console.log(`[Query] Generated embedding, searching in collection: ${partnerId}`);
      
      // Search in Qdrant
      try {
        const searchResults = await this.qdrant.search(partnerId, {
          vector: queryEmbedding,
          limit: topK,
          score_threshold: minScore,
          with_payload: true,
        });

        console.log(`[Query] Found ${searchResults.length} results above score threshold`);

        // Format results
        return searchResults.map(result => {
          const content = result.payload?.text as string || '';
          return {
            content,
            pageContent: content, // For backward compatibility
            metadata: {
              source: result.payload?.document_title as string | undefined,
              documentId: result.payload?.document_id as string | undefined,
              partnerId: result.payload?.partner_id as string | undefined,
              uploadedAt: result.payload?.created_at as string | undefined,
              chunkIndex: result.payload?.chunk_index as number | undefined,
              pageCount: result.payload?.page_count as number | undefined,
            },
            score: result.score || 0,
          };
        });

      } catch (searchError: any) {
        // Handle collection not found gracefully
        if (searchError.status === 404 || searchError.message?.includes("doesn't exist")) {
          console.log(`[Query] Collection ${partnerId} not found`);
          return [];
        }
        throw searchError;
      }

    } catch (error) {
      console.error('[Query] Error:', error);
      throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async queryBatch(
    queries: string[],
    partnerId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult[][]> {
    try {
      console.log(`[Query] Processing ${queries.length} queries for partner: ${partnerId}`);
      
      // Generate embeddings for all queries
      const embeddings = await this.embeddings.embedDocuments(queries);
      
      // Search for each embedding
      const results = await Promise.all(
        embeddings.map(embedding =>
          this.qdrant.search(partnerId, {
            vector: embedding,
            limit: options.topK || 5,
            score_threshold: options.minScore || 0.7,
            with_payload: true,
          })
        )
      );

      // Format results
      return results.map(searchResults =>
        searchResults.map(result => {
          const content = result.payload?.text as string || '';
          return {
            content,
            pageContent: content, // For backward compatibility
            metadata: {
              source: result.payload?.document_title as string | undefined,
              documentId: result.payload?.document_id as string | undefined,
              partnerId: result.payload?.partner_id as string | undefined,
              uploadedAt: result.payload?.created_at as string | undefined,
              chunkIndex: result.payload?.chunk_index as number | undefined,
              pageCount: result.payload?.page_count as number | undefined,
            },
            score: result.score || 0,
          };
        })
      );

    } catch (error) {
      console.error('[Query] Batch query error:', error);
      throw new Error(`Batch query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const queryPipeline = new QueryPipeline(
  {} as EmbeddingsInterface, // Will be initialized later
  new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' })
);
