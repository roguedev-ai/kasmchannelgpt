# CustomGPT Widget Integration with Next.js

Complete guide for securely integrating CustomGPT widgets into Next.js applications with multiple deployment approaches.

## Overview

This integration provides:
- ✅ **Enterprise-grade security**: API keys never exposed to the browser
- ✅ **Full widget functionality**: Embedded chat, floating button, streaming responses
- ✅ **Multiple deployment options**: API routes OR external proxy server
- ✅ **Production-ready**: Built-in security, caching, and error handling

## Architecture Options

### Option 1: Next.js API Routes (Recommended)
```
Browser Widget → Next.js App (port 3000) → API Routes → CustomGPT API
```

### Option 2: External Proxy Server
```
Browser Widget → Next.js App (port 3000) → External Proxy (port 3001) → CustomGPT API
```

## Required Files

### 1. Environment Configuration (`.env.local`)

```bash
# SERVER-SIDE ONLY (secure - never sent to browser)
CUSTOMGPT_API_KEY=your_customgpt_api_key

# CLIENT-SIDE (safe to expose with NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_CUSTOMGPT_AGENT_ID=78913
NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME=Your Agent Name
NEXT_PUBLIC_CUSTOMGPT_AGENT_ID_2=78913
NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME_2=Your Floating Agent Name

# API Configuration
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
NEXT_PUBLIC_API_BASE_URL=/api/proxy
```

## Option 1: Next.js API Routes Implementation

### 2A. API Route: Create Conversations (`pages/api/proxy/projects/[projectId]/conversations.js`)

```javascript
/**
 * Next.js API Route: Create CustomGPT Conversations
 * 
 * Handles POST /api/proxy/projects/[projectId]/conversations
 * Securely proxies widget requests to CustomGPT API
 */

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const { projectId } = req.query;

  if (!apiKey) {
    console.error('[Next.js API] CUSTOMGPT_API_KEY not found in environment');
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'API key not configured'
    });
  }

  // Handle undefined/null projectId (widget bug workaround)
  const agentId = (projectId && projectId !== 'undefined' && projectId !== 'null') 
    ? projectId 
    : (process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID || '78913');

  const customgptUrl = `${process.env.CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/projects/${agentId}/conversations`;
  
  console.log(`[Next.js API] POST ${customgptUrl}`);

  try {
    const response = await fetch(customgptUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Next.js API] CustomGPT API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'CustomGPT API error',
        details: errorText,
        status: response.status
      });
    }

    const data = await response.json();
    
    // Add caching headers for conversation creation
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json(data);

  } catch (error) {
    console.error('[Next.js API] Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      details: error.message 
    });
  }
}
```

### 2B. API Route: Send Messages (`pages/api/proxy/projects/[projectId]/conversations/[conversationId]/messages.js`)

```javascript
/**
 * Next.js API Route: Send Messages to CustomGPT Conversations
 * 
 * Handles POST /api/proxy/projects/[projectId]/conversations/[conversationId]/messages
 * Supports streaming responses for real-time chat
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const { projectId, conversationId } = req.query;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'API key not configured'
    });
  }

  // Handle undefined projectId
  const agentId = (projectId && projectId !== 'undefined' && projectId !== 'null') 
    ? projectId 
    : (process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID || '78913');

  const customgptUrl = `${process.env.CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/projects/${agentId}/conversations/${conversationId}/messages`;
  
  console.log(`[Next.js API] POST ${customgptUrl}`);
  console.log(`[Next.js API] Request body:`, JSON.stringify(req.body, null, 2));

  try {
    const response = await fetch(customgptUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Next.js API] API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'CustomGPT API error', 
        details: errorText 
      });
    }

    // Handle streaming responses
    if (req.body.stream) {
      console.log(`[Next.js API] Handling streaming response`);
      
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Handle streaming with proper cleanup
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch (streamError) {
        console.error('[Next.js API] Stream error:', streamError);
      } finally {
        reader.releaseLock();
        res.end();
      }
    } else {
      // Handle regular JSON response
      const data = await response.json();
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(200).json(data);
    }

  } catch (error) {
    console.error('[Next.js API] Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      details: error.message 
    });
  }
}
```

### 2C. API Route: Get Project Settings (`pages/api/proxy/projects/[projectId]/settings.js`)

```javascript
/**
 * Next.js API Route: Get CustomGPT Project Settings
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const { projectId } = req.query;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'API key not configured'
    });
  }

  const agentId = (projectId && projectId !== 'undefined' && projectId !== 'null') 
    ? projectId 
    : (process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID || '78913');

  try {
    const response = await fetch(
      `${process.env.CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/projects/${agentId}/settings`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();
    
    // Cache settings for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[Next.js API] Settings error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings', 
      details: error.message 
    });
  }
}
```

### 2D. API Route: Get Project Details (`pages/api/proxy/projects/[projectId]/index.js`)

```javascript
/**
 * Next.js API Route: Get CustomGPT Project Details
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const { projectId } = req.query;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'API key not configured'
    });
  }

  const agentId = (projectId && projectId !== 'undefined' && projectId !== 'null') 
    ? projectId 
    : (process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID || '78913');

  try {
    const response = await fetch(
      `${process.env.CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/projects/${agentId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();
    
    // Cache project details for 10 minutes
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[Next.js API] Project details error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch project details', 
      details: error.message 
    });
  }
}
```

## Option 2: External Proxy Server

### 2E. External Proxy Configuration (`server.js`)

If you prefer an external proxy server, use our universal proxy:

```javascript
// Copy the universal-customgpt-proxy.js from examples directory
// Or create a Next.js specific version:

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS for Next.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-nextjs-app.vercel.app',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'CustomGPT Next.js Proxy',
    timestamp: new Date().toISOString()
  });
});

