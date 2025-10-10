import { NextRequest, NextResponse } from 'next/server';
import { qdrantClient } from '../../../lib/rag/qdrant-client';

export async function GET(request: NextRequest) {
  try {
    // Check Qdrant health
    const qdrantHealthy = await qdrantClient.healthCheck();
    
    // Check environment variables
    const envHealthy = !!(
      process.env.JWT_SECRET &&
      process.env.CUSTOMGPT_API_KEY &&
      process.env.QDRANT_URL &&
      process.env.OPENAI_API_KEY
    );
    
    const allHealthy = qdrantHealthy && envHealthy;
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks: {
        qdrant: qdrantHealthy,
        environment: envHealthy,
        requiredEnvVars: {
          JWT_SECRET: !!process.env.JWT_SECRET,
          CUSTOMGPT_API_KEY: !!process.env.CUSTOMGPT_API_KEY,
          QDRANT_URL: !!process.env.QDRANT_URL,
          OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        },
      },
      timestamp: new Date().toISOString(),
    }, { 
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
