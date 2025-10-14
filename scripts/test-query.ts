import { uploadHandler } from '../src/lib/rag/upload-handler';
import { queryPipeline } from '../src/lib/rag/query-pipeline';

async function main() {
  const partnerId = 'test_partner';
  
  try {
    // Upload test document
    const text = `
      The quick brown fox jumps over the lazy dog.
      This is a test document to verify the RAG pipeline.
      We'll search for specific terms to test the semantic search.
    `;
    
    await uploadHandler.processText(text, {
      source: 'test',
      type: 'text/plain',
    }, partnerId);
    
    console.log('✅ Test document uploaded');
    
    // Test queries
    const queries = [
      'What animal jumps?',
      'What is this document about?',
      'What kind of search are we testing?',
    ];
    
    for (const query of queries) {
      console.log(`\nQuery: ${query}`);
      const docs = await queryPipeline.query(query, partnerId);
      console.log('Results:', docs.map(doc => doc.pageContent));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
