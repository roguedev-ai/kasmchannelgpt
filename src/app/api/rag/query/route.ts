import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { queryPipeline } from '../../../../lib/rag/query-pipeline';
import { AuthenticationError } from '../../../../types/backend';
import { QueryRequest } from '../../../../types/backend';

export async function POST(request: NextRequest) {
  try {
    // Extract and verify JWT token
    const authHeader = request.headers.get('authorization');
    const session = partnerContext.extractFromHeader(authHeader);
    
    console.log(`[API] Query request from partner: ${session.partnerId}`);
    
    // Parse request body
    const body = await request.json();
    const { query, conversationId } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Processing query: "${query.substring(0, 50)}..."`);
    
    // Execute RAG query
    const queryRequest: QueryRequest = {
      query,
      partnerId: session.partnerId,
      conversationId,
    };
    
    const result = await queryPipeline.query(queryRequest);
    
    console.log(`[API] Query successful, returned ${result.sources.length} sources`);
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error: any) {
    console.error('[API] Query error:', error);
    
    // Handle specific error types
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: 'Authentication failed', message: error.message },
        { status: 401 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { error: 'Query failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
