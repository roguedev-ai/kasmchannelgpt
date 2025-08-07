import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// POST /api/proxy/projects/[projectId]/refresh_sitemap - Refresh sitemap
export async function POST(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/refresh_sitemap`, request);
}