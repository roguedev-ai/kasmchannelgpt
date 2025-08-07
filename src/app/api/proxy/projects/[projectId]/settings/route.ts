import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// GET /api/proxy/projects/[projectId]/settings - Get agent settings
export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/settings`, request);
}

// POST /api/proxy/projects/[projectId]/settings - Update agent settings
export async function POST(request: NextRequest, { params }: Params) {
  // Handle FormData for multipart requests
  const contentType = request.headers.get('content-type');
  const isFormData = contentType?.includes('multipart/form-data');
  
  if (isFormData) {
    const formData = await request.formData();
    return proxyRequest(`/projects/${params.projectId}/settings`, request, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }
  
  return proxyRequest(`/projects/${params.projectId}/settings`, request, {
    method: 'POST',
  });
}