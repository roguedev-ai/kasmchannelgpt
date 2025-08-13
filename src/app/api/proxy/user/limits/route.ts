import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/proxy/user/limits
 * Proxy for fetching user limits
 */
export async function GET(request: NextRequest) {
  return proxyRequest('/limits/usage', request);
}