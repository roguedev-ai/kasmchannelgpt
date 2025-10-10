import { QdrantClient } from '@qdrant/qdrant-js';
import { backendConfig } from '../config/backend';
import { partnerContext } from '../isolation/partner-context';

export class QdrantClientWrapper {
  private client: QdrantClient;
  private embeddingDimension: number;
  
  constructor() {
    this.client = new QdrantClient({
      url: backendConfig.qdrantUrl,
      timeout: backendConfig.qdrantTimeout,
    });
    
    this.embeddingDimension = backendConfig.embeddingDimension;
    
    console.log(`[Qdrant] Initialized client: ${backendConfig.qdrantUrl}`);
  }
  
  /**
   * Ensure a collection exists for a partner
   */
  async ensureCollection(partnerId: string): Promise<void> {
    const collectionName = partnerContext.getNamespace(partnerId);
    
    try {
      // Check if collection exists
      const exists = await this.client.getCollection(collectionName);
      
      if (!exists) {
        console.log(`[Qdrant] Creating collection: ${collectionName}`);
        
        // Create collection with vector configuration
        await this.client.createCollection(collectionName, {
          vectors: {
            size: this.embeddingDimension,
            distance: 'Cosine', // Cosine similarity for semantic search
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        });
        
        console.log(`[Qdrant] Collection created: ${collectionName}`);
      } else {
        console.log(`[Qdrant] Collection exists: ${collectionName}`);
      }
    } catch (error) {
      console.error(`[Qdrant] Error ensuring collection: ${error}`);
      throw error;
    }
  }
  
  /**
   * Upsert vectors into partner's collection
   * SECURITY: partnerId used to compute collection name
   */
  async upsertVectors(
    partnerId: string,
    points: Array<{
      id: string;
      vector: number[];
      payload: any;
    }>
  ): Promise<void> {
    const collectionName = partnerContext.getNamespace(partnerId);
    
    // Ensure collection exists first
    await this.ensureCollection(partnerId);
    
    try {
      console.log(
        `[Qdrant] Upserting ${points.length} vectors to ${collectionName}`
      );
      
      await this.client.upsert(collectionName, {
        wait: true,
        points,
      });
      
      console.log(`[Qdrant] Successfully upserted vectors`);
    } catch (error) {
      console.error(`[Qdrant] Error upserting vectors: ${error}`);
      throw error;
    }
  }
  
  /**
   * Search vectors in partner's collection
   * SECURITY: Only searches the partner's isolated collection
   */
  async searchVectors(
    partnerId: string,
    queryVector: number[],
    limit: number = 5
  ): Promise<Array<{
    id: string;
    score: number;
    payload: any;
  }>> {
    const collectionName = partnerContext.getNamespace(partnerId);
    
    try {
      console.log(
        `[Qdrant] Searching ${collectionName} (limit: ${limit})`
      );
      
      const results = await this.client.search(collectionName, {
        vector: queryVector,
        limit,
        with_payload: true,
      });
      
      console.log(`[Qdrant] Found ${results.length} results`);
      
      return results.map(result => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload,
      }));
    } catch (error) {
      console.error(`[Qdrant] Error searching vectors: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get collection statistics
   */
  async getCollectionStats(partnerId: string): Promise<{
    vectorCount: number;
    collectionName: string;
  }> {
    const collectionName = partnerContext.getNamespace(partnerId);
    
    try {
      const info = await this.client.getCollection(collectionName);
      
      return {
        vectorCount: info.points_count || 0,
        collectionName,
      };
    } catch (error) {
      console.error(`[Qdrant] Error getting collection stats: ${error}`);
      throw error;
    }
  }
  
  /**
   * Delete a partner's entire collection
   * USE WITH CAUTION - This is permanent!
   */
  async deleteCollection(partnerId: string): Promise<void> {
    const collectionName = partnerContext.getNamespace(partnerId);
    
    try {
      console.log(`[Qdrant] DELETING collection: ${collectionName}`);
      
      await this.client.deleteCollection(collectionName);
      
      console.log(`[Qdrant] Collection deleted: ${collectionName}`);
    } catch (error) {
      console.error(`[Qdrant] Error deleting collection: ${error}`);
      throw error;
    }
  }
  
  /**
   * Health check - verify Qdrant is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list collections as a basic health check
      await this.client.getCollections();
      console.log('[Qdrant] Health check passed');
      return true;
    } catch (error) {
      console.error('[Qdrant] Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const qdrantClient = new QdrantClientWrapper();
