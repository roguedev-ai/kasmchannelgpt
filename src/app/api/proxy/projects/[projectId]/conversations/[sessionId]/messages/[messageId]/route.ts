import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  projectId: string;
  sessionId: string;
  messageId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const url = new URL(request.url);
  const query = url.search;
  return proxyRequest(`/projects/${params.projectId}/conversations/${params.sessionId}/messages/${params.messageId}${query}`, request);
}