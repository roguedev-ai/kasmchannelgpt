import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const dbResult = await db.run(sql`SELECT 1 as connected`);
    
    // Check system status
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: !!dbResult,
        timestamp: new Date().toISOString(),
      },
      environment: {
        node_env: process.env.NODE_ENV,
        nextauth_url: process.env.NEXTAUTH_URL,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    return NextResponse.json(status, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Health Check] Error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
