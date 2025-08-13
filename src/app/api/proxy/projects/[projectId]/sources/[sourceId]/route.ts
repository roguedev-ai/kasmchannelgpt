import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    sourceId: string;
  };
}

// PUT /api/proxy/projects/[projectId]/sources/[sourceId] - Update source settings
export async function PUT(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/sources/${params.sourceId}`, request);
}

// DELETE /api/proxy/projects/[projectId]/sources/[sourceId] - Delete source
export async function DELETE(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/sources/${params.sourceId}`, request);
}