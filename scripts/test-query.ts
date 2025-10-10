import { queryPipeline } from '../src/lib/rag/query-pipeline';
import { fileUploadHandler } from '../src/lib/rag/upload-handler';
import * as fs from 'fs';

async function testQuery() {
  console.log('Testing RAG query pipeline...');
  
  try {
    // Step 1: Upload a test document
    const testContent = `
    Artificial Intelligence (AI) and Machine Learning

    AI is a broad field of computer science focused on creating intelligent machines 
    that can perform tasks that typically require human intelligence. These tasks 
    include visual perception, speech recognition, decision-making, and language 
    translation.

    Machine Learning is a subset of AI that focuses on developing systems that can 
    learn and improve from experience without being explicitly programmed. ML 
    algorithms can analyze data, identify patterns, and make predictions or decisions.

    Key ML Types:
    1. Supervised Learning: Models learn from labeled training data
    2. Unsupervised Learning: Models find patterns in unlabeled data
    3. Reinforcement Learning: Models learn through trial and error

    Applications:
    - Natural Language Processing
    - Computer Vision
    - Recommendation Systems
    - Autonomous Vehicles
    `;
    
    // Create test file
    const testFile = new File(
      [testContent],
      'ai_overview.txt',
      { type: 'text/plain' }
    );
    
    console.log('\nUploading test document...');
    const uploadResult = await fileUploadHandler.processUpload(
      testFile,
      'test_partner'
    );
    console.log('Upload result:', uploadResult);
    
    // Step 2: Test queries
    const queries = [
      'What is machine learning?',
      'What are the different types of machine learning?',
      'What are some applications of AI?',
      'What is quantum computing?', // Not in the document
    ];
    
    console.log('\nTesting queries...');
    for (const query of queries) {
      console.log(`\nQuery: "${query}"`);
      
      const result = await queryPipeline.query({
        query,
        partnerId: 'test_partner',
      });
      
      console.log('Answer:', result.answer);
      console.log('Sources:', result.sources.length);
      console.log('Conversation ID:', result.conversationId);
    }
    
    // Step 3: Test direct query (no RAG)
    console.log('\nTesting direct query (no RAG)...');
    const directResult = await queryPipeline.queryDirect(
      'What is the capital of France?'
    );
    console.log('Direct Answer:', directResult.answer);
    console.log('Conversation ID:', directResult.conversationId);
    
    console.log('\n✓ Query pipeline test completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Query pipeline test failed:', error);
    process.exit(1);
  }
}

// Run test
testQuery().catch(console.error);