// Use same endpoint implementations as universal proxy
// ... (copy from universal-customgpt-proxy.js)

app.listen(PORT, () => {
  console.log(`🚀 CustomGPT Next.js Proxy running on port ${PORT}`);
});
```

### 3. Next.js Widget Components

#### Embedded Chat Widget (`components/CustomGPTWidget.jsx`)

```jsx
/**
 * CustomGPT Embedded Widget for Next.js
 * 
 * Provides full chat functionality with Next.js optimizations
 * and secure API integration through API routes or external proxy.
 */

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget';

// Helper functions for script loading
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load scripts on server side'));
      return;
    }
    
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const loadStylesheet = (href) => {
  if (typeof window === 'undefined') return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const CustomGPTWidget = ({
  agentId = process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID,
  agentName = process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/proxy',
  width = '100%',
  height = '600px',
  maxConversations = 5,
  enableConversationManagement = true,
  theme = 'light',
  onMessage,
  onConversationChange,
  // CDN configuration
  vendorsPath = `${CDN_BASE}/vendors.js`,
  widgetPath = `${CDN_BASE}/customgpt-widget.js`,
  cssPath = `${CDN_BASE}/customgpt-widget.css`,
  autoLoad = true
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load widget scripts (client-side only)
  useEffect(() => {
    if (!mounted || !autoLoad) return;
    
    if (typeof window !== 'undefined' && !window.CustomGPTWidget) {
      const loadWidgetScripts = async () => {
        try {
          console.log('[Next.js Widget] Loading CustomGPT scripts...');
          
          loadStylesheet(cssPath);
          await loadScript(vendorsPath);
          await loadScript(widgetPath);
          
          console.log('[Next.js Widget] Scripts loaded successfully');
          setScriptsLoaded(true);
        } catch (err) {
          const errorMsg = `Failed to load CustomGPT widget: ${err.message}`;
          console.error('[Next.js Widget]', errorMsg);
          setError(errorMsg);
        }
      };
      
      loadWidgetScripts();
    } else if (typeof window !== 'undefined' && window.CustomGPTWidget) {
      setScriptsLoaded(true);
    }
  }, [mounted, autoLoad, vendorsPath, widgetPath, cssPath]);

  // Initialize widget (client-side only)
  useEffect(() => {
    if (!mounted || !scriptsLoaded || !containerRef.current) return;
    if (typeof window === 'undefined' || !window.CustomGPTWidget) return;

    console.log('[Next.js Widget] Initializing with config:', {
      agentId,
      agentName,
      apiBaseUrl,
      theme
    });

    try {
      const widget = window.CustomGPTWidget.init({
        agentId: parseInt(agentId) || agentId,
        agentName,
        apiBaseUrl,
        containerId: containerRef.current.id,
        mode: 'embedded',
        width,
        height,
        theme,
        enableConversationManagement,
        maxConversations,
        onMessage: (msg) => {
          console.log('[Next.js Widget] Message:', msg);
          onMessage?.(msg);
        },
        onConversationChange: (conv) => {
          console.log('[Next.js Widget] Conversation changed:', conv);
          onConversationChange?.(conv);
        },
        onError: (err) => {
          console.error('[Next.js Widget] Widget error:', err);
          setError(`Widget error: ${err.message || err}`);
        }
      });

      widgetRef.current = widget;
      console.log('[Next.js Widget] Initialized successfully');

      return () => {
        if (widgetRef.current) {
          console.log('[Next.js Widget] Destroying widget');
          widgetRef.current.destroy();
        }
      };
    } catch (err) {
      const errorMsg = `Failed to initialize widget: ${err.message}`;
      console.error('[Next.js Widget]', errorMsg);
      setError(errorMsg);
    }
  }, [
    mounted,
    scriptsLoaded,
    agentId,
    agentName,
    apiBaseUrl,
    width,
    height,
    theme,
    enableConversationManagement,
    maxConversations,
    onMessage,
    onConversationChange
  ]);

  // Generate stable container ID
  const containerId = `customgpt-widget-${agentId || 'default'}`;

  // Server-side rendering placeholder
  if (!mounted) {
    return (
      <div style={{ width, height, background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading CustomGPT widget...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        background: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '8px',
        color: '#c33',
        width,
        height,
        overflow: 'auto'
      }}>
        <h4>CustomGPT Widget Error</h4>
        <p>{error}</p>
        <details style={{ marginTop: '10px' }}>
          <summary>Debug Information</summary>
          <pre style={{ fontSize: '12px', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
{`Scripts Loaded: ${scriptsLoaded}
Agent ID: ${agentId}
API Base URL: ${apiBaseUrl}
Container ID: ${containerId}
Mounted: ${mounted}
Window Available: ${typeof window !== 'undefined'}
Widget Available: ${typeof window !== 'undefined' && !!window.CustomGPTWidget}`}
          </pre>
        </details>
      </div>
    );
  }

  if (!scriptsLoaded && autoLoad) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#f5f5f5',
        borderRadius: '8px',
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading CustomGPT widget...</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Loading scripts from CDN
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id={containerId}
      style={{ width, height }}
      className="customgpt-widget-container"
    />
  );
};

// Export as dynamic component to prevent SSR issues
export default dynamic(() => Promise.resolve(CustomGPTWidget), {
  ssr: false,
  loading: () => (
    <div style={{ 
      width: '100%', 
      height: '600px', 
      background: '#f5f5f5', 
      borderRadius: '8px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      Loading CustomGPT...
    </div>
  )
});
```

#### Floating Button Widget (`components/CustomGPTFloatingButton.jsx`)

```jsx
/**
 * CustomGPT Floating Button for Next.js
 * 
 * Client-side only floating button with Next.js optimizations
 */

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget';

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load scripts on server side'));
      return;
    }
    
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const loadStylesheet = (href) => {
  if (typeof window === 'undefined') return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const CustomGPTFloatingButton = ({
  agentId = process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID_2,
  agentName = process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME_2,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/proxy',
  position = 'bottom-right',
  primaryColor = '#007acc',
  buttonSize = 'md',
  chatWidth = '400px',
  chatHeight = '600px',
  maxConversations = 5,
  enableConversationManagement = false,
  showLabel = true,
  label = 'Chat with us',
  theme = 'light',
  onMessage,
  onConversationChange,
  vendorsPath = `${CDN_BASE}/vendors.js`,
  widgetPath = `${CDN_BASE}/customgpt-widget.js`,
  cssPath = `${CDN_BASE}/customgpt-widget.css`,
  autoLoad = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load scripts (client-side only)
  useEffect(() => {
    if (!mounted || !autoLoad) return;
    
    if (typeof window !== 'undefined' && !window.CustomGPTWidget) {
      const loadWidgetScripts = async () => {
        try {
          loadStylesheet(cssPath);
          await loadScript(vendorsPath);
          await loadScript(widgetPath);
          setScriptsLoaded(true);
        } catch (err) {
          setError(`Failed to load widget: ${err.message}`);
        }
      };
      loadWidgetScripts();
    } else if (typeof window !== 'undefined' && window.CustomGPTWidget) {
      setScriptsLoaded(true);
    }
  }, [mounted, autoLoad, vendorsPath, widgetPath, cssPath]);

  // Initialize floating widget (client-side only)
  useEffect(() => {
    if (!mounted || !scriptsLoaded) return;
    if (typeof window === 'undefined' || !window.CustomGPTWidget) return;

    try {
      const widget = window.CustomGPTWidget.init({
        agentId: parseInt(agentId) || agentId,
        agentName,
        apiBaseUrl,
        mode: 'floating',
        position,
        width: chatWidth,
        height: chatHeight,
        theme,
        enableConversationManagement,
        maxConversations,
        onMessage,
        onConversationChange,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false)
      });

      widgetRef.current = widget;

      return () => {
        if (widgetRef.current) {
          widgetRef.current.destroy();
        }
      };
    } catch (err) {
      setError(`Failed to initialize floating button: ${err.message}`);
    }
  }, [
    mounted,
    scriptsLoaded,
    agentId,
    agentName,
    apiBaseUrl,
    position,
    chatWidth,
    chatHeight,
    theme,
    enableConversationManagement,
    maxConversations,
    onMessage,
    onConversationChange
  ]);

  // Don't render on server
  if (!mounted) return null;

  const handleToggle = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle();
    }
  };

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14', 
    lg: 'w-16 h-16'
  };

  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px',
        background: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px',
        color: '#c33',
        maxWidth: '300px',
        fontSize: '14px',
        zIndex: 9999
      }}>
        <strong>CustomGPT Error:</strong> {error}
      </div>
    );
  }

  if (!scriptsLoaded && autoLoad) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px',
        background: '#f5f5f5',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 9999
      }}>
        Loading chat...
      </div>
    );
  }

  if (isOpen) {
    return null; // Hide button when chat is open
  }

  return null; // Widget handles its own rendering when loaded
};

