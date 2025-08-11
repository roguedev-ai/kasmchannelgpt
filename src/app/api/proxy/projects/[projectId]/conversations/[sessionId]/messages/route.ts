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
  return proxyRequest(
    `/projects/${params.projectId}/conversations/${params.sessionId}/messages${query}`, 
    request,
    { method: 'GET' }
  );
}

// POST /api/proxy/projects/[projectId]/conversations/[sessionId]/messages - Send message
export async function POST(request: NextRequest, { params }: Params) {
  const url = new URL(request.url);
  const query = url.search;
  
  // Check if this is a streaming request from request body
  let isStream = false;
  let body: any;
  
  try {
    // Clone the request to avoid consuming the original body
    const clonedRequest = request.clone();
    body = await clonedRequest.json();
    isStream = body.stream === true;
  } catch (error) {
    console.error('[Proxy] Failed to parse request body:', error);
    // If parsing fails, assume non-streaming
    isStream = false;
  }
  
  return proxyRequest(
    `/projects/${params.projectId}/conversations/${params.sessionId}/messages${query}`,
    request,
    { 
      isStream,
      body: body, // Pass the parsed body to avoid re-parsing in proxy handler
      method: 'POST'
    }
  );
}