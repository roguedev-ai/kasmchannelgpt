import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { queryPipeline } from '../../../../lib/rag/query-pipeline';
import { QueryRequest } from '../../../../types/backend';
import { customGPTClient } from '../../../../lib/api/customgpt-client';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const session = await partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );
    
    // Get request body
    const body = await request.json() as QueryRequest;
    
    // Validate request
    if (!body.query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Search documents
    const docs = await queryPipeline.query(body.query, session.user.partner_id);
    
    // Generate answer using CustomGPT
    let answer: string;

    if (docs.length > 0) {
      // Format context with source attribution
      const context = docs
        .map((doc, i) => `[Document ${i + 1}]\n${doc.pageContent}`)
        .join('\n\n---\n\n');
      
      // Build prompt that REQUIRES using the context
      const prompt = `You are a helpful assistant that answers questions based ONLY on the provided documents.

CONTEXT FROM UPLOADED DOCUMENTS:
${context}

CRITICAL INSTRUCTIONS:
- Answer using ONLY the information above
- If the answer is not in the context, say "I don't have information about that in the uploaded documents"
- Cite which document number you're referencing
- Do NOT use general knowledge

USER QUESTION: ${body.query}

ANSWER:`;
      
      try {
        // Call CustomGPT with context
        answer = await customGPTClient.query(body.query, prompt);
      } catch (error) {
        console.error('[Query] CustomGPT error:', error);
        // Fallback to simple response
        answer = `Based on the uploaded documents:\n\n${docs[0].pageContent}`;
      }
    } else {
      answer = 'I could not find any relevant information in the uploaded documents.';
    }
    
    // Return response
    return NextResponse.json({
      answer,
      conversationId: body.conversationId || `conv_${Date.now()}`,
    });
    
  } catch (error: any) {
    console.error('[Query] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process query', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
