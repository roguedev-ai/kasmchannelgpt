import { uploadHandler } from '../src/lib/rag/upload-handler';

async function main() {
  const partnerId = 'test_partner';
  
  try {
    // Test text upload
    const text = `
      This is a test document.
      It contains multiple lines of text.
      We'll use it to verify the upload pipeline.
    `;
    
    await uploadHandler.processText(text, {
      source: 'test',
      type: 'text/plain',
    }, partnerId);
    
    console.log('✅ Text upload successful');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
