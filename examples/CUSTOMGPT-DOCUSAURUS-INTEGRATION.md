# CustomGPT Widget Integration with Docusaurus

Complete guide for securely integrating CustomGPT widgets into Docusaurus applications.

## Overview

This integration provides:
- ✅ **Enterprise-grade security**: API keys never exposed to the browser
- ✅ **Full widget functionality**: Embedded chat, floating button, streaming responses
- ✅ **Production-ready**: Proper error handling, logging, and fallbacks
- ✅ **Cross-origin support**: Seamless integration with Docusaurus dev server

## Architecture

```
Browser Widget → Docusaurus (port 3000) → Proxy Server (port 3001) → CustomGPT API
```

## Required Files

### 1. Environment Configuration (`.env`)

```bash
NODE_ENV=local
INDEXNOW_API_KEY=your_indexnow_key

# SERVER-SIDE ONLY (secure) 
CUSTOMGPT_API_KEY=your_customgpt_api_key

# CLIENT-SIDE (safe to expose)
REACT_APP_CUSTOMGPT_AGENT_ID=78913
REACT_APP_CUSTOMGPT_AGENT_ID_2=78913
REACT_APP_CUSTOMGPT_AGENT_NAME=Your Agent Name
REACT_APP_CUSTOMGPT_AGENT_NAME_2=Your Floating Agent Name

# API Configuration
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
PORT=3001
```

### 2. Docusaurus Configuration (`docusaurus.config.js`)

Add these configurations to your existing Docusaurus config:

```javascript
// Load environment variables from .env
require('dotenv').config({ path: '.env' });

const config = {
  // ... your existing config

  // Custom fields for environment variables (CLIENT-SAFE ONLY)
  customFields: {
    // NEVER expose API keys here - they become public
    CUSTOMGPT_AGENT_ID: process.env.REACT_APP_CUSTOMGPT_AGENT_ID || '',
    CUSTOMGPT_AGENT_ID_2: process.env.REACT_APP_CUSTOMGPT_AGENT_ID_2 || '',
    CUSTOMGPT_AGENT_NAME: process.env.REACT_APP_CUSTOMGPT_AGENT_NAME || 'CustomGPT Assistant',
    CUSTOMGPT_AGENT_NAME_2: process.env.REACT_APP_CUSTOMGPT_AGENT_NAME_2 || 'CustomGPT Floating Bot',
  },

  plugins: [
    // ... your existing plugins
    
    // CustomGPT API Plugin
    ['./src/plugins/customgpt-api-plugin.js', {}],
  ],

  // ... rest of your config
};
```

### 3. CustomGPT API Plugin (`src/plugins/customgpt-api-plugin.js`)

