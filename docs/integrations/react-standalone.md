# React Standalone Widget Integration Guide

This guide covers how to integrate CustomGPT widgets into your React applications with standalone API key management.

## Overview

The CustomGPT widgets can be deployed in three modes:
1. **Widget Mode** - Embeddable widget bundle for any website
2. **Iframe Mode** - Isolated iframe for maximum compatibility 
3. **React Component** - Direct React component integration

## API Key Setup for Standalone Usage

When using widgets standalone (not through the main CustomGPT app), you have several options for API key management:

### Option 1: Backend Proxy (Recommended)

**Most Secure**: Keep API keys on your server and proxy requests.

```javascript
// Your backend API endpoint
app.post('/api/customgpt-proxy/*', async (req, res) => {
  const apiPath = req.params[0];
  const response = await fetch(`https://app.customgpt.ai/api/v1/${apiPath}`, {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${process.env.CUSTOMGPT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });
  
  const data = await response.json();
  res.json(data);
});
```

Configure widget to use your proxy:
```javascript
window.CustomGPTWidget.init({
  agentId: 'your-agent-id',
  apiBaseUrl: '/api/customgpt-proxy', // Your proxy endpoint
  // No apiKey needed - handled by your backend
});
```

### Option 2: Environment Variables (Client-side)

**Less Secure**: For development or when backend proxy isn't possible.

```bash
# .env.local
REACT_APP_CUSTOMGPT_API_KEY=your_api_key_here
REACT_APP_CUSTOMGPT_AGENT_ID=your_agent_id
```

```javascript
window.CustomGPTWidget.init({
  agentId: process.env.REACT_APP_CUSTOMGPT_AGENT_ID,
  apiKey: process.env.REACT_APP_CUSTOMGPT_API_KEY,
});
```

### Option 3: Runtime Configuration

**Dynamic Setup**: Configure API key at runtime through your app's settings.

```javascript
// Your settings/config component
function setupCustomGPT(apiKey, agentId) {
  window.CustomGPTWidget.init({
    agentId: agentId,
    apiKey: apiKey,
  });
}
```

## Installation & Setup

### 1. Widget Mode (JavaScript Bundle)

**Step 1**: Copy widget files to your public directory:
```bash
# Copy from dist/widget/ to your public folder
cp dist/widget/customgpt-widget.js public/
cp dist/widget/customgpt-widget.css public/
cp dist/widget/vendors.js public/
```

**Step 2**: Add to your React app's `public/index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/customgpt-widget.css">
</head>
<body>
  <div id="root"></div>
  
  <!-- CustomGPT Widget Scripts -->
  <script src="/vendors.js"></script>
  <script src="/customgpt-widget.js"></script>
</body>
</html>
```

**Step 3**: Initialize in your React component:
```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Wait for widget to load
    if (window.CustomGPTWidget) {
      window.CustomGPTWidget.init({
        agentId: 'your-agent-id',
        apiKey: 'your-api-key', // Or use proxy setup
        theme: 'light', // or 'dark'
        position: 'bottom-right',
        triggerSelector: '#chat-trigger', // Optional custom trigger
      });
    }
  }, []);

  const openChat = () => {
    window.CustomGPTWidget?.open();
  };

  return (
    <div>
      <h1>My React App</h1>
      <button id="chat-trigger" onClick={openChat}>
        Open Chat
      </button>
    </div>
  );
}
```

### 2. Iframe Mode

**Step 1**: Host the iframe files:
```bash
# Copy from dist/iframe/ to your public folder
cp -r dist/iframe/ public/customgpt-iframe/
```

**Step 2**: Embed in your React component:
```jsx
import { useEffect, useRef } from 'react';

function CustomGPTIframe({ agentId, apiKey }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      // Configure iframe via postMessage
      iframe.onload = () => {
        iframe.contentWindow.postMessage({
          type: 'INIT_CONFIG',
          config: {
            agentId: agentId,
            apiKey: apiKey,
            theme: 'light',
          }
        }, '*');
      };
    }
  }, [agentId, apiKey]);

  return (
    <iframe
      ref={iframeRef}
      src="/customgpt-iframe/index.html"
      width="100%"
      height="600px"
      style={{ border: 'none', borderRadius: '8px' }}
    />
  );
}
```

### 3. Direct React Component

**Step 1**: Install dependencies in your React project:
```bash
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install zustand sonner lucide-react
npm install tailwindcss
```

**Step 2**: Copy component files:
```bash
# Copy these files to your src/ directory:
cp -r src/components/chat/ your-app/src/components/
cp -r src/components/ui/ your-app/src/components/
cp -r src/lib/ your-app/src/lib/
cp -r src/store/ your-app/src/store/
cp -r src/types/ your-app/src/types/
```

**Step 3**: Use in your React app:
```jsx
import { ChatLayout } from './components/chat/ChatLayout';
import { useConfigStore } from './store/config';

