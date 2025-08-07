import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  projectId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  return proxyRequest(`/projects/${params.projectId}/replicate`, request);
}