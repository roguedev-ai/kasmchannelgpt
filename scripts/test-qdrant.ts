import { qdrantClient } from '../src/lib/rag/qdrant-client';
import { createEmbeddingsClient } from '../src/lib/rag/embeddings-factory';

async function main() {
  try {
    // Test health check
    await qdrantClient.healthCheck();
    console.log('✅ Qdrant health check passed');
    
    // Get dimensions from embeddings client
    const embeddings = createEmbeddingsClient();
    const dimensions = embeddings.getDimensions();
    
    // Test collection creation
    const collectionName = 'test_collection';
    await qdrantClient.createCollection(collectionName, dimensions);
    console.log('✅ Collection created');
    
    // Test vector upload
    const vectors = [
      Array(dimensions).fill(0.1),
      Array(dimensions).fill(0.2),
    ];
    
    const docs = [
      { pageContent: 'Test document 1', metadata: { source: 'test1' } },
      { pageContent: 'Test document 2', metadata: { source: 'test2' } },
    ];
    
    await qdrantClient.uploadVectors(collectionName, vectors, docs);
    console.log('✅ Vectors uploaded');
    
    // Test search
    const results = await qdrantClient.search(collectionName, Array(dimensions).fill(0.1));
    console.log('✅ Search successful');
    console.log('Results:', results);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
