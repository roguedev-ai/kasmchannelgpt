import { createEmbeddingsClient } from '../src/lib/rag/embeddings-factory';

async function testGeminiEmbeddings() {
  try {
    // Set environment variables for testing
    process.env.EMBEDDING_PROVIDER = 'gemini';
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Please set GEMINI_API_KEY environment variable before running the test');
    }

    console.log('Creating Gemini embeddings client...');
    const client = createEmbeddingsClient();
    
    console.log('Testing single query embedding...');
    const queryText = 'Hello, this is a test query';
    const embedding = await client.embedQuery(queryText);
    console.log('Successfully generated embedding with dimensions:', embedding.length);
    
    console.log('Testing batch document embeddings...');
    const documents = [
      'This is the first test document',
      'This is the second test document',
      'This is the third test document'
    ];
    const embeddings = await client.embedDocuments(documents);
    console.log('Successfully generated embeddings for', embeddings.length, 'documents');
    console.log('Each embedding has dimensions:', embeddings[0].length);
    
    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Error testing Gemini embeddings:', error);
    process.exit(1);
  }
}

testGeminiEmbeddings();
