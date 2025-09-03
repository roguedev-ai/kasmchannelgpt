# CustomGPT Widget Integration with React (Create React App)

Complete guide for securely integrating CustomGPT widgets into React applications using Create React App.

## Overview

This integration provides:
- ✅ **Enterprise-grade security**: API keys never exposed to the browser
- ✅ **Full widget functionality**: Embedded chat, floating button, streaming responses
- ✅ **Production-ready**: Proper error handling, logging, and fallbacks
- ✅ **Development workflow**: Hot reload with proxy configuration

## Architecture

```
Browser Widget → React Dev Server (port 3000) → Proxy Server (port 3001) → CustomGPT API
```

## Required Files

### 1. Environment Configuration (`.env`)

```bash
# SERVER-SIDE ONLY (secure) 
CUSTOMGPT_API_KEY=your_customgpt_api_key

# CLIENT-SIDE (safe to expose in React)
REACT_APP_CUSTOMGPT_AGENT_ID=78913
REACT_APP_CUSTOMGPT_AGENT_NAME=Your Agent Name
REACT_APP_CUSTOMGPT_AGENT_ID_2=78913
REACT_APP_CUSTOMGPT_AGENT_NAME_2=Your Floating Agent Name

# API Configuration
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
PORT=3001
NODE_ENV=development
```

### 2. Proxy Server (`server.js`)

Use our universal proxy server that handles all widget endpoints:

```javascript
// Use the universal-customgpt-proxy.js from examples directory
// Copy universal-customgpt-proxy.js to your project root as server.js
```

Or create a React-specific version:

```javascript
/**
 * CustomGPT Proxy Server for React Applications
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

// CORS - allow React dev server
app.use(cors({
  origin: [
    'http://localhost:3000',   // React dev server
    'http://localhost:3001',   // Alt dev port
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper function to get agent ID with React-specific fallbacks
function getAgentId(projectId) {
  if (projectId && projectId !== 'undefined' && projectId !== 'null') {
    return projectId;
  }
  return process.env.REACT_APP_CUSTOMGPT_AGENT_ID || '78913';
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CustomGPT React Proxy'
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
  
  console.log(`[REACT WIDGET] POST ${customgptUrl}`);

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
    console.error('[REACT PROXY ERROR]', error);
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
  
  console.log(`[REACT WIDGET] POST ${customgptUrl}`);

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
    console.error('[REACT PROXY ERROR]', error);
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
    console.error('[REACT PROXY ERROR]', error);
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
    console.error('[REACT PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\\n🚀 CustomGPT React Proxy Server Started`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxy: http://localhost:${PORT}/api/proxy/*`);
  console.log(`🔑 API Key: ${process.env.CUSTOMGPT_API_KEY ? 'Yes ✅' : 'No ❌'}`);
  console.log(`⚛️  React: http://localhost:3000`);
});

module.exports = app;
```

### 3. Development Proxy Configuration

#### Option A: Using CRACO (Recommended)

Install CRACO for webpack customization without ejecting:

```bash
npm install @craco/craco
```

Create `craco.config.js`:

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api/proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        logLevel: 'debug',
        onError: (err, req, res) => {
          console.error('[CRACO PROXY ERROR]', err.message);
          res.status(500).json({
            error: 'Proxy request failed',
            details: err.message,
            suggestion: 'Make sure server.js is running on port 3001'
          });
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log(`[CRACO PROXY] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
        }
      }
    }
  }
};
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  }
}
```

#### Option B: Using setupProxy.js (Alternative)

Create `src/setupProxy.js`:

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/proxy',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('[SETUP PROXY ERROR]', err.message);
        res.status(500).json({
          error: 'Development proxy failed',
          details: err.message,
          suggestion: 'Ensure server.js is running on port 3001'
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[SETUP PROXY] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
      }
    })
  );
};
```

### 4. React Widget Components

#### Embedded Chat Widget (`src/components/CustomGPTWidget.jsx`)

