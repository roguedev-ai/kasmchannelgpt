import { qdrantClient } from '../src/lib/rag/qdrant-client';

async function testQdrant() {
  console.log('Testing Qdrant connection...');
  
  try {
    // Health check
    const healthy = await qdrantClient.healthCheck();
    console.log(`Health check: ${healthy ? 'PASS ✓' : 'FAIL ✗'}`);
    
    if (!healthy) {
      throw new Error('Health check failed - stopping tests');
    }
    
    // Test collection creation
    console.log('\nTesting collection creation...');
    await qdrantClient.ensureCollection('test_partner');
    console.log('Collection creation: PASS ✓');
    
    // Test vector upsert
    console.log('\nTesting vector upsert...');
    await qdrantClient.upsertVectors('test_partner', [
      {
        id: 'test-1',
        vector: Array(1536).fill(0.1), // 1536-dimensional test vector
        payload: {
          text: 'Test document',
          filename: 'test.txt',
          partnerId: 'test_partner',
          uploadedAt: new Date().toISOString(),
          chunkIndex: 0
        }
      }
    ]);
    console.log('Vector upsert: PASS ✓');
    
    // Test vector search
    console.log('\nTesting vector search...');
    const results = await qdrantClient.searchVectors(
      'test_partner',
      Array(1536).fill(0.1),
      1
    );
    console.log('Search results:', JSON.stringify(results, null, 2));
    console.log('Vector search: PASS ✓');
    
    // Get collection stats
    console.log('\nTesting collection stats...');
    const stats = await qdrantClient.getCollectionStats('test_partner');
    console.log('Collection stats:', stats);
    console.log('Collection stats: PASS ✓');
    
    // Clean up test collection
    console.log('\nCleaning up test collection...');
    await qdrantClient.deleteCollection('test_partner');
    console.log('Collection cleanup: PASS ✓');
    
    console.log('\n✓ All Qdrant tests passed successfully!');
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testQdrant().catch(console.error);
