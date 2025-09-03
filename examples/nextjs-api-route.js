/**
 * Next.js API Route for CustomGPT Proxy
 * 
 * File location: pages/api/customgpt/[...path].js (Pages Router)
 *            OR: app/api/customgpt/[...path]/route.js (App Router)
 * 
 * This handles all CustomGPT API calls securely server-side
 * Usage: fetch('/api/customgpt/conversations', { method: 'POST', body: {...} })
 */

// For Pages Router (pages/api/customgpt/[...path].js)
export default async function handler(req, res) {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not configured in environment variables' 
    });
  }

  // Extract the CustomGPT API path from the dynamic route
  const { path } = req.query;
  const customgptPath = Array.isArray(path) ? path.join('/') : path;
  const customgptUrl = `${process.env.CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/${customgptPath}`;

  try {
    console.log(`[Next.js Proxy] ${req.method} ${customgptUrl}`);
    
    const response = await fetch(customgptUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(req.method !== 'GET' && req.method !== 'HEAD' && {
        body: JSON.stringify(req.body)
      })
    });

    // Handle streaming responses
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      res.writeHead(response.status, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          res.write(chunk);
        }
      } finally {
        reader.releaseLock();
        res.end();
      }
      return;
    }

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[Next.js Proxy Error]', error);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      details: error.message 
    });
  }
}

// For App Router (app/api/customgpt/[...path]/route.js)
export async function GET(request, { params }) {
  return handleCustomGPTRequest('GET', request, params);
}

export async function POST(request, { params }) {
  return handleCustomGPTRequest('POST', request, params);
}

export async function PUT(request, { params }) {
  return handleCustomGPTRequest('PUT', request, params);
}

export async function DELETE(request, { params }) {
  return handleCustomGPTRequest('DELETE', request, params);
}

async function handleCustomGPTRequest(method, request, { params }) {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'CUSTOMGPT_API_KEY not configured' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const customgptPath = params.path.join('/');
  const customgptUrl = `${process.env.CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/${customgptPath}`;

  try {
    const body = method !== 'GET' && method !== 'HEAD' ? await request.json() : undefined;
    
    const response = await fetch(customgptUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) })
    });

    // Handle streaming
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[App Router Proxy Error]', error);
    return new Response(
      JSON.stringify({ error: 'Proxy request failed', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}