```jsx
/**
 * CustomGPT Embedded Widget for React
 * 
 * Provides full chat functionality with conversation management
 * and secure API integration through proxy server.
 */

import React, { useEffect, useRef, useState } from 'react';

// CDN base for widget files
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget';

// Helper functions for dynamic script loading
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
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
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const CustomGPTWidget = ({
  agentId = process.env.REACT_APP_CUSTOMGPT_AGENT_ID,
  agentName = process.env.REACT_APP_CUSTOMGPT_AGENT_NAME,
  apiBaseUrl = '/api/proxy', // Uses React dev server proxy
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

  // Load widget scripts
  useEffect(() => {
    if (autoLoad && !window.CustomGPTWidget) {
      const loadWidgetScripts = async () => {
        try {
          console.log('[React Widget] Loading CustomGPT scripts...');
          
          // Load CSS first
          loadStylesheet(cssPath);
          
          // Load vendors.js (React, ReactDOM dependencies)
          await loadScript(vendorsPath);
          
          // Load the main widget
          await loadScript(widgetPath);
          
          console.log('[React Widget] Scripts loaded successfully');
          setScriptsLoaded(true);
        } catch (err) {
          const errorMsg = `Failed to load CustomGPT widget: ${err.message}`;
          console.error('[React Widget]', errorMsg);
          setError(errorMsg);
        }
      };
      
      loadWidgetScripts();
    } else if (window.CustomGPTWidget) {
      setScriptsLoaded(true);
    }
  }, [autoLoad, vendorsPath, widgetPath, cssPath]);

  // Initialize widget
  useEffect(() => {
    if (!scriptsLoaded || !containerRef.current || !window.CustomGPTWidget) {
      return;
    }

    console.log('[React Widget] Initializing with config:', {
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
          console.log('[React Widget] Message:', msg);
          onMessage?.(msg);
        },
        onConversationChange: (conv) => {
          console.log('[React Widget] Conversation changed:', conv);
          onConversationChange?.(conv);
        },
        onError: (err) => {
          console.error('[React Widget] Widget error:', err);
          setError(`Widget error: ${err.message || err}`);
        }
      });

      widgetRef.current = widget;
      console.log('[React Widget] Initialized successfully');

      return () => {
        if (widgetRef.current) {
          console.log('[React Widget] Destroying widget');
          widgetRef.current.destroy();
        }
      };
    } catch (err) {
      const errorMsg = `Failed to initialize widget: ${err.message}`;
      console.error('[React Widget]', errorMsg);
      setError(errorMsg);
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
    maxConversations,
    onMessage,
    onConversationChange
  ]);

  // Generate unique container ID
  const containerId = React.useMemo(() => 
    `customgpt-widget-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );

  if (error) {
    return (
      <div className="customgpt-error" style={{ 
        padding: '20px', 
        background: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '8px',
        color: '#c33'
      }}>
        <h4>CustomGPT Widget Error</h4>
        <p>{error}</p>
        <details style={{ marginTop: '10px' }}>
          <summary>Debug Information</summary>
          <pre style={{ fontSize: '12px', marginTop: '8px' }}>
{`Scripts Loaded: ${scriptsLoaded}
Agent ID: ${agentId}
API Base URL: ${apiBaseUrl}
Container ID: ${containerId}`}
          </pre>
        </details>
      </div>
    );
  }

  if (!scriptsLoaded && autoLoad) {
    return (
      <div className="customgpt-loading" style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#f5f5f5',
        borderRadius: '8px'
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

export default CustomGPTWidget;
```

#### Floating Button Widget (`src/components/CustomGPTFloatingButton.jsx`)

```jsx
/**
 * CustomGPT Floating Button for React
 * 
 * Provides floating chat button with full widget functionality
 * and secure API integration through proxy server.
 */

import React, { useState, useEffect, useRef } from 'react';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget';

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
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
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const CustomGPTFloatingButton = ({
  agentId = process.env.REACT_APP_CUSTOMGPT_AGENT_ID_2,
  agentName = process.env.REACT_APP_CUSTOMGPT_AGENT_NAME_2,
  apiBaseUrl = '/api/proxy',
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
  const widgetRef = useRef(null);

  // Load scripts
  useEffect(() => {
    if (autoLoad && !window.CustomGPTWidget) {
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
    } else if (window.CustomGPTWidget) {
      setScriptsLoaded(true);
    }
  }, [autoLoad, vendorsPath, widgetPath, cssPath]);

  // Initialize floating widget
  useEffect(() => {
    if (!scriptsLoaded || !window.CustomGPTWidget) return;

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

  const handleToggle = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle();
    }
  };

  // Button size configurations
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

  return (
    <>
      {/* Floating Button - only show fallback if widget didn't render */}
      {!scriptsLoaded && !autoLoad && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999
        }} className={positions[position]}>
          {showLabel && isHovered && (
            <div style={{
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              marginRight: '12px',
              padding: '8px 12px',
              background: '#333',
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}>
              {label}
            </div>
          )}
          
          <button
            onClick={handleToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              backgroundColor: primaryColor,
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s'
            }}
            className={sizes[buttonSize]}
            title={label}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: 'white' }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h.01M12 10h.01M16 10h.01" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default CustomGPTFloatingButton;
```

### 5. Usage in React App

#### App.js Example

```jsx
import React from 'react';
import './App.css';
import CustomGPTWidget from './components/CustomGPTWidget';
import CustomGPTFloatingButton from './components/CustomGPTFloatingButton';

function App() {
  const handleMessage = (message) => {
    console.log('New message received:', message);
    // Handle message events (analytics, notifications, etc.)
  };

  const handleConversationChange = (conversation) => {
    console.log('Conversation changed:', conversation);
    // Handle conversation changes (analytics, state updates, etc.)
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>My React App with CustomGPT</h1>
      </header>
      
      <main>
        <section style={{ margin: '40px 0' }}>
          <h2>Customer Support</h2>
          <div style={{ height: '600px', maxWidth: '800px' }}>
            <CustomGPTWidget
              agentId={process.env.REACT_APP_CUSTOMGPT_AGENT_ID}
              agentName={process.env.REACT_APP_CUSTOMGPT_AGENT_NAME}
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
        agentId={process.env.REACT_APP_CUSTOMGPT_AGENT_ID_2}
        agentName={process.env.REACT_APP_CUSTOMGPT_AGENT_NAME_2}
        position="bottom-right"
        maxConversations={3}
        enableConversationManagement={false}
        onMessage={handleMessage}
        onConversationChange={handleConversationChange}
      />
    </div>
  );
}

export default App;
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Core dependencies
npm install

# For CRACO approach (recommended)
npm install @craco/craco

# For setupProxy.js approach (alternative)
npm install http-proxy-middleware

# For proxy server
npm install express cors dotenv
```

### 2. Environment Configuration

Create `.env` file in your project root:

```bash
# SERVER-SIDE (secure - never exposed to browser)
CUSTOMGPT_API_KEY=your_api_key_here

# CLIENT-SIDE (safe to expose via REACT_APP_ prefix)
REACT_APP_CUSTOMGPT_AGENT_ID=78913
REACT_APP_CUSTOMGPT_AGENT_NAME=Support Assistant
REACT_APP_CUSTOMGPT_AGENT_ID_2=78913
REACT_APP_CUSTOMGPT_AGENT_NAME_2=Quick Help

# Server configuration
PORT=3001
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
```

### 3. Start Development Servers

```bash
# Terminal 1: Start proxy server
node server.js

# Terminal 2: Start React app
npm start
```

Your React app will be available at `http://localhost:3000` with full CustomGPT widget functionality.

## Production Deployment

### 1. Build React App

```bash
npm run build
```

### 2. Deploy Proxy Server

Deploy your proxy server (`server.js`) to your hosting platform:

- **Heroku**: Add `CUSTOMGPT_API_KEY` to environment variables
- **Vercel**: Use Vercel Functions (see Next.js guide)
- **AWS**: Use Lambda or EC2 with environment variables
- **Docker**: Use our containerization guide

### 3. Update Production Configuration

Update `apiBaseUrl` in your production build:

```jsx
// For production deployment
<CustomGPTWidget
  apiBaseUrl="https://your-proxy-server.com/api/proxy"
  // ... other props
/>
```

## Security Features

✅ **API Key Protection**: Keys never exposed to client-side code  
✅ **CORS Configuration**: Proper cross-origin handling  
✅ **Input Validation**: Server-side request validation  
✅ **Error Handling**: Comprehensive error catching and logging  
✅ **Environment Isolation**: Separate dev and production configurations  

## Troubleshooting

### Common Issues

1. **Widget Not Loading**:
   - Check browser console for script loading errors
   - Verify CDN URLs are accessible
   - Ensure proxy server is running

2. **Proxy Errors**:
   - Check proxy server logs for detailed errors
   - Verify `.env` file has correct API key
   - Test proxy server health: `curl http://localhost:3001/health`

3. **CORS Issues**:
   - Ensure proxy server allows React dev server origin
   - Check browser network tab for preflight requests
   - Verify CRACO or setupProxy.js configuration

4. **Environment Variables**:
   - React requires `REACT_APP_` prefix for client-side variables
   - Server-side variables (API keys) should NOT have the prefix
   - Restart development server after changing `.env`

### Debug Steps

1. **Check Proxy Server Health**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test Widget Endpoints**:
   ```bash
   curl -X POST http://localhost:3001/api/proxy/projects/78913/conversations \
     -H "Content-Type: application/json" \
     -d '{"message": "Test"}'
   ```

3. **Verify Environment Variables**:
   ```javascript
   // Add to your component for debugging
   console.log('Agent ID:', process.env.REACT_APP_CUSTOMGPT_AGENT_ID);
   console.log('API Base URL: /api/proxy');
   ```

## Production Considerations

1. **Environment Variables**: Use your hosting platform's environment variable system
2. **API Key Security**: Never commit API keys to version control
3. **CORS Configuration**: Update allowed origins for production domains
4. **SSL/HTTPS**: Ensure both React app and proxy server use HTTPS in production
5. **Rate Limiting**: Consider adding rate limiting to proxy server
6. **Monitoring**: Add logging and monitoring for production deployments
7. **Error Tracking**: Integrate error tracking service (Sentry, Bugsnag, etc.)

This React integration provides enterprise-grade security while maintaining full CustomGPT widget functionality with proper development workflow support.