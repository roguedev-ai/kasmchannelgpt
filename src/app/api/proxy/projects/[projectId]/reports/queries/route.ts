import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// GET /api/proxy/projects/[projectId]/reports/queries - Get queries report
export async function GET(request: NextRequest, { params }: Params) {
  const url = new URL(request.url);
  const query = url.search;
  return proxyRequest(`/projects/${params.projectId}/reports/queries${query}`, request);
}