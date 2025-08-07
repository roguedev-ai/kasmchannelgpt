import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  return proxyRequest(`/preview/${params.id}`, request);
}