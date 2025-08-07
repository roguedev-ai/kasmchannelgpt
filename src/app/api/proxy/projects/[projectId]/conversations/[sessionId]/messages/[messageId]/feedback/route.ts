import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    sessionId: string;
    messageId: string;
  };
}

// PUT /api/proxy/projects/[projectId]/conversations/[sessionId]/messages/[messageId]/feedback - Update feedback
export async function PUT(request: NextRequest, { params }: Params) {
  return proxyRequest(
    `/projects/${params.projectId}/conversations/${params.sessionId}/messages/${params.messageId}/feedback`,
    request
  );
}