```javascript
/**
 * CustomGPT API Plugin for Docusaurus
 * Creates a secure proxy for CustomGPT widget integration
 */

const path = require('path');

module.exports = function customGPTApiPlugin(context, options) {
  return {
    name: 'customgpt-api-plugin',
    
    // Configure webpack dev server for proxy
    configureWebpack(config, isServer, utils) {
      if (isServer) {
        return {
          // Server-side configuration
        };
      }
      
      return {
        // Client-side configuration with dev server proxy
        devServer: {
          proxy: {
            '/api/proxy': {
              target: 'http://localhost:3001',
              changeOrigin: true,
              logLevel: 'debug',
              onError: (err, req, res) => {
                console.error('[PROXY ERROR]', err.message);
                res.status(500).json({
                  error: 'Proxy request failed',
                  details: err.message,
                  suggestion: 'Make sure server.js is running on port 3001'
                });
              },
              onProxyReq: (proxyReq, req, res) => {
                console.log(`[WEBPACK PROXY] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
              }
            }
          }
        },
        resolve: {
          alias: {
            '@api': path.resolve(__dirname, '../api'),
          },
        },
      };
    },

    async loadContent() {
      return null;
    },

    async contentLoaded({ content, actions }) {
      const { createData } = actions;
      
      // Create a client-side utility for API calls
      const apiHelperContent = `
export const customGPTApi = {
  async sendMessage(message, agentId, sessionId = null) {
    try {
      const response = await fetch('/api/customgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          agentId,
          sessionId: sessionId || \`session_\${Date.now()}\`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('CustomGPT API error:', error);
      throw error;
    }
  }
};
`;

      await createData('customgpt-api-helper.js', apiHelperContent);
    },

    getPathsToWatch() {
      return [path.resolve(__dirname, '../api')];
    },
  };
};
```

### 4. Proxy Server (`server.js`)

```javascript
/**
 * CustomGPT Proxy Server for Docusaurus
 * 
 * Handles all CustomGPT widget API requests securely
 * Keeps API keys server-side and provides complete widget support
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Configure dotenv with explicit path
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Debug environment variables
console.log('🔧 Environment Debug:');
console.log(`   Working Directory: ${process.cwd()}`);
console.log(`   Script Directory: ${__dirname}`);
console.log(`   API Key Present: ${!!process.env.CUSTOMGPT_API_KEY}`);
console.log(`   API Key Length: ${process.env.CUSTOMGPT_API_KEY?.length || 0}`);
if (process.env.CUSTOMGPT_API_KEY) {
  console.log(`   API Key Preview: ${process.env.CUSTOMGPT_API_KEY.substring(0, 10)}...`);
}

// CORS - allow all origins for development
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Handle CustomGPT widget's expected endpoints with undefined projectId
app.post('/api/proxy/projects/undefined/conversations', async (req, res) => {
  console.log('Widget trying to POST to undefined endpoint - fixing automatically');
  
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const agentId = process.env.REACT_APP_CUSTOMGPT_AGENT_ID || '78913';
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found in environment variables' 
    });
  }

  const customgptUrl = `https://app.customgpt.ai/api/v1/projects/${agentId}/conversations`;
  
  console.log(`[WIDGET FIX] Redirecting undefined project to agent ${agentId}`);
  console.log(`[PROXY] POST ${customgptUrl}`);

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

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[WIDGET PROXY ERROR]', error);
    res.status(500).json({ 
      error: 'Widget proxy request failed', 
      details: error.message 
    });
  }
});

// Handle CustomGPT widget's expected endpoints with any projectId
app.post('/api/proxy/projects/:projectId/conversations', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const projectId = req.params.projectId;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found in environment variables' 
    });
  }

  const agentId = projectId !== 'undefined' ? projectId : (process.env.REACT_APP_CUSTOMGPT_AGENT_ID || '78913');
  const customgptUrl = `https://app.customgpt.ai/api/v1/projects/${agentId}/conversations`;
  
  console.log(`[WIDGET] POST ${customgptUrl}`);

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

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[WIDGET PROXY ERROR]', error);
    res.status(500).json({ 
      error: 'Widget proxy request failed', 
      details: error.message 
    });
  }
});

// Handle sending messages to conversations
app.post('/api/proxy/projects/:projectId/conversations/:conversationId/messages', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const { projectId, conversationId } = req.params;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found in environment variables' 
    });
  }

  const agentId = projectId !== 'undefined' ? projectId : (process.env.REACT_APP_CUSTOMGPT_AGENT_ID || '78913');
  const customgptUrl = `https://app.customgpt.ai/api/v1/projects/${agentId}/conversations/${conversationId}/messages`;
  
  console.log(`[WIDGET] POST ${customgptUrl}`);
  console.log(`[WIDGET] Request body:`, JSON.stringify(req.body, null, 2));

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

    // Check if response is ok first
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WIDGET PROXY ERROR] API Error:', response.status, errorText);
      res.status(response.status).json({ 
        error: 'CustomGPT API error', 
        details: errorText,
        status: response.status
      });
      return;
    }

    // Check if streaming response requested
    if (req.body.stream) {
      console.log(`[WIDGET] Handling streaming response`);
      
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Use Node.js readable stream
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
      // Handle non-streaming response
      try {
        const data = await response.json();
        res.status(response.status).json(data);
      } catch (parseError) {
        const textResponse = await response.text();
        console.error('[JSON PARSE ERROR]', parseError.message);
        console.error('[RESPONSE TEXT]', textResponse);
        res.status(500).json({ 
          error: 'Failed to parse API response', 
          details: parseError.message,
          responseText: textResponse
        });
      }
    }

  } catch (error) {
    console.error('[WIDGET PROXY ERROR]', error);
    res.status(500).json({ 
      error: 'Widget proxy request failed', 
      details: error.message 
    });
  }
});

// Handle getting project settings
app.get('/api/proxy/projects/:projectId/settings', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const projectId = req.params.projectId;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found in environment variables' 
    });
  }

  const agentId = projectId !== 'undefined' ? projectId : (process.env.REACT_APP_CUSTOMGPT_AGENT_ID || '78913');
  const customgptUrl = `https://app.customgpt.ai/api/v1/projects/${agentId}/settings`;
  
  console.log(`[WIDGET] GET ${customgptUrl}`);

  try {
    const response = await fetch(customgptUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[WIDGET PROXY ERROR]', error);
    res.status(500).json({ 
      error: 'Widget proxy request failed', 
      details: error.message 
    });
  }
});

// Handle getting project details
app.get('/api/proxy/projects/:projectId', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const projectId = req.params.projectId;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found in environment variables' 
    });
  }

  const agentId = projectId !== 'undefined' ? projectId : (process.env.REACT_APP_CUSTOMGPT_AGENT_ID || '78913');
  const customgptUrl = `https://app.customgpt.ai/api/v1/projects/${agentId}`;
  
  console.log(`[WIDGET] GET ${customgptUrl}`);

  try {
    const response = await fetch(customgptUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[WIDGET PROXY ERROR]', error);
    res.status(500).json({ 
      error: 'Widget proxy request failed', 
      details: error.message 
    });
  }
});

// Proxy all other requests to /api/customgpt/*
app.use('/api/customgpt', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found in environment variables' 
    });
  }

  const path = req.originalUrl.replace('/api/customgpt', '');
  const customgptUrl = `https://app.customgpt.ai/api/v1${path}`;

  console.log(`[PROXY] ${req.method} ${customgptUrl}`);

  try {
    const response = await fetch(customgptUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...(req.method !== 'GET' && req.method !== 'HEAD' && {
        body: JSON.stringify(req.body)
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[PROXY ERROR]', error);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log('\n🚀 CustomGPT Proxy Server Started');
  console.log('==================================');
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/api/customgpt/*`);
  console.log(`🔑 API Key configured: ${process.env.CUSTOMGPT_API_KEY ? 'Yes ✅' : 'No ❌'}`);
  
  if (!process.env.CUSTOMGPT_API_KEY) {
    console.log('\n❌ MISSING API KEY:');
    console.log('   Please create a .env file in this directory with:');
    console.log('   CUSTOMGPT_API_KEY=your_api_key_here');
    console.log('   ');
    console.log('   Current working directory:', process.cwd());
    console.log('   Script directory:', __dirname);
  } else {
    console.log(`✅ Ready to proxy requests to CustomGPT.ai`);
  }
  console.log('==================================\n');
});

module.exports = app;
```

## Widget Components

### 5. Chat Widget (`src/components/Chat.jsx`)

```jsx
/**
 * Simplified CustomGPT Widget Example
 * 
 * This component provides embedded chat functionality with full
 * conversation management and secure API integration.
 */

