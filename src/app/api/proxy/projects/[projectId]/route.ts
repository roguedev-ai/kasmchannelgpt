import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// GET /api/proxy/projects/[projectId] - Get agent by ID
export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}`, request);
}

// PUT /api/proxy/projects/[projectId] - Update agent
export async function PUT(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}`, request);
}

// DELETE /api/proxy/projects/[projectId] - Delete agent
export async function DELETE(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}`, request);
}