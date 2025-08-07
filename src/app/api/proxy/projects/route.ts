import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

// GET /api/proxy/projects - Get all agents
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.search;
  return proxyRequest(`/projects${query}`, request);
}

// POST /api/proxy/projects - Create new agent
export async function POST(request: NextRequest) {
  return proxyRequest('/projects', request);
}