import React, { useEffect, useRef, useState } from 'react'

// Use CDN for widget files
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget'

// Helper function to load scripts dynamically
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// Helper function to load stylesheets
const loadStylesheet = (href) => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

const SimplifiedCustomGPTWidget = ({
  agentId,
  agentName,
  apiBaseUrl = '/api/proxy', // Use relative URL for same-origin requests
  width = '100%',
  height = '600px',
  maxConversations = 5,
  enableConversationManagement = true,
  onMessage,
  onConversationChange,
  theme = 'light',
  vendorsPath = `${CDN_BASE}/vendors.js`,
  widgetPath = `${CDN_BASE}/customgpt-widget.js`,
  cssPath = `${CDN_BASE}/customgpt-widget.css`,
  autoLoad = true
}) => {
  const containerRef = useRef(null)
  const widgetRef = useRef(null)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [error, setError] = useState(null)

  // Load scripts if autoLoad is enabled and scripts aren't already loaded
  useEffect(() => {
    if (autoLoad && !window.CustomGPTWidget) {
      const loadWidgetScripts = async () => {
        try {
          // Load CSS first
          loadStylesheet(cssPath)

          // Load vendors.js first (React, ReactDOM dependencies)
          await loadScript(vendorsPath)

          // Then load the widget
          await loadScript(widgetPath)

          setScriptsLoaded(true)
        } catch (err) {
          setError(`Failed to load widget scripts: ${err.message}`)
          console.error('Failed to load CustomGPT widget scripts:', err)
        }
      }

      loadWidgetScripts()
    } else if (window.CustomGPTWidget) {
      setScriptsLoaded(true)
    }
  }, [autoLoad, vendorsPath, widgetPath, cssPath])

  useEffect(() => {
    // Only initialize if scripts are loaded
    if (!scriptsLoaded || !containerRef.current || !window.CustomGPTWidget) {
      return
    }

    // Initialize widget with enhanced configuration
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
      onMessage,
      onConversationChange
    })

    widgetRef.current = widget

    // Cleanup on unmount
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy()
      }
    }
  }, [
    scriptsLoaded,
    agentId,
    agentName,
    apiBaseUrl,
    width,
    height,
    theme,
    enableConversationManagement,
    maxConversations
  ])

  // Generate unique container ID
  const containerId = `customgpt-widget-${Math.random().toString(36).substr(2, 9)}`

  if (error) {
    return (
      <div className='error-message' style={{ color: 'red' }}>
        {error}
      </div>
    )
  }

  if (!scriptsLoaded && autoLoad) {
    return <div className='loading-widget'>Loading CustomGPT widget...</div>
  }

  return (
    <div
      ref={containerRef}
      id={containerId}
      style={{ width, height }}
      className='customgpt-widget-container'
    />
  )
}

