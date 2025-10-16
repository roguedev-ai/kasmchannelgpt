import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QueryPipeline } from '@/lib/rag/query-pipeline';
import { createEmbeddings } from '@/lib/rag/embeddings';
import { partnerContext } from '@/lib/isolation/partner-context';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

    console.log(`[Chat] Processing message with RAG: ${useRag}`);

    let context = '';
    let sources: Array<{
      content: string;
      source: string;
      score: number;
    }> = [];

    // Get RAG context if enabled
    if (useRag) {
      try {
        console.log(`[Chat] Retrieving RAG context for: "${message.substring(0, 50)}..."`);
        
        const embeddings = createEmbeddings();
        const queryPipeline = new QueryPipeline(embeddings, qdrant);
        
        const results = await queryPipeline.query(message, session.user.partner_id, {
          topK: 3,
          minScore: 0.5,
        });

        if (results.length > 0) {
          console.log(`[Chat] Found ${results.length} relevant documents`);
          
          // Build context from results
          context = results
            .map((result, idx) => `[Source ${idx + 1}]: ${result.content}`)
            .join('\n\n');
          
          sources = results.map(r => ({
            content: r.content.substring(0, 200) + '...',
            source: r.metadata.source || 'Unknown',
            score: r.score,
          }));
        } else {
          console.log('[Chat] No relevant documents found');
        }
      } catch (error) {
        console.error('[Chat] RAG retrieval error:', error);
        // Continue without RAG context
      }
    }

    // Build enhanced prompt
    let enhancedPrompt = message;
    
    if (context) {
      enhancedPrompt = `You are a helpful AI assistant with access to a knowledge base.

Context from knowledge base:
${context}

User question: ${message}

Please answer the question using the provided context when relevant. If the context doesn't contain enough information, say so and provide the best answer you can based on your general knowledge.`;
    }

    console.log('[Chat] Generating response');

    // Generate response
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;
    const text = response.text();

    console.log('[Chat] Response generated successfully');

    return NextResponse.json({
      response: text,
      conversationId: conversationId || null,
      sources: sources.length > 0 ? sources : undefined,
      usedRag: sources.length > 0,
    });

  } catch (error) {
    console.error('[Chat] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
