import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    sourceId: string;
  };
}

// GET /api/proxy/projects/[projectId]/sources/[sourceId]/settings - Get source settings
export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/sources/${params.sourceId}/settings`, request);
}

// PUT /api/proxy/projects/[projectId]/sources/[sourceId]/settings - Update source settings
// Note: The actual API endpoint is /projects/{projectId}/sources/{sourceId} (without /settings)
export async function PUT(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/sources/${params.sourceId}`, request);
}