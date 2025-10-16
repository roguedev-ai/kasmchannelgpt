import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { queryPipeline } from '../../../../lib/rag/query-pipeline';
import { QueryRequest } from '../../../../types/backend';
import { customGPTClient } from '../../../../lib/api/customgpt-client';
import { ensureCollectionExists } from '../../../../lib/rag/collection-manager';

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
    
    // Ensure collection exists (in case it's a new partner)
    await ensureCollectionExists(session.user.partner_id);

    // Search documents
    const docs = await queryPipeline.query(body.query, session.user.partner_id);
    
    // Generate answer using CustomGPT
    let answer: string;

    if (docs.length > 0) {
      // Build context - LIMIT to prevent 422 errors
      const MAX_CONTEXT_LENGTH = 6000; // Leave room for prompt + question
      
      let context = '';
      let docCount = 0;
      
      for (const doc of docs) {
        const docText = `[Document ${docCount + 1}]\n${doc.pageContent}\n\n`;
        
        // Check if adding this doc would exceed limit
        if (context.length + docText.length > MAX_CONTEXT_LENGTH) {
          break; // Stop adding more docs
        }
        
        context += docText;
        docCount++;
      }
      
      // Truncate if still too long (safety check)
      if (context.length > MAX_CONTEXT_LENGTH) {
        context = context.substring(0, MAX_CONTEXT_LENGTH) + '\n\n[Context truncated...]';
      }
      
      // Build prompt that REQUIRES using the context
      const prompt = `CONTEXT FROM UPLOADED DOCUMENTS:
${context}

INSTRUCTIONS:
- Answer using ONLY the information above
- If the answer is not in the context, say "I don't have information about that in the uploaded documents"
- Cite which document number you're referencing

USER QUESTION: ${body.query}`;
      
      try {
        // Call CustomGPT with the limited context
        answer = await customGPTClient.query(body.query, context);
      } catch (error) {
        console.error('[Query] CustomGPT error:', error);
        // Fallback to simple response
        answer = `Based on the uploaded documents:\n\n${docs[0].pageContent.substring(0, 500)}...`;
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
