import { fileUploadHandler } from '../src/lib/rag/upload-handler';
import * as fs from 'fs';
import * as path from 'path';

// Mock File class for Node.js environment
class MockFile {
  private content: string;
  public name: string;
  public type: string;
  public size: number;

  constructor(content: string, name: string, type: string) {
    this.content = content;
    this.name = name;
    this.type = type;
    this.size = Buffer.from(content).length;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    // Convert string to ArrayBuffer
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(this.content);
    return uint8Array.buffer;
  }
}

async function testUpload() {
  console.log('Testing file upload and processing...');
  
  try {
    // Create test content
    const testContent = `
    This is a test document for RAG processing.
    
    It contains multiple paragraphs to test chunking.
    Each paragraph should be processed separately.
    
    We want to verify:
    1. File validation
    2. Text extraction
    3. Chunking
    4. Embedding generation
    5. Vector storage in Qdrant
    
    The system should:
    - Split this content into appropriate chunks
    - Generate embeddings for each chunk
    - Store them in a partner-specific Qdrant collection
    - Clean up temporary files
    `;
    
    // Create mock File object directly from content
    const testFile = new MockFile(testContent, 'test.txt', 'text/plain') as unknown as File;
    
    console.log('\nProcessing test file...');
    const result = await fileUploadHandler.processUpload(testFile, 'test_partner');
    
    console.log('\nUpload result:', JSON.stringify(result, null, 2));
    console.log('\n✓ Upload test completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Upload test failed:', error);
    process.exit(1);
  }
}

// Run test
testUpload().catch(console.error);
