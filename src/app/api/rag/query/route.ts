import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QueryPipeline } from '@/lib/rag/query-pipeline';
import { createEmbeddings } from '@/lib/rag/embeddings';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, conversationId, options } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get partner ID from auth or default to 'demo'
    const partnerId = 'demo'; // TODO: Get from authenticated user

    console.log(`[Query] Processing query for partner: ${partnerId}`);

    // Create embeddings and query pipeline
    const embeddings = createEmbeddings();
    const queryPipeline = new QueryPipeline(embeddings, qdrant);

    // Execute query with options
    const results = await queryPipeline.query(query, partnerId, {
      topK: options?.topK || 5,
      minScore: options?.minScore || 0.3, // Lower threshold for better recall
    });

    console.log(`[Query] Found ${results.length} results`);

    // Format response
    const response = {
      results: results.map(result => ({
        content: result.content,
        metadata: {
          ...result.metadata,
          score: result.score,
        },
      })),
      query,
      conversationId: conversationId || null,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Query] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process query',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