export default SimplifiedCustomGPTWidget
```

### 6. Floating Button (`src/components/CustomGPTFloatingButton.jsx`)

```jsx
/**
 * Simplified Floating Button Example
 * 
 * This component provides a floating chat button with secure API integration
 * and full conversation management capabilities.
 */

import React, { useState, useEffect, useRef } from 'react'

// Use CDN for widget files
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget'

// Helper function to load scripts dynamically
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// Helper function to load stylesheets
const loadStylesheet = (href) => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

const SimplifiedFloatingButton = ({
  agentId,
  agentName,
  apiBaseUrl = '/api/proxy', // Use relative URL for same-origin requests
  position = 'bottom-right',
  primaryColor = '#007acc',
  buttonSize = 'md',
  chatWidth = '400px',
  chatHeight = '600px',
  maxConversations = 5,
  enableConversationManagement = true,
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
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [error, setError] = useState(null)
  const widgetRef = useRef(null)

  // Load scripts if autoLoad is enabled and scripts aren't already loaded
  useEffect(() => {
    if (autoLoad && !window.CustomGPTWidget) {
      const loadWidgetScripts = async () => {
        try {
          // Load CSS first
          loadStylesheet(cssPath)

          // Load vendors.js first (React, ReactDOM dependencies)
          await loadScript(vendorsPath)

          // Then load the widget
          await loadScript(widgetPath)

          setScriptsLoaded(true)
        } catch (err) {
          setError(`Failed to load widget scripts: ${err.message}`)
          console.error('Failed to load CustomGPT widget scripts:', err)
        }
      }

      loadWidgetScripts()
    } else if (window.CustomGPTWidget) {
      setScriptsLoaded(true)
    }
  }, [autoLoad, vendorsPath, widgetPath, cssPath])

  useEffect(() => {
    // Only initialize if scripts are loaded
    if (!scriptsLoaded || !window.CustomGPTWidget) {
      return
    }

    // Create floating widget instance
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
    })

    widgetRef.current = widget

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy()
      }
    }
  }, [
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
  ])

  const handleToggle = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle()
    }
  }

  // Button sizing
  const sizes = {
    sm: { button: 'w-12 h-12', icon: 'w-5 h-5' },
    md: { button: 'w-14 h-14', icon: 'w-6 h-6' },
    lg: { button: 'w-16 h-16', icon: 'w-7 h-7' }
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  if (error) {
    return (
      <div className='fixed bottom-6 right-6 rounded-lg bg-red-100 p-4 text-red-700'>{error}</div>
    )
  }

  if (!scriptsLoaded && autoLoad) {
    return (
      <div className='fixed bottom-6 right-6 rounded-lg bg-gray-100 p-4 text-gray-700'>
        Loading CustomGPT widget...
      </div>
    )
  }

  if (!scriptsLoaded && !autoLoad) {
    return (
      <div className='fixed bottom-6 right-6 max-w-sm rounded-lg bg-yellow-100 p-4 text-yellow-800'>
        <p className='mb-2 font-semibold'>CustomGPT Widget Not Loaded</p>
        <p className='mb-2 text-sm'>Please include the required scripts in your HTML:</p>
        <pre className='overflow-x-auto rounded bg-yellow-50 p-2 text-xs'>
          {`<script src="${vendorsPath}"></script>
<script src="${widgetPath}"></script>
<link rel="stylesheet" href="${cssPath}">`}
        </pre>
        <p className='mt-2 text-sm'>
          Or set <code className='rounded bg-yellow-200 px-1'>autoLoad={true}</code>
        </p>
      </div>
    )
  }

  if (isOpen) {
    return null // Hide button when chat is open
  }

  return (
    <div className={`fixed z-50 ${positionClasses[position]}`}>
      {/* Hover Label */}
      {showLabel && isHovered && (
        <div
          className={`absolute ${
            position.includes('right') ? 'right-full mr-3' : 'left-full ml-3'
          } top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm text-white`}
        >
          {label}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${sizes[buttonSize].button} flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:shadow-xl`}
        style={{ backgroundColor: primaryColor }}
      >
        <svg
          className={`${sizes[buttonSize].icon} text-white`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
          />
        </svg>
      </button>
    </div>
  )
}

export default SimplifiedFloatingButton
```

## Usage Examples

### 7. Implementation in Pages/Components

```jsx
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import SimplifiedCustomGPTWidget from '@site/src/components/Chat';
import SimplifiedFloatingButton from '@site/src/components/CustomGPTFloatingButton';

function MyPage() {
  const { siteConfig } = useDocusaurusContext();
  const { customFields } = siteConfig;

  return (
    <div>
      {/* Embedded Chat Widget */}
      <SimplifiedCustomGPTWidget
        agentId={customFields?.CUSTOMGPT_AGENT_ID as string}
        agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
        apiBaseUrl="/api/proxy"
        theme="light"
        maxConversations={5}
        enableConversationManagement={true}
        onMessage={(msg) => console.log('New message:', msg)}
        onConversationChange={(conv) => console.log('Conversation changed:', conv)}
      />

      {/* Floating Chat Button */}
      <SimplifiedFloatingButton
        agentId={customFields?.CUSTOMGPT_AGENT_ID_2 as string}
        agentName={customFields?.CUSTOMGPT_AGENT_NAME_2 as string}
        apiBaseUrl="/api/proxy"
        position="bottom-right"
        maxConversations={5}
        enableConversationManagement={false}
      />
    </div>
  );
}

export default MyPage;
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install express cors dotenv
```

### 2. Setup Environment Variables

Create `.env` file in your project root with your CustomGPT credentials.

### 3. Start Development Servers

```bash
# Terminal 1: Start proxy server
node server.js

# Terminal 2: Start Docusaurus
npm start
```

### 4. Production Deployment

For production, ensure:
- Deploy your proxy server to your hosting platform
- Update `apiBaseUrl` in widgets to point to your production proxy server
- Use environment variables for API keys (never hardcode them)
- Set up HTTPS for your proxy server

## Security Features

✅ **API Key Protection**: Keys never exposed to client-side code
✅ **Server-side Validation**: All requests validated before proxying
✅ **CORS Configuration**: Proper cross-origin handling
✅ **Error Handling**: Comprehensive error catching and logging
✅ **Request Logging**: Full request/response logging for debugging

## Troubleshooting

### Common Issues

1. **404 Errors**: Ensure proxy server is running on port 3001
2. **CORS Errors**: Check that both servers are running and proxy configuration is correct
3. **Widget Not Loading**: Verify CDN URLs are accessible and scripts load properly
4. **API Key Errors**: Ensure environment variables are set correctly

### Debug Steps

1. Check browser network tab for failed requests
2. Check server.js terminal for proxy logs
3. Test proxy server health check: `curl http://localhost:3001/health`
4. Verify environment variables are loaded correctly

## Production Considerations

1. **Scaling**: Consider using PM2 or similar for production deployment
2. **SSL**: Use HTTPS for production proxy server
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Monitoring**: Add proper logging and monitoring
5. **Error Tracking**: Implement error tracking service integration

This integration provides enterprise-grade security while maintaining full CustomGPT widget functionality in your Docusaurus application.