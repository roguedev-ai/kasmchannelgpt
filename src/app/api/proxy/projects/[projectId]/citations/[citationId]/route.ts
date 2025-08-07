import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    citationId: string;
  };
}

// GET /api/proxy/projects/[projectId]/citations/[citationId] - Get citation
export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/citations/${params.citationId}`, request);
}