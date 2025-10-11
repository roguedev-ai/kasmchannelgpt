import { NextResponse } from 'next/server';
import { qdrantClient } from '@/lib/rag/qdrant-client';
import { backendConfig } from '@/lib/config/backend';

export async function GET() {
  const checks = {
    qdrant: await qdrantClient.healthCheck(),
    environment: true,
    requiredEnvVars: {
      JWT_SECRET: !!backendConfig.jwtSecret,
      CUSTOMGPT_API_KEY: !!backendConfig.customGptApiKey,
      QDRANT_URL: !!backendConfig.qdrantUrl,
      OPENAI_API_KEY: !!backendConfig.openaiApiKey,
    },
  };

  // System is healthy if either Qdrant is available or we're using mock data
  const isHealthy = checks.environment && 
    Object.values(checks.requiredEnvVars).every(Boolean);

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
    mode: checks.qdrant ? 'production' : 'mock',
  }, {
    status: isHealthy ? 200 : 503,
  });
}
