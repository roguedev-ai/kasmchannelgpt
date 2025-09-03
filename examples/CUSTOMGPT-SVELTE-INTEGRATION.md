# CustomGPT Widget Integration with Svelte & SvelteKit

Complete guide for securely integrating CustomGPT widgets into Svelte and SvelteKit applications with multiple deployment approaches.

## Overview

This integration provides:
- ✅ **Enterprise-grade security**: API keys never exposed to the browser
- ✅ **Full widget functionality**: Embedded chat, floating button, streaming responses
- ✅ **Dual approach**: Pure Svelte with Vite OR SvelteKit with server routes
- ✅ **Modern patterns**: Svelte stores, TypeScript support, SSR compatibility

## Architecture Options

### Option 1: Svelte + Vite (External Proxy)
```
Browser Widget → Vite Dev Server (port 5173) → External Proxy (port 3001) → CustomGPT API
```

### Option 2: SvelteKit (Server Routes)
```
Browser Widget → SvelteKit App (port 5173) → Server API Routes → CustomGPT API
```

## Required Files

### 1. Environment Configuration (`.env`)

```bash
# SERVER-SIDE ONLY (secure) 
CUSTOMGPT_API_KEY=your_customgpt_api_key

# CLIENT-SIDE (safe to expose)
VITE_CUSTOMGPT_AGENT_ID=78913
VITE_CUSTOMGPT_AGENT_NAME=Your Agent Name
VITE_CUSTOMGPT_AGENT_ID_2=78913
VITE_CUSTOMGPT_AGENT_NAME_2=Your Floating Agent Name

# API Configuration
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
PORT=3001
NODE_ENV=development
```

## Option 1: Svelte + Vite with External Proxy

### 2A. Proxy Server (`server.js`)

Use our universal proxy server:

```javascript
// Use the universal-customgpt-proxy.js from examples directory
// Copy universal-customgpt-proxy.js to your project root as server.js
```

Or create a Svelte-specific version:

```javascript
/**
 * CustomGPT Proxy Server for Svelte/Vite Applications
 * 
 * Based on successful Docusaurus integration pattern.
 * Handles all CustomGPT widget API requests securely.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow Vite dev server
app.use(cors({
  origin: [
    'http://localhost:5173',   // Vite default port
    'http://localhost:4173',   // Vite preview port
    'http://localhost:3000',   // Alt dev port
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper function to get agent ID with Svelte-specific fallbacks
function getAgentId(projectId) {
  if (projectId && projectId !== 'undefined' && projectId !== 'null') {
    return projectId;
  }
  return process.env.VITE_CUSTOMGPT_AGENT_ID || '78913';
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CustomGPT Svelte/Vite Proxy'
  });
});

// Widget endpoint: Create conversations
app.post('/api/proxy/projects/:projectId/conversations', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found. Please check your .env file.' 
    });
  }

  const agentId = getAgentId(req.params.projectId);
  const customgptUrl = `https://app.customgpt.ai/api/v1/projects/${agentId}/conversations`;
  
  console.log(`[SVELTE WIDGET] POST ${customgptUrl}`);

  try {
    const response = await fetch(customgptUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[SVELTE PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Widget endpoint: Send messages (with streaming support)
app.post('/api/proxy/projects/:projectId/conversations/:conversationId/messages', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const { projectId, conversationId } = req.params;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found. Please check your .env file.' 
    });
  }

  const agentId = getAgentId(projectId);
  const customgptUrl = `https://app.customgpt.ai/api/v1/projects/${agentId}/conversations/${conversationId}/messages`;
  
  console.log(`[SVELTE WIDGET] POST ${customgptUrl}`);

  try {
    const response = await fetch(customgptUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: 'CustomGPT API error', 
        details: errorText 
      });
    }

    // Handle streaming responses for real-time chat
    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = response.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (streamError) {
          console.error('[STREAM ERROR]', streamError);
          res.end();
        }
      };
      pump();
    } else {
      const data = await response.json();
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('[SVELTE PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Widget endpoint: Get project settings
app.get('/api/proxy/projects/:projectId/settings', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const agentId = getAgentId(req.params.projectId);
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found. Please check your .env file.' 
    });
  }

  try {
    const response = await fetch(`https://app.customgpt.ai/api/v1/projects/${agentId}/settings`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[SVELTE PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Widget endpoint: Get project details
app.get('/api/proxy/projects/:projectId', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const agentId = getAgentId(req.params.projectId);
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found. Please check your .env file.' 
    });
  }

  try {
    const response = await fetch(`https://app.customgpt.ai/api/v1/projects/${agentId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[SVELTE PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 CustomGPT Svelte/Vite Proxy Server Started`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxy: http://localhost:${PORT}/api/proxy/*`);
  console.log(`🔑 API Key: ${process.env.CUSTOMGPT_API_KEY ? 'Yes ✅' : 'No ❌'}`);
  console.log(`🔥 Svelte: http://localhost:5173`);
});

module.exports = app;
```

### 2B. Vite Configuration (`vite.config.js`)

```javascript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    proxy: {
      '/api/proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[VITE PROXY ERROR]', err.message);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Development proxy failed',
                details: err.message,
                suggestion: 'Make sure server.js is running on port 3001'
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[VITE PROXY] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
          });
        }
      }
    }
  }
});
```

## Option 2: SvelteKit with Server Routes

### 2C. SvelteKit API Routes

#### Create Conversations (`src/routes/api/proxy/projects/[projectId]/conversations/+server.js`)

```javascript
import { json, error } from '@sveltejs/kit';
import { CUSTOMGPT_API_KEY, CUSTOMGPT_API_BASE_URL } from '$env/static/private';
import { PUBLIC_CUSTOMGPT_AGENT_ID } from '$env/static/public';

