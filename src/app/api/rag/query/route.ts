import { NextRequest, NextResponse } from 'next/server';
import { QueryPipeline } from '@/lib/rag/query-pipeline';
import { partnerContext } from '@/lib/isolation/partner-context';
import { AgentFunction } from '@/lib/rag/agent-router';

const queryPipeline = new QueryPipeline();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const session = partnerContext.extractFromHeader(authHeader);
    
    const body = await request.json();
    const { query, conversationId, agentFunction } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Validate agentFunction if provided
    if (agentFunction && !['sales', 'support', 'technical', 'general'].includes(agentFunction)) {
      return NextResponse.json(
        { error: 'Invalid agent function' },
        { status: 400 }
      );
    }
    
    const queryRequest = {
      query,
      partnerId: session.partnerId,
      conversationId,
      agentFunction: agentFunction as AgentFunction | undefined,
    };
    
    const result = await queryPipeline.processQuery(queryRequest);
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('[Query API] Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
