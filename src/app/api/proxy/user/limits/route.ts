import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

// GET /api/proxy/user/limits - Get user limits
export async function GET(request: NextRequest) {
  return proxyRequest('/user/limits', request);
}