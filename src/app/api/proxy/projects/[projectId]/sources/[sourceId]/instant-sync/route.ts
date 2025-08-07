import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    sourceId: string;
  };
}

// PUT /api/proxy/projects/[projectId]/sources/[sourceId]/instant-sync - Instant sync source
export async function PUT(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/sources/${params.sourceId}/instant-sync`, request);
}