import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '100';
  
  return proxyRequest(
    `/projects/${params.projectId}/reports/intelligence?page=${page}&limit=${limit}`,
    request,
    {
      method: 'GET'
    }
  );
}