import { NextRequest, NextResponse } from 'next/server';
import { getApiHeaders } from '@/lib/api/headers';

interface ProxyOptions {
  method?: string;
  body?: any;
  isFormData?: boolean;
  isStream?: boolean;
}

/**
 * Generic proxy handler for CustomGPT API endpoints
 * Handles authentication, error responses, and streaming
 */
export async function proxyRequest(
  apiPath: string,
  request: NextRequest,
  options: ProxyOptions = {}
) {
  try {
    const apiUrl = `https://app.customgpt.ai/api/v1${apiPath}`;
    const method = options.method || request.method;
    
    // Build headers
    const headers: Record<string, string> = { ...getApiHeaders() };
    
    // Handle form data - don't set content-type for FormData
    if (options.isFormData) {
      delete headers['Content-Type'];
    }
    
    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    // Add body if present
    if (options.body !== undefined) {
      if (options.isFormData) {
        // For FormData, pass the body directly
        fetchOptions.body = options.body;
      } else {
        // For JSON, stringify the body
        fetchOptions.body = JSON.stringify(options.body);
      }
    } else if (method !== 'GET' && method !== 'HEAD') {
      // For non-GET requests without explicit body, try to get body from request
      try {
        const requestBody = await request.json();
        fetchOptions.body = JSON.stringify(requestBody);
      } catch {
        // If no JSON body, that's okay for some endpoints
      }
    }
    
    const response = await fetch(apiUrl, fetchOptions);
    
    // Handle streaming responses
    if (options.isStream && response.ok) {
      // For streaming, we need to return the response directly
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `API error: ${response.status}` };
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }
    
    // Handle successful responses
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // For non-JSON responses (e.g., file downloads)
      const data = await response.arrayBuffer();
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
        },
      });
    }
  } catch (error) {
    console.error(`[Proxy] Error for ${apiPath}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract path parameters and query string from URL
 */
export function extractPathAndQuery(
  request: NextRequest,
  basePath: string
): { path: string; query: string } {
  const url = new URL(request.url);
  const path = url.pathname.replace(basePath, '');
  const query = url.search;
  return { path, query };
}