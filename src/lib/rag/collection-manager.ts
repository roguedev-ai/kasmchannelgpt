import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({ 
  url: process.env.QDRANT_URL || 'http://localhost:6333' 
});

const EMBEDDING_DIMENSION = 768; // Gemini embedding-001

export async function ensureCollectionExists(collectionName: string): Promise<void> {
  try {
    console.log(`[Collection] Checking if collection '${collectionName}' exists`);
    
    // Check if collection exists
    const exists = await qdrant.collectionExists(collectionName);
    console.log(`[Collection] Collection '${collectionName}' exists: ${exists}`);
    
    if (!exists) {
      console.log(`[Collection] Creating collection: ${collectionName}`);
      
      try {
        // Create collection with proper configuration
        await qdrant.createCollection(collectionName, {
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
        
        // Create payload indexes for filtering
        await qdrant.createPayloadIndex(collectionName, {
          field_name: 'document_id',
          field_schema: 'keyword'
        });
        
        await qdrant.createPayloadIndex(collectionName, {
          field_name: 'partner_id',
          field_schema: 'keyword'
        });
        
        console.log(`[Collection] Payload indexes created for: ${collectionName}`);
      } catch (createError: any) {
        console.error(`[Collection] Failed to create collection '${collectionName}':`, createError);
        console.error(`[Collection] Error details:`, JSON.stringify(createError, null, 2));
        throw new Error(`Failed to create collection: ${createError.message}`);
      }
    }
  } catch (error: any) {
    console.error(`[Collection] CRITICAL ERROR ensuring collection '${collectionName}' exists:`, error);
    console.error(`[Collection] Error details:`, JSON.stringify(error, null, 2));
    throw new Error(`Collection initialization failed: ${error.message}`);
  }
}

export async function listAllCollections(): Promise<string[]> {
  try {
    console.log('[Collection] Listing all collections');
    const response = await qdrant.getCollections();
    const collections = response.collections.map(c => c.name);
    console.log(`[Collection] Found ${collections.length} collections:`, collections);
    return collections;
  } catch (error: any) {
    console.error('[Collection] Failed to list collections:', error);
    throw new Error(`Failed to list collections: ${error.message}`);
  }
}

export async function deleteCollection(collectionName: string): Promise<void> {
  try {
    console.log(`[Collection] Deleting collection: ${collectionName}`);
    await qdrant.deleteCollection(collectionName);
    console.log(`[Collection] Successfully deleted collection: ${collectionName}`);
  } catch (error: any) {
    console.error(`[Collection] Failed to delete collection '${collectionName}':`, error);
    throw new Error(`Failed to delete collection: ${error.message}`);
  }
}