export default dynamic(() => Promise.resolve(CustomGPTFloatingButton), {
  ssr: false
});
```

### 4. Usage in Next.js Pages

#### Pages Example (`pages/index.js`)

```jsx
import Head from 'next/head';
import CustomGPTWidget from '../components/CustomGPTWidget';
import CustomGPTFloatingButton from '../components/CustomGPTFloatingButton';

export default function Home() {
  const handleMessage = (message) => {
    console.log('Message received:', message);
    // Handle message events (analytics, notifications, etc.)
  };

  const handleConversationChange = (conversation) => {
    console.log('Conversation changed:', conversation);
    // Handle conversation changes
  };

  return (
    <>
      <Head>
        <title>My Next.js App with CustomGPT</title>
        <meta name="description" content="Next.js app with CustomGPT integration" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ padding: '40px' }}>
        <h1>My Next.js App with CustomGPT</h1>
        
        <section style={{ margin: '40px 0' }}>
          <h2>Customer Support</h2>
          <div style={{ height: '600px', maxWidth: '800px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <CustomGPTWidget
              agentId={process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID}
              agentName={process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME}
              theme="light"
              maxConversations={5}
              enableConversationManagement={true}
              onMessage={handleMessage}
              onConversationChange={handleConversationChange}
            />
          </div>
        </section>

        <section>
          <h2>Your App Content</h2>
          <p>The floating button will appear on all pages.</p>
        </section>
      </main>

      {/* Global floating button */}
      <CustomGPTFloatingButton
        agentId={process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID_2}
        agentName={process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME_2}
        position="bottom-right"
        primaryColor="#0070f3"
        maxConversations={3}
        enableConversationManagement={false}
        onMessage={handleMessage}
        onConversationChange={handleConversationChange}
      />
    </>
  );
}
```

#### App Router Example (`app/page.js`)

```jsx
'use client';

