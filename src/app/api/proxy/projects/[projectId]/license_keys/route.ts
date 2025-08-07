import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// GET /api/proxy/projects/[projectId]/license_keys - Get license keys
export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/license_keys`, request);
}

// POST /api/proxy/projects/[projectId]/license_keys - Create license key
export async function POST(request: NextRequest, { params }: Params) {
  return proxyRequest(`/projects/${params.projectId}/license_keys`, request);
}