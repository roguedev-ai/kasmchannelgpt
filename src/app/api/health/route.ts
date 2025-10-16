import { NextResponse } from 'next/server';
import { backendConfig } from '../../../lib/config/backend';
import { collectionManager } from '../../../lib/rag/collection-manager';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      openai: false,
      qdrant: false,
      gemini: false
    },
    collections: [] as Array<{
      name: string;
      vectorCount: number;
      vectorSize: number;
    }>,
    config: {
      baseUrl: backendConfig.baseUrl || '',
      qdrantUrl: backendConfig.qdrantUrl || '',
    }
  };

  try {
    // Check OpenAI configuration
    if (backendConfig.openaiApiKey) {
      health.services.openai = true;
    }

    // Check Gemini configuration
    if (process.env.GEMINI_API_KEY) {
      health.services.gemini = true;
    }

    // Check Qdrant and list collections
    try {
      const collections = await collectionManager.listCollections();
      health.collections = collections;
      health.services.qdrant = true;
    } catch (qdrantError: any) {
      console.error('[Health] Qdrant check failed:', qdrantError);
      health.status = 'degraded';
      health.services.qdrant = false;
    }

    // Overall health status
    if (!health.services.gemini || !health.services.qdrant) {
      health.status = 'degraded';
    }

    return NextResponse.json(health);

  } catch (error: any) {
    console.error('[Health] Error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error',
        services: health.services
      },
      { status: 500 }
    );
  }
}