function getAgentId(projectId) {
  if (projectId && projectId !== 'undefined' && projectId !== 'null') {
    return projectId;
  }
  return PUBLIC_CUSTOMGPT_AGENT_ID || '78913';
}

export async function POST({ params, request }) {
  if (!CUSTOMGPT_API_KEY) {
    throw error(500, {
      message: 'CUSTOMGPT_API_KEY not found in server environment'
    });
  }

  const agentId = getAgentId(params.projectId);
  const customgptUrl = `${CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/projects/${agentId}/conversations`;
  
  console.log(`[SVELTEKIT API] POST ${customgptUrl}`);

  try {
    const body = await request.json();
    
    const response = await fetch(customgptUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CUSTOMGPT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return json(data, { status: response.status });
    
  } catch (err) {
    console.error('[SVELTEKIT API ERROR]', err);
    throw error(500, {
      message: 'Proxy request failed',
      details: err.message
    });
  }
}
```

#### Send Messages (`src/routes/api/proxy/projects/[projectId]/conversations/[conversationId]/messages/+server.js`)

```javascript
import { json, error } from '@sveltejs/kit';
import { CUSTOMGPT_API_KEY, CUSTOMGPT_API_BASE_URL } from '$env/static/private';
import { PUBLIC_CUSTOMGPT_AGENT_ID } from '$env/static/public';

function getAgentId(projectId) {
  if (projectId && projectId !== 'undefined' && projectId !== 'null') {
    return projectId;
  }
  return PUBLIC_CUSTOMGPT_AGENT_ID || '78913';
}

export async function POST({ params, request }) {
  if (!CUSTOMGPT_API_KEY) {
    throw error(500, {
      message: 'CUSTOMGPT_API_KEY not found in server environment'
    });
  }

  const { projectId, conversationId } = params;
  const agentId = getAgentId(projectId);
  const customgptUrl = `${CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/projects/${agentId}/conversations/${conversationId}/messages`;
  
  console.log(`[SVELTEKIT API] POST ${customgptUrl}`);

  try {
    const body = await request.json();
    
    const response = await fetch(customgptUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CUSTOMGPT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw error(response.status, {
        message: 'CustomGPT API error',
        details: errorText
      });
    }

    // Handle streaming responses for real-time chat
    if (body.stream) {
      // Return streaming response
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      const data = await response.json();
      return json(data, { status: response.status });
    }
    
  } catch (err) {
    console.error('[SVELTEKIT API ERROR]', err);
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, {
      message: 'Proxy request failed',
      details: err.message
    });
  }
}
```

#### Project Settings (`src/routes/api/proxy/projects/[projectId]/settings/+server.js`)

```javascript
import { json, error } from '@sveltejs/kit';
import { CUSTOMGPT_API_KEY, CUSTOMGPT_API_BASE_URL } from '$env/static/private';
import { PUBLIC_CUSTOMGPT_AGENT_ID } from '$env/static/public';

