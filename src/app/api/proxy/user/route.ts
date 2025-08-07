import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

// GET /api/proxy/user - Get user profile
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.search;
  return proxyRequest(`/user${query}`, request);
}

// POST /api/proxy/user - Update user profile  
export async function POST(request: NextRequest) {
  return proxyRequest('/user', request);
}