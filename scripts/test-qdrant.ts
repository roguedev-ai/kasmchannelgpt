import { qdrantClient } from '../src/lib/rag/qdrant-client';

async function main() {
  try {
    // Test health check
    await qdrantClient.healthCheck();
    console.log('✅ Qdrant health check passed');
    
    // Test collection creation
    const collectionName = 'test_collection';
    await qdrantClient.createCollection(collectionName);
    console.log('✅ Collection created');
    
    // Test vector upload
    const vectors = [
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ];
    
    const docs = [
      { pageContent: 'Test document 1', metadata: { source: 'test1' } },
      { pageContent: 'Test document 2', metadata: { source: 'test2' } },
    ];
    
    await qdrantClient.uploadVectors(collectionName, vectors, docs);
    console.log('✅ Vectors uploaded');
    
    // Test search
    const results = await qdrantClient.search(collectionName, [0.1, 0.2, 0.3]);
    console.log('✅ Search successful');
    console.log('Results:', results);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