function getAgentId(projectId) {
  if (projectId && projectId !== 'undefined' && projectId !== 'null') {
    return projectId;
  }
  return PUBLIC_CUSTOMGPT_AGENT_ID || '78913';
}

export async function GET({ params }) {
  if (!CUSTOMGPT_API_KEY) {
    throw error(500, {
      message: 'CUSTOMGPT_API_KEY not found in server environment'
    });
  }

  const agentId = getAgentId(params.projectId);
  const customgptUrl = `${CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/projects/${agentId}/settings`;

  try {
    const response = await fetch(customgptUrl, {
      headers: {
        'Authorization': `Bearer ${CUSTOMGPT_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
    
  } catch (err) {
    console.error('[SVELTEKIT API ERROR]', err);
    throw error(500, {
      message: 'Failed to fetch project settings',
      details: err.message
    });
  }
}
```

#### Project Details (`src/routes/api/proxy/projects/[projectId]/+server.js`)

```javascript
import { json, error } from '@sveltejs/kit';
import { CUSTOMGPT_API_KEY, CUSTOMGPT_API_BASE_URL } from '$env/static/private';
import { PUBLIC_CUSTOMGPT_AGENT_ID } from '$env/static/public';

function getAgentId(projectId) {
  if (projectId && projectId !== 'undefined' && projectId !== 'null') {
    return projectId;
  }
  return PUBLIC_CUSTOMGPT_AGENT_ID || '78913';
}

export async function GET({ params }) {
  if (!CUSTOMGPT_API_KEY) {
    throw error(500, {
      message: 'CUSTOMGPT_API_KEY not found in server environment'
    });
  }

  const agentId = getAgentId(params.projectId);
  const customgptUrl = `${CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1'}/projects/${agentId}`;

  try {
    const response = await fetch(customgptUrl, {
      headers: {
        'Authorization': `Bearer ${CUSTOMGPT_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
      }
    });
    
  } catch (err) {
    console.error('[SVELTEKIT API ERROR]', err);
    throw error(500, {
      message: 'Failed to fetch project details',
      details: err.message
    });
  }
}
```

## Svelte Components

### 3. Embedded Chat Widget (`src/lib/components/CustomGPTWidget.svelte`)

```svelte
<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  
  // CDN base for widget files
  const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget';
  
  // Props with defaults
  export let agentId = import.meta.env.VITE_CUSTOMGPT_AGENT_ID;
  export let agentName = import.meta.env.VITE_CUSTOMGPT_AGENT_NAME;
  export let apiBaseUrl = '/api/proxy';
  export let width = '100%';
  export let height = '600px';
  export let maxConversations = 5;
  export let enableConversationManagement = true;
  export let theme = 'light';
  export let autoLoad = true;
  
  // CDN configuration
  export let vendorsPath = `${CDN_BASE}/vendors.js`;
  export let widgetPath = `${CDN_BASE}/customgpt-widget.js`;
  export let cssPath = `${CDN_BASE}/customgpt-widget.css`;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // State
  let scriptsLoaded = false;
  let error = null;
  let widgetContainer;
  let widget = null;
  
  const containerId = `customgpt-widget-${Math.random().toString(36).substr(2, 9)}`;
  
  // Helper functions for dynamic script loading
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (!browser) {
        reject(new Error('Not running in browser'));
        return;
      }
      
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };
  
  const loadStylesheet = (href) => {
    if (!browser || document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };
  
  // Load widget scripts
  const loadWidgetScripts = async () => {
    if (!browser || !autoLoad) return;
    
    if (window.CustomGPTWidget) {
      scriptsLoaded = true;
      return;
    }
    
    try {
      console.log('[Svelte Widget] Loading CustomGPT scripts...');
      
      // Load CSS first
      loadStylesheet(cssPath);
      
      // Load vendors.js (Svelte dependencies)
      await loadScript(vendorsPath);
      
      // Load the main widget
      await loadScript(widgetPath);
      
      console.log('[Svelte Widget] Scripts loaded successfully');
      scriptsLoaded = true;
    } catch (err) {
      const errorMsg = `Failed to load CustomGPT widget: ${err.message}`;
      console.error('[Svelte Widget]', errorMsg);
      error = errorMsg;
    }
  };
  
  // Initialize widget
  const initializeWidget = () => {
    if (!browser || !scriptsLoaded || !widgetContainer || !window.CustomGPTWidget) {
      return;
    }
    
    console.log('[Svelte Widget] Initializing with config:', {
      agentId,
      agentName,
      apiBaseUrl,
      theme
    });
    
    try {
      widget = window.CustomGPTWidget.init({
        agentId: parseInt(agentId) || agentId,
        agentName,
        apiBaseUrl,
        containerId,
        mode: 'embedded',
        width,
        height,
        theme,
        enableConversationManagement,
        maxConversations,
        onMessage: (msg) => {
          console.log('[Svelte Widget] Message:', msg);
          dispatch('message', msg);
        },
        onConversationChange: (conv) => {
          console.log('[Svelte Widget] Conversation changed:', conv);
          dispatch('conversationChange', conv);
        },
        onError: (err) => {
          console.error('[Svelte Widget] Widget error:', err);
          error = `Widget error: ${err.message || err}`;
        }
      });
      
      console.log('[Svelte Widget] Initialized successfully');
    } catch (err) {
      const errorMsg = `Failed to initialize widget: ${err.message}`;
      console.error('[Svelte Widget]', errorMsg);
      error = errorMsg;
    }
  };
  
  onMount(async () => {
    if (browser) {
      await loadWidgetScripts();
    }
  });
  
  onDestroy(() => {
    if (widget) {
      console.log('[Svelte Widget] Destroying widget');
      widget.destroy();
    }
  });
  
  // Reactive statement to initialize widget when scripts are loaded
  $: if (scriptsLoaded && widgetContainer) {
    initializeWidget();
  }
</script>

{#if error}
  <div class="customgpt-error" style:padding="20px" style:background="#fee" style:border="1px solid #fcc" style:border-radius="8px" style:color="#c33">
    <h4>CustomGPT Widget Error</h4>
    <p>{error}</p>
    <details style="margin-top: 10px">
      <summary>Debug Information</summary>
      <pre style="font-size: 12px; margin-top: 8px">
Scripts Loaded: {scriptsLoaded}
Agent ID: {agentId}
API Base URL: {apiBaseUrl}
Container ID: {containerId}
Browser: {browser}
      </pre>
    </details>
  </div>
{:else if !scriptsLoaded && autoLoad}
  <div class="customgpt-loading" style:padding="40px" style:text-align="center" style:background="#f5f5f5" style:border-radius="8px">
    <div>Loading CustomGPT widget...</div>
    <div style="font-size: 12px; color: #666; margin-top: 8px">
      Loading scripts from CDN
    </div>
  </div>
{:else}
  <div
    bind:this={widgetContainer}
    id={containerId}
    style:width
    style:height
    class="customgpt-widget-container"
  ></div>
{/if}

<style>
  .customgpt-widget-container {
    border-radius: 8px;
    overflow: hidden;
  }
</style>
```

### 4. Floating Button Widget (`src/lib/components/CustomGPTFloatingButton.svelte`)

```svelte
<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  
  const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget';
  
  // Props with defaults
  export let agentId = import.meta.env.VITE_CUSTOMGPT_AGENT_ID_2;
  export let agentName = import.meta.env.VITE_CUSTOMGPT_AGENT_NAME_2;
  export let apiBaseUrl = '/api/proxy';
  export let position = 'bottom-right';
  export let primaryColor = '#ff3e00';
  export let buttonSize = 'md';
  export let chatWidth = '400px';
  export let chatHeight = '600px';
  export let maxConversations = 5;
  export let enableConversationManagement = false;
  export let theme = 'light';
  export let autoLoad = true;
  
  // CDN configuration
  export let vendorsPath = `${CDN_BASE}/vendors.js`;
  export let widgetPath = `${CDN_BASE}/customgpt-widget.js`;
  export let cssPath = `${CDN_BASE}/customgpt-widget.css`;
  
  const dispatch = createEventDispatcher();
  
  let scriptsLoaded = false;
  let error = null;
  let isOpen = false;
  let widget = null;
  
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (!browser) {
        reject(new Error('Not running in browser'));
        return;
      }
      
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };
  
  const loadStylesheet = (href) => {
    if (!browser || document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };
  
  const loadWidgetScripts = async () => {
    if (!browser || !autoLoad) return;
    
    if (window.CustomGPTWidget) {
      scriptsLoaded = true;
      return;
    }
    
    try {
      loadStylesheet(cssPath);
      await loadScript(vendorsPath);
      await loadScript(widgetPath);
      scriptsLoaded = true;
    } catch (err) {
      error = `Failed to load widget: ${err.message}`;
    }
  };
  
  const initializeFloatingWidget = () => {
    if (!browser || !scriptsLoaded || !window.CustomGPTWidget) return;
    
    try {
      widget = window.CustomGPTWidget.init({
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
        onMessage: (msg) => dispatch('message', msg),
        onConversationChange: (conv) => dispatch('conversationChange', conv),
        onOpen: () => {
          isOpen = true;
          dispatch('open');
        },
        onClose: () => {
          isOpen = false;
          dispatch('close');
        }
      });
    } catch (err) {
      error = `Failed to initialize floating button: ${err.message}`;
    }
  };
  
  onMount(async () => {
    if (browser) {
      await loadWidgetScripts();
    }
  });
  
  onDestroy(() => {
    if (widget) {
      widget.destroy();
    }
  });
  
  $: if (scriptsLoaded && browser) {
    initializeFloatingWidget();
  }
</script>

{#if error}
  <div style:position="fixed" style:bottom="20px" style:right="20px" style:padding="12px" style:background="#fee" style:border="1px solid #fcc" style:border-radius="8px" style:color="#c33" style:max-width="300px" style:font-size="14px" style:z-index="9999">
    <strong>CustomGPT Error:</strong> {error}
  </div>
{:else if !scriptsLoaded && autoLoad}
  <div style:position="fixed" style:bottom="20px" style:right="20px" style:padding="12px" style:background="#f5f5f5" style:border-radius="8px" style:font-size="14px" style:z-index="9999">
    Loading chat...
  </div>
{/if}

<!-- Widget handles its own rendering when loaded -->
```

### 5. Usage in Svelte App

#### Main App (`src/routes/+page.svelte`)

```svelte
<script>
  import CustomGPTWidget from '$lib/components/CustomGPTWidget.svelte';
  import CustomGPTFloatingButton from '$lib/components/CustomGPTFloatingButton.svelte';
  
  // Environment variables
  const agentId = import.meta.env.VITE_CUSTOMGPT_AGENT_ID;
  const agentName = import.meta.env.VITE_CUSTOMGPT_AGENT_NAME;
  const floatingAgentId = import.meta.env.VITE_CUSTOMGPT_AGENT_ID_2;
  const floatingAgentName = import.meta.env.VITE_CUSTOMGPT_AGENT_NAME_2;
  
  function handleMessage(event) {
    console.log('New message received:', event.detail);
    // Handle message events (analytics, notifications, etc.)
  }
  
  function handleConversationChange(event) {
    console.log('Conversation changed:', event.detail);
    // Handle conversation changes (analytics, state updates, etc.)
  }
  
  function handleFloatingOpen() {
    console.log('Floating chat opened');
  }
  
  function handleFloatingClose() {
    console.log('Floating chat closed');
  }
</script>

<svelte:head>
  <title>My Svelte App with CustomGPT</title>
  <meta name="description" content="Svelte app with CustomGPT integration" />
</svelte:head>

<div class="app-container">
  <header class="app-header">
    <h1>My Svelte App with CustomGPT</h1>
  </header>
  
  <main class="app-main">
    <section class="support-section">
      <h2>Customer Support</h2>
      <div class="widget-container">
        <CustomGPTWidget
          {agentId}
          {agentName}
          theme="light"
          maxConversations={5}
          enableConversationManagement={true}
          on:message={handleMessage}
          on:conversationChange={handleConversationChange}
        />
      </div>
    </section>
    
    <section class="content-section">
      <h2>Your App Content</h2>
      <p>The floating button will appear on all pages.</p>
    </section>
  </main>

  <!-- Global floating button -->
  <CustomGPTFloatingButton
    agentId={floatingAgentId}
    agentName={floatingAgentName}
    position="bottom-right"
    primaryColor="#ff3e00"
    maxConversations={3}
    enableConversationManagement={false}
    on:message={handleMessage}
    on:conversationChange={handleConversationChange}
    on:open={handleFloatingOpen}
    on:close={handleFloatingClose}
  />
</div>

<style>
  .app-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .app-header {
    padding: 2rem;
    background: #ff3e00;
    color: white;
    text-align: center;
  }

  .app-header h1 {
    margin: 0;
  }

  .app-main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .support-section {
    margin: 2rem 0;
  }

  .widget-container {
    height: 600px;
    max-width: 800px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .content-section {
    margin: 3rem 0;
  }

  h2 {
    color: #ff3e00;
    margin-bottom: 1rem;
  }
</style>
```

### 6. TypeScript Support (`src/app.d.ts`)

```typescript
// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  // CustomGPT Widget global types
  interface Window {
    CustomGPTWidget?: {
      init: (config: any) => any;
    };
  }
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_CUSTOMGPT_AGENT_ID: string;
  readonly VITE_CUSTOMGPT_AGENT_NAME: string;
  readonly VITE_CUSTOMGPT_AGENT_ID_2: string;
  readonly VITE_CUSTOMGPT_AGENT_NAME_2: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
```

## Setup Instructions

### 1. Install Dependencies

#### For Svelte + Vite:
```bash
# Core dependencies
npm install svelte @sveltejs/vite-plugin-svelte vite

# For proxy server
npm install express cors dotenv
```

#### For SvelteKit:
```bash
# SvelteKit dependencies
npm install @sveltejs/kit @sveltejs/adapter-auto vite

# Optional TypeScript support
npm install --save-dev @types/node typescript
```

### 2. Environment Configuration

Create `.env` file in your project root:

```bash
# SERVER-SIDE (secure - never exposed to browser)
CUSTOMGPT_API_KEY=your_api_key_here

# CLIENT-SIDE (safe to expose via VITE_ prefix)
VITE_CUSTOMGPT_AGENT_ID=78913
VITE_CUSTOMGPT_AGENT_NAME=Support Assistant
VITE_CUSTOMGPT_AGENT_ID_2=78913
VITE_CUSTOMGPT_AGENT_NAME_2=Quick Help

# Server configuration (for external proxy)
PORT=3001
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
```

For SvelteKit, also configure environment variables in your project:

Create `.env.example`:
```bash
# Private (server-side only)
CUSTOMGPT_API_KEY=your_api_key_here
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1

# Public (client-side safe)
PUBLIC_CUSTOMGPT_AGENT_ID=78913
PUBLIC_CUSTOMGPT_AGENT_NAME=Support Assistant
```

### 3. Start Development Servers

#### For Svelte + Vite:
```bash
# Terminal 1: Start proxy server
node server.js

# Terminal 2: Start Svelte app
npm run dev
```

#### For SvelteKit:
```bash
# Single terminal: Start SvelteKit app
npm run dev
```

Your Svelte app will be available at `http://localhost:5173` with full CustomGPT widget functionality.

## Production Deployment

### 1. Build Svelte App

```bash
npm run build
```

### 2. Deploy Based on Architecture

#### For Svelte + Vite:
Deploy your proxy server and static build separately.

#### For SvelteKit:
Deploy as a full-stack application with server-side API routes.

Popular platforms:
- **Vercel**: Built-in SvelteKit support
- **Netlify**: SvelteKit adapter available
- **Railway/Heroku**: Node.js deployment

## Security Features

✅ **API Key Protection**: Keys never exposed to client-side code  
✅ **SSR Compatibility**: Works with SvelteKit universal rendering  
✅ **CORS Configuration**: Proper cross-origin handling  
✅ **Input Validation**: Server-side request validation  
✅ **Error Handling**: Comprehensive error catching and logging  
✅ **TypeScript Support**: Full type safety with modern Svelte patterns  

## Troubleshooting

### Common Issues

1. **Widget Not Loading**:
   - Check browser console for script loading errors
   - Verify CDN URLs are accessible
   - Ensure proxy server is running (for external proxy approach)

2. **Vite Proxy Errors** (External Proxy):
   - Check proxy server logs for detailed errors
   - Verify `vite.config.js` proxy configuration
   - Test proxy server health: `curl http://localhost:3001/health`

3. **SvelteKit API Route Errors**:
   - Check SvelteKit dev server logs
   - Verify environment variables are properly configured
   - Test API routes directly: `curl http://localhost:5173/api/proxy/projects/78913`

4. **Environment Variables**:
   - Svelte/Vite requires `VITE_` prefix for client-side variables
   - SvelteKit uses `PUBLIC_` prefix for client-side variables
   - Server-side variables (API keys) should NOT have prefixes
   - Restart dev server after changing environment files

### Debug Steps

1. **Check Service Health**:
   ```bash
   # External proxy
   curl http://localhost:3001/health
   
   # SvelteKit API routes
   curl http://localhost:5173/api/proxy/projects/78913
   ```

2. **Test Widget Endpoints**:
   ```bash
   curl -X POST http://localhost:5173/api/proxy/projects/78913/conversations \
     -H "Content-Type: application/json" \
     -d '{"message": "Test"}'
   ```

3. **Verify Environment Variables**:
   ```javascript
   // Add to your component for debugging
   console.log('Agent ID:', import.meta.env.VITE_CUSTOMGPT_AGENT_ID);
   console.log('API Base URL: /api/proxy');
   ```

## Production Considerations

1. **Environment Variables**: Use your hosting platform's environment variable system
2. **API Key Security**: Never commit API keys to version control
3. **CORS Configuration**: Update allowed origins for production domains
4. **SSL/HTTPS**: Ensure HTTPS in production
5. **Adapter Configuration**: Use appropriate SvelteKit adapter for your deployment target
6. **Rate Limiting**: Consider adding rate limiting to API routes
7. **Monitoring**: Add logging and monitoring for production deployments
8. **Error Tracking**: Integrate error tracking service (Sentry, etc.)
9. **Performance**: Use SvelteKit's built-in optimizations and code splitting

This Svelte/SvelteKit integration provides enterprise-grade security with modern Svelte patterns, SSR compatibility, and flexible deployment options for both static and full-stack applications.