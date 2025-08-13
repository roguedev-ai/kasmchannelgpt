/**
 * Demo Usage Stats API
 * 
 * Returns current usage statistics for free trial sessions.
 * Only accessible in free trial mode.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUsageStats } from '@/lib/api/demo-limits-middleware';
import { DEMO_API_HEADERS } from '@/lib/constants/demo-limits';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if this is a free trial request
    const isFreeTrialMode = request.headers.get(DEMO_API_HEADERS.FREE_TRIAL) === 'true';
    
    if (!isFreeTrialMode) {
      return NextResponse.json(
        { error: 'This endpoint is only available in free trial mode' },
        { status: 403 }
      );
    }
    
    // Get session ID
    const sessionId = request.headers.get(DEMO_API_HEADERS.SESSION_ID);
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }
    
    // Get usage stats
    const stats = getSessionUsageStats(sessionId);
    
    // Also get session info from request
    const sessionStartTime = request.headers.get('X-Session-Start-Time');
    const startTime = sessionStartTime ? parseInt(sessionStartTime, 10) : Date.now();
    
    return NextResponse.json({
      status: 'success',
      data: {
        usage: stats,
        session: {
          sessionId,
          startTime,
          expiresAt: startTime + (1 * 60 * 1000), // 1 minute for testing
          remainingTime: Math.max(0, (startTime + (1 * 60 * 1000)) - Date.now())
        }
      }
    });
  } catch (error) {
    console.error('[Demo Usage API] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}