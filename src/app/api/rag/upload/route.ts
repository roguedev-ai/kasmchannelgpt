import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import mammoth from 'mammoth';
import { ensureCollectionExists } from '../../../../lib/rag/collection-manager';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const qdrant = new QdrantClient({ 
  url: process.env.QDRANT_URL || 'http://localhost:6333' 
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const session = await partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );

    // Get FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 413 }
      );
    }

    // CRITICAL: Read as ArrayBuffer, NOT text
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text: string;
    let pages = 1;

    // Extract text based on file type
    if (file.name.toLowerCase().endsWith('.pdf')) {
      // Dynamic import to avoid build issues
      const pdf = (await import('pdf-parse')).default;
      const pdfData = await pdf(buffer);
      text = cleanExtractedText(pdfData.text);
      pages = pdfData.numpages;
      
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      // Extract text from DOCX
      const result = await mammoth.extractRawText({ buffer: buffer });
      text = cleanExtractedText(result.value);
      pages = Math.ceil(text.length / 3000); // Estimate pages
      
    } else if (file.name.toLowerCase().endsWith('.txt')) {
      // For .txt files, decode properly
      const decoder = new TextDecoder('utf-8');
      text = cleanExtractedText(decoder.decode(bytes));
      
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' },
        { status: 400 }
      );
    }

    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: 'Could not extract text from file' },
        { status: 400 }
      );
    }

    // Chunk the document
    const chunks = chunkDocument(text);
    
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No content to process' },
        { status: 400 }
      );
    }

    // Ensure partner's collection exists
    await ensureCollectionExists(session.user.partner_id);

    // Generate embeddings and store
    const documentId = await embedAndStore(chunks, {
      filename: file.name,
      pages: pages,
      partnerId: session.user.partner_id
    });

    console.log(`[Upload] Processed ${chunks.length} chunks from ${file.name}`);

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunks: chunks.length,
      pages: pages,
      documentId: documentId
    });

  } catch (error: any) {
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process file', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// Essential text cleaning function
function cleanExtractedText(text: string): string {
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

// Document chunking with overlap
function chunkDocument(text: string): Array<{text: string; index: number}> {
  const chunks: Array<{text: string; index: number}> = [];
  const chunkSize = 512;  // tokens (roughly 2000 characters)
  const overlap = 50;     // token overlap
  
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    const paraLength = estimateTokens(paragraph);
    const currentLength = estimateTokens(currentChunk);
    
    if (currentLength + paraLength > chunkSize && currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++
      });
      
      // Add overlap
      const words = currentChunk.split(/\s+/);
      const overlapText = words.slice(-overlap).join(' ');
      currentChunk = overlapText + '\n\n' + paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex
    });
  }
  
  return chunks;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function embedAndStore(
  chunks: Array<{text: string; index: number}>,
  metadata: { filename: string; pages: number; partnerId: string }
) {
  const documentId = uuidv4();
  const collectionName = metadata.partnerId;
  
  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    // Generate embeddings
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const embeddings = await Promise.all(
      batch.map(chunk => 
        model.embedContent(chunk.text)
          .then(result => result.embedding.values)
      )
    );
    
    // Prepare points
    const points = batch.map((chunk, idx) => ({
      id: uuidv4(),
      vector: embeddings[idx],
      payload: {
        document_id: documentId,
        chunk_index: chunk.index,
        text: chunk.text,
        document_title: metadata.filename,
        page_count: metadata.pages,
        partner_id: metadata.partnerId,
        created_at: new Date().toISOString()
      }
    }));
    
    // Upload to Qdrant
    await qdrant.upsert(collectionName, {
      points: points,
      wait: true
    });
  }
  
  return documentId;
}