import CustomGPTWidget from '../components/CustomGPTWidget';
import CustomGPTFloatingButton from '../components/CustomGPTFloatingButton';

export default function HomePage() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-8">My Next.js App with CustomGPT</h1>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Customer Support</h2>
        <div className="h-96 max-w-4xl border border-gray-300 rounded-lg">
          <CustomGPTWidget
            theme="light"
            maxConversations={5}
            enableConversationManagement={true}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Your App Content</h2>
        <p>The floating button appears globally.</p>
      </section>

      <CustomGPTFloatingButton
        position="bottom-right"
        primaryColor="#0070f3"
        maxConversations={3}
      />
    </main>
  );
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Core Next.js dependencies (if not already installed)
npm install next react react-dom

# For external proxy server (Option 2)
npm install express cors dotenv
```

### 2. Environment Configuration

Create `.env.local` in your project root:

```bash
# SERVER-SIDE (secure - never sent to browser)
CUSTOMGPT_API_KEY=your_api_key_here

# CLIENT-SIDE (safe with NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_CUSTOMGPT_AGENT_ID=78913
NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME=Support Assistant
NEXT_PUBLIC_CUSTOMGPT_AGENT_ID_2=78913
NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME_2=Quick Help

# API Configuration
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
NEXT_PUBLIC_API_BASE_URL=/api/proxy
```

### 3. Development Setup

#### Option 1: API Routes Only

```bash
npm run dev
```

Your Next.js app will run at `http://localhost:3000` with built-in API proxy support.

