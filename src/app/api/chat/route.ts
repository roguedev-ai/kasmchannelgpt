import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QueryPipeline } from '@/lib/rag/query-pipeline';
import { createEmbeddings } from '@/lib/rag/embeddings';
import { partnerContext } from '@/lib/isolation/partner-context';

const MODEL_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 2048,
};

// Try different model names until one works
let model: GenerativeModel;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

try {
  // Option 1: Try gemini-1.5-pro-latest first
  model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-pro-latest',
    generationConfig: MODEL_CONFIG,
  });
  console.log('[Chat] Using model: gemini-1.5-pro-latest');
} catch (e) {
  try {
    // Option 2: Fallback to gemini-pro
    model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: MODEL_CONFIG,
    });
    console.log('[Chat] Using model: gemini-pro');
  } catch (e2) {
    // Option 3: Try with models/ prefix
    model = genAI.getGenerativeModel({ 
      model: 'models/gemini-1.5-pro',
      generationConfig: MODEL_CONFIG,
    });
    console.log('[Chat] Using model: models/gemini-1.5-pro');
  }
}

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
              return `--- Document Excerpt ${idx + 1} (from: ${sourceName}, relevance: ${(result.score * 100).toFixed(0)}%) ---
${result.content}
---`;
            })
            .join('\n\n');
          
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
        // Continue without RAG context - will use general knowledge
      }
    }

    // Build the prompt
    let systemPrompt = `You are a helpful AI assistant that answers questions based on provided documents and your general knowledge.`;
    
    let userPrompt = message;

    if (context) {
      systemPrompt += `

IMPORTANT INSTRUCTIONS:
1. Use the document excerpts below to answer the user's question
2. When information comes from the documents, cite them (e.g., "According to the uploaded document..." or "Based on the provided documentation...")
3. If the documents don't fully answer the question, supplement with your general knowledge but clearly distinguish between document content and general knowledge
4. Be specific and detailed when information is available in the documents
5. If multiple documents are relevant, synthesize information from all of them

DOCUMENT EXCERPTS FROM UPLOADED FILES:
${context}

---`;
    } else {
      systemPrompt += `

Note: No relevant documents were found in the knowledge base for this query. I'll provide the best answer I can based on general knowledge.`;
    }

    const fullPrompt = `${systemPrompt}

USER QUESTION: ${userPrompt}

Please provide a helpful, detailed response:`;

    console.log('[Chat] Generating AI response...');
    console.log(`[Chat] Using ${sources.length > 0 ? sources.length + ' document sources' : 'general knowledge only'}`);

    // Generate response with better error handling
    let text = '';
    try {
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      text = response.text();
    } catch (modelError: any) {
      console.error('[Chat] Model generation error:', modelError);
      
      // If model fails, provide a helpful error message
      if (modelError.message?.includes('404') || modelError.message?.includes('not found')) {
        throw new Error('AI model configuration error. Please check GEMINI_API_KEY and model availability.');
      }
      throw modelError;
    }

    console.log('[Chat] Response generated successfully');
    console.log(`[Chat] Response length: ${text.length} characters`);

    return NextResponse.json({
      response: text,
      conversationId: conversationId || null,
      sources: sources.length > 0 ? sources : undefined,
      usedRag: sources.length > 0,
      documentsFound: sources.length,
    });

  } catch (error) {
    console.error('[Chat] Error:', error);
    
    // Provide detailed error messages
    let errorMessage = 'Failed to process message';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI API key is not configured or invalid';
        statusCode = 503;
      } else if (error.message.includes('quota')) {
        errorMessage = 'AI API quota exceeded - please try again later';
        statusCode = 429;
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = 'AI model not available - configuration issue';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: statusCode === 503 ? 'Check that GEMINI_API_KEY is set correctly' : undefined
      },
      { status: statusCode }
    );
  }
}
