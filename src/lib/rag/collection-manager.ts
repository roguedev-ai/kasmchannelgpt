import { QdrantClient } from '@qdrant/js-client-rest';
import { backendConfig } from '../config/backend';

const EMBEDDING_DIMENSION = 768; // Gemini embedding-001

export class CollectionManager {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: backendConfig.qdrantUrl || 'http://localhost:6333',
      timeout: backendConfig.qdrantTimeout || 30000
    });
  }

  async ensureCollectionExists(collectionName: string): Promise<void> {
    try {
      console.log(`[Collection] Checking if collection '${collectionName}' exists`);
      
      try {
        // Try to get collection info directly
        const collectionInfo = await this.client.getCollection(collectionName);
        console.log(`[Collection] Found existing collection: ${collectionName}`, collectionInfo);
        
        // Validate collection configuration
        const vectorSize = collectionInfo.config?.params?.vectors?.size;
        if (typeof vectorSize !== 'number' || vectorSize !== EMBEDDING_DIMENSION) {
          throw new Error(
            `Collection ${collectionName} has wrong vector size: ` +
            `${vectorSize} (expected ${EMBEDDING_DIMENSION})`
          );
        }
        
        return;
        
      } catch (error: any) {
        // Collection doesn't exist, create it
        if (error.status === 404 || error.message?.includes("doesn't exist")) {
          console.log(`[Collection] Creating new collection: ${collectionName}`);
          
          await this.client.createCollection(collectionName, {
            vectors: {
              size: EMBEDDING_DIMENSION,
              distance: 'Cosine'
            },
            optimizers_config: {
              indexing_threshold: 20000
            },
            hnsw_config: {
              m: 16,
              ef_construct: 100
            }
          });
          
          console.log(`[Collection] Successfully created collection: ${collectionName}`);
          
          // Create payload indexes
          await this.createPayloadIndexes(collectionName);
          return;
        }
        
        // Some other error occurred while checking collection
        throw error;
      }
      
    } catch (error: any) {
      console.error(`[Collection] Failed to ensure collection exists:`, error);
      console.error(`[Collection] Error details:`, JSON.stringify(error, null, 2));
      throw new Error(`Collection initialization failed: ${error.message}`);
    }
  }

  private async createPayloadIndexes(collectionName: string): Promise<void> {
    try {
      console.log(`[Collection] Creating payload indexes for: ${collectionName}`);
      
      await this.client.createPayloadIndex(collectionName, {
        field_name: 'document_id',
        field_schema: 'keyword'
      });
      
      await this.client.createPayloadIndex(collectionName, {
        field_name: 'partner_id',
        field_schema: 'keyword'
      });
      
      console.log(`[Collection] Successfully created payload indexes for: ${collectionName}`);
      
    } catch (error: any) {
      console.error(`[Collection] Failed to create payload indexes:`, error);
      throw new Error(`Failed to create payload indexes: ${error.message}`);
    }
  }

  async listCollections(): Promise<{
    name: string;
    vectorCount: number;
    vectorSize: number;
  }[]> {
    try {
      console.log('[Collection] Listing all collections');
      
      const collections = await this.client.getCollections();
      const collectionDetails = await Promise.all(
        collections.collections.map(async (collection) => {
          const info = await this.client.getCollection(collection.name);
          const vectorSize = info.config?.params?.vectors?.size;
          if (typeof vectorSize !== 'number') {
            throw new Error(`Invalid vector size for collection ${collection.name}`);
          }
          return {
            name: collection.name,
            vectorCount: info.vectors_count || 0,
            vectorSize
          };
        })
      );
      
      console.log(`[Collection] Found ${collectionDetails.length} collections:`, 
        JSON.stringify(collectionDetails, null, 2));
      
      return collectionDetails;
      
    } catch (error: any) {
      console.error('[Collection] Failed to list collections:', error);
      throw new Error(`Failed to list collections: ${error.message}`);
    }
  }

  async deleteCollection(collectionName: string): Promise<void> {
    try {
      console.log(`[Collection] Deleting collection: ${collectionName}`);
      
      // Verify collection exists before attempting delete
      await this.client.getCollection(collectionName);
      
      await this.client.deleteCollection(collectionName);
      console.log(`[Collection] Successfully deleted collection: ${collectionName}`);
      
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`[Collection] Collection ${collectionName} does not exist, nothing to delete`);
        return;
      }
      
      console.error(`[Collection] Failed to delete collection:`, error);
      throw new Error(`Failed to delete collection: ${error.message}`);
    }
  }

  async getCollectionInfo(collectionName: string): Promise<{
    exists: boolean;
    vectorCount?: number;
    vectorSize?: number;
    error?: string;
  }> {
    try {
      const info = await this.client.getCollection(collectionName);
      const vectorSize = info.config?.params?.vectors?.size;
      return {
        exists: true,
        vectorCount: info.vectors_count || 0,
        vectorSize: typeof vectorSize === 'number' ? vectorSize : undefined
      };
    } catch (error: any) {
      if (error.status === 404) {
        return { exists: false };
      }
      return {
        exists: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const collectionManager = new CollectionManager();

// Export compatibility functions
export const ensureCollectionExists = (collectionName: string) => 
  collectionManager.ensureCollectionExists(collectionName);

export const listAllCollections = () => 
  collectionManager.listCollections();
