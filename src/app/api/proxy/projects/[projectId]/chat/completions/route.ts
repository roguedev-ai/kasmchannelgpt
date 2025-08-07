import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// POST /api/proxy/projects/[projectId]/chat/completions - Send message in OpenAI format
export async function POST(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const isStream = body.stream === true;
  
  return proxyRequest(
    `/projects/${params.projectId}/chat/completions`,
    request,
    { isStream }
  );
}