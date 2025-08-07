import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

// GET /api/proxy/user/profile - Get user profile
export async function GET(request: NextRequest) {
  return proxyRequest('/user', request);
}

// POST /api/proxy/user/profile - Update user profile
export async function POST(request: NextRequest) {
  // This endpoint expects FormData
  const formData = await request.formData();
  return proxyRequest('/user', request, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}