import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { collectionManager } from '@/lib/rag/collection-manager';
import { createEmbeddings } from '@/lib/rag/embeddings';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get partner ID from auth or default to 'demo'
    const partnerId = 'demo'; // TODO: Get from authenticated user
    const collectionName = partnerId;
    const documentId = uuidv4();

    console.log(`[Upload] Processing file: ${file.name} for partner: ${partnerId}`);

    // Ensure collection exists
    try {
      await collectionManager.ensureCollectionExists(collectionName);
      console.log(`[Upload] Collection ready: ${collectionName}`);
    } catch (error) {
      console.error('[Upload] Failed to ensure collection exists:', error);
      return NextResponse.json(
        { 
          error: 'Failed to initialize storage',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Read file content
    let text: string;
    let pages = 1;

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const pdf = (await import('pdf-parse')).default;
        const pdfData = await pdf(buffer);
        text = pdfData.text;
        pages = pdfData.numpages;
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: buffer });
        text = result.value;
        pages = Math.ceil(text.length / 3000); // Estimate pages
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        const decoder = new TextDecoder('utf-8');
        text = decoder.decode(bytes);
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' },
          { status: 400 }
        );
      }

      // Clean and validate text
      text = cleanText(text);
      if (!text || text.length < 10) {
        return NextResponse.json(
          { error: 'Could not extract text from file' },
          { status: 400 }
        );
      }

    } catch (error) {
      console.error('[Upload] Failed to read file:', error);
      return NextResponse.json(
        { 
          error: 'Failed to read file',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const docs = await textSplitter.createDocuments([text]);
    console.log(`[Upload] Split into ${docs.length} chunks`);

    // Generate embeddings
    try {
      const embeddings = createEmbeddings();
      const texts = docs.map(doc => doc.pageContent);
      const vectors = await embeddings.embedDocuments(texts);

      // Prepare points
      const points = docs.map((doc, index) => ({
        id: uuidv4(),
        vector: vectors[index],
        payload: {
          text: doc.pageContent,
          document_title: file.name,
          document_id: documentId,
          partner_id: partnerId,
          chunk_index: index,
          page_count: pages,
          created_at: new Date().toISOString(),
        },
      }));

      // Upload to Qdrant in batches
      const batchSize = 100;
      for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);
        await qdrant.upsert(collectionName, {
          wait: true,
          points: batch,
        });
        console.log(`[Upload] Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)}`);
      }

      console.log(`[Upload] Successfully processed document`);

      return NextResponse.json({
        success: true,
        filename: file.name,
        chunks: docs.length,
        pages: pages,
        documentId,
      });

    } catch (error) {
      console.error('[Upload] Failed to process document:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process document',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process file', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function cleanText(text: string): string {
  return text
    .normalize('NFC')  // Normalize Unicode
    .replace(/\x00/g, '')  // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')  // Control chars
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')  // Max 2 line breaks
    .replace(/\u00A0/g, ' ')  // Non-breaking space
    .replace(/[\u2018\u2019]/g, "'")  // Smart quotes
    .replace(/[\u201C\u201D]/g, '"')
    .trim();
}
