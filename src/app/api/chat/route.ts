import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QueryPipeline } from '@/lib/rag/query-pipeline';
import { createEmbeddings } from '@/lib/rag/embeddings';
import { partnerContext } from '@/lib/isolation/partner-context';
import { CustomGPTClient } from '@/lib/customgpt';

// Initialize CustomGPT client
const customGPT = new CustomGPTClient(
  process.env.CUSTOMGPT_API_KEY || '',
  process.env.CUSTOMGPT_PROJECT_ID || ''
);

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const session = await partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );

    const body = await request.json();
    const { message, conversationId, useRag = true } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const partnerId = session.user.partner_id;
    console.log(`[Chat] Processing message for partner: ${partnerId}`);
    console.log(`[Chat] Message: "${message.substring(0, 100)}..."`);
    console.log(`[Chat] RAG enabled: ${useRag}`);

    let context = '';
    let sources: Array<{
      content: string;
      source: string;
      score: number;
      documentId: string;
    }> = [];

    // Retrieve relevant document chunks via RAG
    if (useRag) {
      try {
        console.log('[Chat] Retrieving relevant document chunks...');
        
        const embeddings = createEmbeddings();
        const queryPipeline = new QueryPipeline(embeddings, qdrant);
        
        const results = await queryPipeline.query(message, partnerId, {
          topK: 5,
          minScore: 0.4, // Lower threshold for better recall
        });

        if (results.length > 0) {
          console.log(`[Chat] Found ${results.length} relevant chunks from documents`);
          
          // Build context with clear source attribution
          context = results
            .map((result, idx) => {
              const sourceName = result.metadata.source || 'Unknown';
              return `[Source ${idx + 1}] ${result.content}\nFrom: ${sourceName} (Relevance: ${(result.score * 100).toFixed(0)}%)\n`;
            })
            .join('\n');
          
          sources = results.map(r => ({
            content: r.content.substring(0, 300) + (r.content.length > 300 ? '...' : ''),
            source: r.metadata.source || 'Unknown',
            score: r.score,
            documentId: r.metadata.documentId || '',
          }));

          console.log('[Chat] Context built from sources:', sources.map(s => s.source));
        } else {
          console.log('[Chat] No relevant documents found for this query');
        }
      } catch (error) {
        console.error('[Chat] RAG retrieval error:', error);
        // Continue without RAG context
      }
    }

    console.log('[Chat] Sending to CustomGPT...');

    // Generate response using CustomGPT
    try {
      const result = await customGPT.query(message, context);

      console.log('[Chat] Response received from CustomGPT');

      return NextResponse.json({
        response: result.data.openai_response,
        conversationId: result.data.conversation_id,
        sources: sources.length > 0 ? sources : undefined,
        usedRag: sources.length > 0,
        documentsFound: sources.length,
      });

    } catch (error) {
      console.error('[Chat] CustomGPT error:', error);
      
      // Provide detailed error messages
      let errorMessage = 'Failed to process message';
      let statusCode = 500;
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'CustomGPT API key is not configured or invalid';
          statusCode = 503;
        } else if (error.message.includes('project')) {
          errorMessage = 'CustomGPT project not found';
          statusCode = 503;
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'CustomGPT API rate limit exceeded';
          statusCode = 429;
        } else {
          errorMessage = error.message;
        }
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          details: error instanceof Error ? error.message : 'Unknown error',
          hint: statusCode === 503 ? 'Check CustomGPT configuration' : undefined
        },
        { status: statusCode }
      );
    }

  } catch (error) {
    console.error('[Chat] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
