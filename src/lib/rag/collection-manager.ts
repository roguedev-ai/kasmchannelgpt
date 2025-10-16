import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({ 
  url: process.env.QDRANT_URL || 'http://localhost:6333' 
});

const EMBEDDING_DIMENSION = 768; // Gemini embedding-001

export async function ensureCollectionExists(collectionName: string): Promise<void> {
  try {
    // Check if collection exists
    const exists = await qdrant.collectionExists(collectionName);
    
    if (!exists) {
      console.log(`[Qdrant] Creating collection: ${collectionName}`);
      
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
      
      // Create payload indexes for filtering
      await qdrant.createPayloadIndex(collectionName, {
        field_name: 'document_id',
        field_schema: 'keyword'
      });
      
      await qdrant.createPayloadIndex(collectionName, {
        field_name: 'partner_id',
        field_schema: 'keyword'
      });
      
      console.log(`[Qdrant] Collection created: ${collectionName}`);
    }
  } catch (error) {
    console.error(`[Qdrant] Error ensuring collection exists:`, error);
    throw error;
  }
}

export async function listAllCollections(): Promise<string[]> {
  const response = await qdrant.getCollections();
  return response.collections.map(c => c.name);
}

export async function deleteCollection(collectionName: string): Promise<void> {
  console.log(`[Qdrant] Deleting collection: ${collectionName}`);
  await qdrant.deleteCollection(collectionName);
}
