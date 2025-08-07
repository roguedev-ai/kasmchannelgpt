import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { 
    projectId: string;
    sessionId: string;
  };
}

// GET /api/proxy/projects/[projectId]/conversations/[sessionId]/messages - Get messages
export async function GET(request: NextRequest, { params }: Params) {
  const url = new URL(request.url);
  const query = url.search;
  return proxyRequest(`/projects/${params.projectId}/conversations/${params.sessionId}/messages${query}`, request);
}

// POST /api/proxy/projects/[projectId]/conversations/[sessionId]/messages - Send message
export async function POST(request: NextRequest, { params }: Params) {
  const url = new URL(request.url);
  const query = url.search;
  
  // Check if this is a streaming request from request body
  let isStream = false;
  try {
    const body = await request.json();
    isStream = body.stream === true;
    // Re-create the request with the same body since we consumed it
    const newRequest = new NextRequest(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(body),
    });
    
    return proxyRequest(
      `/projects/${params.projectId}/conversations/${params.sessionId}/messages${query}`,
      newRequest,
      { isStream }
    );
  } catch {
    // If no JSON body or parsing fails, fall back to regular request
    return proxyRequest(
      `/projects/${params.projectId}/conversations/${params.sessionId}/messages${query}`,
      request,
      { isStream: false }
    );
  }
}