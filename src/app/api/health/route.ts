import { NextResponse } from 'next/server';
import { backendConfig } from '../../../lib/config/backend';
import { qdrantClient } from '../../../lib/rag/qdrant-client';

export async function GET() {
  try {
    // Check required config
    if (!backendConfig.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    if (!backendConfig.baseUrl) {
      throw new Error('Base URL not configured');
    }
    
    // Check Qdrant connection
    await qdrantClient.healthCheck();
    
    return NextResponse.json({
      status: 'healthy',
      config: {
        openai: true,
        qdrant: true,
      },
    });
    
  } catch (error: any) {
    console.error('[Health] Error:', error);
    
    return NextResponse.json(
      { error: 'Health check failed', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
