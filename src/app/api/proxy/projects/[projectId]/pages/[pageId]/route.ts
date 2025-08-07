import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    pageId: string;
  };
}

// GET /api/proxy/projects/[projectId]/pages/[pageId] - Get page
export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/pages/${params.pageId}`, request);
}

// PUT /api/proxy/projects/[projectId]/pages/[pageId] - Update page
export async function PUT(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/pages/${params.pageId}`, request);
}

// DELETE /api/proxy/projects/[projectId]/pages/[pageId] - Delete page
export async function DELETE(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/pages/${params.pageId}`, request);
}