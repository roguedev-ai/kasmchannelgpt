import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// GET /api/proxy/projects/[projectId]/plugins - Get plugins
export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/plugins`, request);
}

// POST /api/proxy/projects/[projectId]/plugins - Update plugins
export async function POST(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/plugins`, request);
}