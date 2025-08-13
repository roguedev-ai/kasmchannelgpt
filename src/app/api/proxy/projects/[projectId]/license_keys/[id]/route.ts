import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    id: string;
  };
}

// PUT /api/proxy/projects/[projectId]/license_keys/[id] - Update license
export async function PUT(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/licenses/${params.id}`, request);
}

// DELETE /api/proxy/projects/[projectId]/license_keys/[id] - Delete license
export async function DELETE(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/licenses/${params.id}`, request);
}