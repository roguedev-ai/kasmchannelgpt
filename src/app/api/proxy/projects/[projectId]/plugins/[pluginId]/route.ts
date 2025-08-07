import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  projectId: string;
  pluginId: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  return proxyRequest(`/projects/${params.projectId}/plugins/${params.pluginId}`, request);
}