import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// POST /api/proxy/projects/[projectId]/upload - Upload file
export async function POST(request: NextRequest, { params }: Params) {
  const formData = await request.formData();
  
  return proxyRequest(`/projects/${params.projectId}/upload`, request, {
    body: formData,
    isFormData: true,
  });
}