import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  projectId: string;
  pageId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const url = new URL(request.url);
  const query = url.search;
  return proxyRequest(`/projects/${params.projectId}/pages/${params.pageId}/metadata${query}`, request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  return proxyRequest(`/projects/${params.projectId}/pages/${params.pageId}/metadata`, request);
}