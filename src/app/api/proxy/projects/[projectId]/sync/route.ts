import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// POST /api/proxy/projects/[projectId]/sync - Sync agent data
export async function POST(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/sync`, request);
}