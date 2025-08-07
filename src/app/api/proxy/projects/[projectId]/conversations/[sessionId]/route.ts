import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    sessionId: string;
  };
}

// PUT /api/proxy/projects/[projectId]/conversations/[sessionId] - Update conversation
export async function PUT(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/conversations/${params.sessionId}`, request);
}

// DELETE /api/proxy/projects/[projectId]/conversations/[sessionId] - Delete conversation
export async function DELETE(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/conversations/${params.sessionId}`, request);
}