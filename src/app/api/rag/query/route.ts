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
      // Build context from all relevant documents
      const context = docs.map(doc => doc.pageContent).join('\n\n---\n\n');
      
      try {
        // Call CustomGPT with context
        answer = await customGPTClient.query(body.query, context);
      } catch (error) {
        console.error('[Query] CustomGPT error:', error);
        // Fallback to simple response
        answer = `Based on the documents, here's what I found:\n\n${docs[0].pageContent}`;
      }
    } else {
      answer = 'I could not find any relevant information in the documents.';
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
