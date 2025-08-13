import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// GET /api/proxy/projects/[projectId] - Get agent by ID
export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}`, request);
}

// POST /api/proxy/projects/[projectId] - Update agent
export async function POST(request: NextRequest, { params }: Params) {
  // Check if the request contains FormData
  const contentType = request.headers.get('content-type') || '';
  const isFormData = contentType.includes('multipart/form-data');
  
  if (isFormData) {
    const formData = await request.formData();
    return proxyRequest(`/projects/${params.projectId}`, request, {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }
  
  return proxyRequest(`/projects/${params.projectId}`, request);
}

// PUT /api/proxy/projects/[projectId] - Update agent (legacy support)
export async function PUT(request: NextRequest, { params }: Params) {
  // Check if the request contains FormData
  const contentType = request.headers.get('content-type') || '';
  const isFormData = contentType.includes('multipart/form-data');
  
  if (isFormData) {
    const formData = await request.formData();
    return proxyRequest(`/projects/${params.projectId}`, request, {
      method: 'PUT',
      body: formData,
      isFormData: true
    });
  }
  
  return proxyRequest(`/projects/${params.projectId}`, request);
}

// DELETE /api/proxy/projects/[projectId] - Delete agent
export async function DELETE(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}`, request);
}