import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    id: string;
  };
}

// PUT /api/proxy/projects/[projectId]/license_keys/[id] - Update license key
export async function PUT(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/license_keys/${params.id}`, request);
}

// DELETE /api/proxy/projects/[projectId]/license_keys/[id] - Delete license key
export async function DELETE(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/license_keys/${params.id}`, request);
}