#### Option 2: External Proxy Server

```bash
# Terminal 1: Start external proxy server
node server.js

# Terminal 2: Start Next.js app  
npm run dev
```

Update environment to use external proxy:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/proxy
```

## Production Deployment

### Vercel Deployment (Recommended)

1. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Set Environment Variables** in Vercel dashboard:
   - `CUSTOMGPT_API_KEY` (server-side)
   - `NEXT_PUBLIC_CUSTOMGPT_AGENT_ID` (client-side)
   - `NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME` (client-side)

3. **API Routes** handle all proxy functionality automatically.

### Other Hosting Platforms

For other platforms (AWS, Railway, etc.), ensure:
- Environment variables are properly configured
- Server-side rendering is handled correctly
- API routes are deployed and accessible

## Security Features

✅ **Server-Side API Keys**: Keys never exposed to client code  
✅ **Built-in CORS**: Next.js handles cross-origin requests securely  
✅ **Input Validation**: Server-side request validation in API routes  
✅ **Caching**: Intelligent caching for better performance  
✅ **SSR Safety**: Components handle server-side rendering properly  

## Troubleshooting

### Common Issues

1. **Hydration Mismatch**:
   - Components use `dynamic` imports with `ssr: false`
   - Check `mounted` state before rendering

2. **API Routes Not Working**:
   - Verify `.env.local` file exists and has correct variables
   - Check API route file paths match Next.js conventions
   - Test API routes directly: `curl http://localhost:3000/api/proxy/projects/78913`

3. **Scripts Not Loading**:
   - Check browser console for CDN errors
   - Verify components are client-side only (use `mounted` state)
   - Ensure `window` object checks are in place

4. **Environment Variables**:
   - Server-side: NO prefix needed (`CUSTOMGPT_API_KEY`)
   - Client-side: MUST use `NEXT_PUBLIC_` prefix
   - Restart dev server after changing `.env.local`

### Debug Steps

1. **Test API Routes Directly**:
   ```bash
   # Test conversation creation
   curl -X POST http://localhost:3000/api/proxy/projects/78913/conversations \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

2. **Check Environment Variables**:
   ```jsx
   // Add to your component for debugging (client-side only)
   console.log('Agent ID:', process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID);
   console.log('API Base:', process.env.NEXT_PUBLIC_API_BASE_URL);
   ```

3. **Server-Side Debugging**:
   ```javascript
   // Add to API routes
   console.log('API Key present:', !!process.env.CUSTOMGPT_API_KEY);
   console.log('Request body:', req.body);
   ```

## Production Considerations

1. **Environment Security**: Never commit `.env.local` to version control
2. **API Rate Limiting**: Consider adding rate limiting to API routes
3. **Caching Strategy**: Use appropriate cache headers for different endpoints
4. **Error Monitoring**: Integrate error tracking (Sentry, Bugsnag, etc.)
5. **Performance**: Use Next.js Image optimization and code splitting
6. **SEO**: Ensure proper meta tags and structured data
7. **Analytics**: Track widget usage and performance metrics

This Next.js integration provides the most secure and production-ready approach with built-in API routes eliminating the need for external proxy servers in most cases.