function App() {
  const { initialize } = useConfigStore();

  useEffect(() => {
    // Initialize with your settings
    initialize({
      agentId: 'your-agent-id',
      apiKey: 'your-api-key',
      theme: 'light',
    });
  }, [initialize]);

  return (
    <div className="h-screen">
      <ChatLayout />
    </div>
  );
}
```

## Configuration Options

### Widget Configuration
```javascript
window.CustomGPTWidget.init({
  // Required
  agentId: 'your-agent-id',
  
  // API Configuration (choose one)
  apiKey: 'your-api-key',              // Direct API key (less secure)
  apiBaseUrl: '/api/your-proxy',       // Your proxy endpoint (recommended)
  
  // UI Configuration
  theme: 'light' | 'dark' | 'auto',    // Theme mode
  position: 'bottom-right' | 'bottom-left' | 'custom',
  triggerSelector: '#custom-trigger',   // Custom trigger element
  
  // Behavior
  autoOpen: false,                     // Auto-open on page load
  welcomeMessage: 'Hi! How can I help?',
  placeholder: 'Type your message...',
  
  // Styling
  primaryColor: '#3b82f6',             // Brand color
  borderRadius: '12px',                // Border radius
  fontFamily: 'Inter, sans-serif',     // Font family
  
  // Advanced
  allowFileUpload: true,               // Enable file uploads
  enableVoiceInput: true,              // Enable voice input
  showCitations: true,                 // Show sources/citations
  conversationHistory: true,           // Enable conversation history
});
```

### Iframe Configuration
```javascript
// Send configuration via postMessage
iframe.contentWindow.postMessage({
  type: 'INIT_CONFIG',
  config: {
    agentId: 'your-agent-id',
    apiKey: 'your-api-key',
    theme: 'light',
    welcomeMessage: 'Welcome to our chat!',
    primaryColor: '#3b82f6',
  }
}, '*');
```

## API Key Security Best Practices

### 1. Use Environment Variables
```bash
# .env.local (never commit this file)
REACT_APP_CUSTOMGPT_API_KEY=cgpt_xxxxx
```

### 2. Implement Backend Proxy
```javascript
// pages/api/customgpt/[...path].js (Next.js example)
export default async function handler(req, res) {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  
  const response = await fetch(`https://app.customgpt.ai/api/v1/${apiPath}`, {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${process.env.CUSTOMGPT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
}
```

### 3. Domain Restrictions
Configure your CustomGPT API key to only work from specific domains in your CustomGPT dashboard.

## Advanced Integration

### Custom Styling
```css
/* Override widget styles */
.customgpt-widget {
  --primary-color: #your-brand-color;
  --border-radius: 8px;
  --font-family: 'Your Font', sans-serif;
}

.customgpt-widget .chat-container {
  max-height: 500px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}
```

### Event Handling
```javascript
// Listen for widget events
window.addEventListener('customgpt-widget-ready', () => {
  console.log('Widget is ready');
});

window.addEventListener('customgpt-message-sent', (event) => {
  console.log('Message sent:', event.detail);
});

window.addEventListener('customgpt-message-received', (event) => {
  console.log('Message received:', event.detail);
});
```

### Custom Triggers
```jsx
function CustomChatButton() {
  const openChat = () => {
    window.CustomGPTWidget?.open();
  };

  return (
    <button 
      onClick={openChat}
      className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
    >
      <MessageCircle size={24} />
    </button>
  );
}
```

## Troubleshooting

### Common Issues

1. **Widget Not Loading**
   - Check browser console for JavaScript errors
   - Verify all script files are accessible
   - Ensure scripts load in correct order (vendors.js first)

2. **API Key Issues**
   - Verify API key is valid and not expired
   - Check CORS settings if using direct API calls
   - Ensure domain is whitelisted in CustomGPT dashboard

3. **Styling Conflicts**
   - Use iframe mode for complete CSS isolation
   - Add CSS specificity to override conflicts
   - Check for conflicting CSS frameworks

4. **Performance Issues**
   - Implement lazy loading for widget
   - Use code splitting for large integrations
   - Consider iframe mode for heavy widgets

### Debug Mode
```javascript
window.CustomGPTWidget.init({
  // ... your config
  debug: true, // Enable debug logging
});
```

## Examples

See the `/examples` directory for complete working examples:
- `react-widget.jsx` - Basic React widget integration
- `react-floating-button.jsx` - Custom floating button trigger
- `react-integration.jsx` - Full React component integration

## Support

For issues and questions:
- Check the troubleshooting section above
- Review examples in `/examples` directory  
- Open an issue on GitHub
- Contact CustomGPT support