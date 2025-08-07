import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// GET /api/proxy/projects/[projectId]/sources - Get sources
export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/sources`, request);
}

// POST /api/proxy/projects/[projectId]/sources - Create source
export async function POST(request: NextRequest, { params }: Params) {
  // Check if the request is FormData (file upload)
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return proxyRequest(`/projects/${params.projectId}/sources`, request, {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }
  
  // For regular JSON requests
  return proxyRequest(`/projects/${params.projectId}/sources`, request);
}