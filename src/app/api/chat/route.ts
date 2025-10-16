import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QueryPipeline } from '@/lib/rag/query-pipeline';
import { createEmbeddings } from '@/lib/rag/embeddings';
import { partnerContext } from '@/lib/isolation/partner-context';
import { getCustomGPTClient } from '@/lib/customgpt';

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

    let relevantDocs: Array<{
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
          
          relevantDocs = results.map(r => ({
            content: r.content,
            source: r.metadata.source || 'Unknown',
            score: r.score,
            documentId: r.metadata.documentId || '',
          }));

          console.log('[Chat] Context built from sources:', relevantDocs.map(d => d.source));
        } else {
          console.log('[Chat] No relevant documents found for this query');
        }
      } catch (error) {
        console.error('[Chat] RAG retrieval error:', error);
        // Continue without RAG context
      }
    }

    try {
      const customGPT = getCustomGPTClient();
      
      // Build context from RAG results
      const ragContext = relevantDocs.length > 0 
        ? relevantDocs.map(doc => `Source: ${doc.source}\n${doc.content}`).join('\n\n')
        : undefined;

      // Generate conversation name based on first few words of question
      const conversationName = `${message.slice(0, 50)}${message.length > 50 ? '...' : ''} - ${new Date().toLocaleString()}`;

      console.log('[Chat] Sending to CustomGPT with', relevantDocs.length, 'context sources');
      
      const result = await customGPT.query(message, ragContext, conversationName);

      return NextResponse.json({
        response: result.data.openai_response,
        conversationId: result.data.conversation_id,
        sources: relevantDocs,
        citations: result.citations,
        usedRag: relevantDocs.length > 0,
        documentsFound: relevantDocs.length
      });
    } catch (error) {
      console.error('[Chat] CustomGPT Error:', error);
      
      // Provide detailed error messages
      let errorMessage = 'Failed to generate response';
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
