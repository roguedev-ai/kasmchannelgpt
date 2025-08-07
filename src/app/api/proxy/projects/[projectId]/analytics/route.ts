import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api/proxy-handler';

interface Params {
  params: { projectId: string };
}

// GET /api/proxy/projects/[projectId]/analytics - Get analytics
export async function GET(request: NextRequest, { params }: Params) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const query = url.search;
  
  // Extract the specific report type from the URL
  // e.g., /api/proxy/projects/123/analytics/traffic_report -> traffic_report
  const analyticsPath = pathname.split('/analytics/')[1] || '';
  
  // Map old analytics endpoints to new reports endpoints
  const endpointMap: { [key: string]: string } = {
    'traffic_report': 'traffic',
    'queries_report': 'queries',
    'conversations_report': 'conversations',
    'analysis_report': 'analysis'
  };
  
  const mappedEndpoint = endpointMap[analyticsPath] || analyticsPath;
  const targetPath = mappedEndpoint ? `reports/${mappedEndpoint}` : 'reports';
  
  return proxyRequest(`/projects/${params.projectId}/${targetPath}${query}`, request);
}