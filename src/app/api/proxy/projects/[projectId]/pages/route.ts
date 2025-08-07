import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// GET /api/proxy/projects/[projectId]/pages - Get pages
export async function GET(request: NextRequest, { params }: Params) {
  const url = new URL(request.url);
  const query = url.search;
  return proxyRequest(`/projects/${params.projectId}/pages${query}`, request);
}

// POST /api/proxy/projects/[projectId]/pages - Create page
export async function POST(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/pages`, request);
}