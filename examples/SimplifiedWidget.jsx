/**
 * Simplified CustomGPT Widget Example
 * 
 * This example shows how to use the enhanced widget with built-in
 * conversation management instead of implementing it yourself.
 * 
 * IMPORTANT: You must load the widget JavaScript files before using this component!
 * 
 * Option 1 - In your HTML (before React app):
 * <script src="https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/vendors.js"></script>
 * <script src="https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/customgpt-widget.js"></script>
 * <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/customgpt-widget.css">
 * 
 * Option 2 - CDN (when available):
 * <script src="https://cdn.customgpt.ai/widget/latest/vendors.js"></script>
 * <script src="https://cdn.customgpt.ai/widget/latest/customgpt-widget.js"></script>
 * <link rel="stylesheet" href="https://cdn.customgpt.ai/widget/latest/customgpt-widget.css">
 * 
 * Option 3 - Dynamic loading in the component (see below)
 */

import React, { useEffect, useRef, useState } from 'react';

// GitHub CDN base path for widget files
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget';

// Helper function to load scripts dynamically
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Helper function to load stylesheets
const loadStylesheet = (href) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const SimplifiedCustomGPTWidget = ({
  agentId,
  agentName,
  apiKey, // Add API key support
  apiBaseUrl, // Add proxy URL support
  width = '100%',
  height = '600px',
  maxConversations,
  enableConversationManagement = true,
  onMessage,
  onConversationChange,
  theme = 'light', // Add theme support
  // Add these props to specify file locations
  vendorsPath = `${CDN_BASE}/vendors.js`,
  widgetPath = `${CDN_BASE}/customgpt-widget.js`,
  cssPath = `${CDN_BASE}/customgpt-widget.css`,
  autoLoad = false, // Set to true to automatically load scripts
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Load scripts if autoLoad is enabled and scripts aren't already loaded
  useEffect(() => {
    if (autoLoad && !window.CustomGPTWidget) {
      const loadWidgetScripts = async () => {
        try {
          // Load CSS first
          loadStylesheet(cssPath);
          
          // Load vendors.js first (React, ReactDOM dependencies)
          await loadScript(vendorsPath);
          
          // Then load the widget
          await loadScript(widgetPath);
          
          setScriptsLoaded(true);
        } catch (err) {
          setError(`Failed to load widget scripts: ${err.message}`);
          console.error('Failed to load CustomGPT widget scripts:', err);
        }
      };
      
      loadWidgetScripts();
    } else if (window.CustomGPTWidget) {
      setScriptsLoaded(true);
    }
  }, [autoLoad, vendorsPath, widgetPath, cssPath]);

  useEffect(() => {
    // Only initialize if scripts are loaded
    if (!scriptsLoaded || !containerRef.current || !window.CustomGPTWidget) {
      return;
    }

    // Initialize widget with enhanced configuration
    const widget = window.CustomGPTWidget.init({
      agentId: parseInt(agentId) || agentId,
      agentName,
      apiKey, // Pass API key for standalone usage
      apiBaseUrl, // Pass proxy URL if provided
      containerId: containerRef.current.id,
      mode: 'embedded',
      width,
      height,
      theme,
      enableConversationManagement,
      maxConversations,
      onMessage,
      onConversationChange,
    });

    widgetRef.current = widget;

    // Cleanup on unmount
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [scriptsLoaded, agentId, agentName, apiKey, apiBaseUrl, width, height, theme, enableConversationManagement, maxConversations]);

  // Generate unique container ID
  const containerId = `customgpt-widget-${Math.random().toString(36).substr(2, 9)}`;

  if (error) {
    return <div className="error-message" style={{ color: 'red' }}>{error}</div>;
  }

  if (!scriptsLoaded && autoLoad) {
    return <div className="loading-widget">Loading CustomGPT widget...</div>;
  }

  if (!scriptsLoaded && !autoLoad) {
    return (
      <div className="widget-not-loaded" style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <p><strong>CustomGPT Widget Not Loaded</strong></p>
        <p>Please ensure you've included the required scripts in your HTML:</p>
        <pre style={{ background: '#eee', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
{`<script src="${vendorsPath}"></script>
<script src="${widgetPath}"></script>
<link rel="stylesheet" href="${cssPath}">`}
        </pre>
        <p>Or set <code>autoLoad={true}</code> to load them automatically.</p>
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

export default SimplifiedCustomGPTWidget;

// ==========================================
// 📖 USAGE EXAMPLES - ALL FRAMEWORKS
// ==========================================

/*
// ========================================== 
// ✅ PRODUCTION - SECURE DEPLOYMENT PATTERNS
// ==========================================

// 🚀 REACT (Create React App) - Universal Proxy Server
// Environment: .env.local
// REACT_APP_CUSTOMGPT_AGENT_ID=78913
// REACT_APP_CUSTOMGPT_AGENT_NAME=Support Assistant
// REACT_APP_API_PROXY_URL=http://localhost:3001/api/proxy

import SimplifiedCustomGPTWidget from './SimplifiedWidget';

function App() {
  return (
    <div className="App">
      <SimplifiedCustomGPTWidget
        agentId={process.env.REACT_APP_CUSTOMGPT_AGENT_ID}
        agentName={process.env.REACT_APP_CUSTOMGPT_AGENT_NAME}
        apiBaseUrl={process.env.REACT_APP_API_PROXY_URL}
        theme="light"
        maxConversations={5}
        enableConversationManagement={true}
        onMessage={(msg) => console.log('New message:', msg)}
        onConversationChange={(conv) => console.log('Conversation changed:', conv)}
      />
    </div>
  );
}

// 🚀 NEXT.JS - Built-in API Routes
// Environment: .env.local
// CUSTOMGPT_API_KEY=your_secret_key (server-side)
// NEXT_PUBLIC_CUSTOMGPT_AGENT_ID=78913
// NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME=Support Assistant

import SimplifiedCustomGPTWidget from '../components/SimplifiedWidget';

export default function ChatPage() {
  return (
    <main>
      <h1>Customer Support</h1>
      <SimplifiedCustomGPTWidget
        agentId={process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID}
        agentName={process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME}
        apiBaseUrl="/api/proxy" // Next.js API route handles proxy
        theme="dark"
        maxConversations={10}
        enableConversationManagement={true}
        onMessage={(msg) => console.log('Message:', msg)}
        onConversationChange={(conv) => console.log('Conversation:', conv)}
      />
    </main>
  );
}

// 🔧 VUE.JS - Universal Proxy Server
// Environment: .env
// VITE_CUSTOMGPT_AGENT_ID=78913
// VITE_CUSTOMGPT_AGENT_NAME=Support Assistant
// VITE_API_PROXY_URL=http://localhost:3001/api/proxy

// In Vue component:
// <template>
//   <div id="chat-widget" ref="widgetContainer"></div>
// </template>
// 
// <script>
// import { onMounted, ref } from 'vue';
// 
// export default {
//   setup() {
//     const widgetContainer = ref(null);
// 
//     onMounted(() => {
//       if (window.CustomGPTWidget) {
//         window.CustomGPTWidget.init({
//           agentId: import.meta.env.VITE_CUSTOMGPT_AGENT_ID,
//           agentName: import.meta.env.VITE_CUSTOMGPT_AGENT_NAME,
//           apiBaseUrl: import.meta.env.VITE_API_PROXY_URL,
//           containerId: 'chat-widget',
//           theme: 'light',
//           enableConversationManagement: true,
//         });
//       }
//     });
// 
//     return { widgetContainer };
//   }
// };
// </script>

// 🔧 ANGULAR - Universal Proxy Server  
// Environment: src/environments/environment.ts
// export const environment = {
//   production: false,
//   customgpt: {
//     agentId: '78913',
//     agentName: 'Support Assistant',
//     proxyUrl: 'http://localhost:3001/api/proxy'
//   }
// };

// In Angular component:
// import { Component, OnInit } from '@angular/core';
// import { environment } from '../environments/environment';
// 
// @Component({
//   selector: 'app-chat',
//   template: '<div id="chat-widget"></div>'
// })
// export class ChatComponent implements OnInit {
//   ngOnInit() {
//     if ((window as any).CustomGPTWidget) {
//       (window as any).CustomGPTWidget.init({
//         agentId: environment.customgpt.agentId,
//         agentName: environment.customgpt.agentName,
//         apiBaseUrl: environment.customgpt.proxyUrl,
//         containerId: 'chat-widget',
//         theme: 'light',
//         enableConversationManagement: true,
//         onMessage: (msg: any) => console.log('Message:', msg)
//       });
//     }
//   }
// }

// 🔧 SVELTE - Universal Proxy Server
// Environment: .env
// VITE_CUSTOMGPT_AGENT_ID=78913
// VITE_CUSTOMGPT_AGENT_NAME=Support Assistant  
// VITE_API_PROXY_URL=http://localhost:3001/api/proxy

// In Svelte component:
// <script>
//   import { onMount } from 'svelte';
//   import { VITE_CUSTOMGPT_AGENT_ID, VITE_API_PROXY_URL } from '$env/static/public';
// 
//   onMount(() => {
//     if (window.CustomGPTWidget) {
//       window.CustomGPTWidget.init({
//         agentId: VITE_CUSTOMGPT_AGENT_ID,
//         apiBaseUrl: VITE_API_PROXY_URL,
//         containerId: 'chat-widget',
//         theme: 'light',
//         enableConversationManagement: true,
//       });
//     }
//   });
// </script>
// 
// <div id="chat-widget"></div>

// 🔧 CROSS-FRAMEWORK Helper with Environment Detection
function createSecureChatWidget(containerId, options = {}) {
  // Auto-detect environment variables across frameworks
  const agentId = 
    process.env.REACT_APP_CUSTOMGPT_AGENT_ID ||        // React
    process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID ||      // Next.js
    import.meta.env.VITE_CUSTOMGPT_AGENT_ID ||         // Vue/Vite
    '78913'; // Fallback

  const apiBaseUrl = 
    process.env.REACT_APP_API_PROXY_URL ||             // React
    '/api/proxy' ||                                // Next.js
    import.meta.env.VITE_API_PROXY_URL ||              // Vue/Vite
    'http://localhost:3001/api/proxy';             // Fallback

  if (!agentId) {
    console.error('❌ CustomGPT Agent ID not found. Please set environment variables.');
    return null;
  }

  return (
    <SimplifiedCustomGPTWidget
      agentId={agentId}
      apiBaseUrl={apiBaseUrl}
      containerId={containerId}
      theme={options.theme || 'light'}
      maxConversations={options.maxConversations || 5}
      enableConversationManagement={options.enableConversationManagement || true}
      onMessage={options.onMessage}
      onConversationChange={options.onConversationChange}
      {...options}
    />
  );
}

// ==========================================
// ⚠️ DEVELOPMENT ONLY - DIRECT API MODE
// ==========================================

// 🔧 DEVELOPMENT/TESTING - Direct API Key (NOT for production)
<SimplifiedCustomGPTWidget
  agentId="78913"
  agentName="Support Bot"
  apiKey="cgpt_your_api_key_here" // ⚠️ ONLY for development/internal tools!
  theme="light"
  maxConversations={5}
  enableConversationManagement={false}
  onMessage={(msg) => console.log('Dev message:', msg)}
  onConversationChange={(conv) => console.log('Dev conversation:', conv)}
/>

// 🔧 STATIC HTML - Direct API (Internal tools only)
// <script>
//   CustomGPTWidget.init({
//     agentId: '78913',
//     apiKey: 'your_api_key_here', // ⚠️ ONLY for internal use!
//     containerId: 'chat-container',
//     theme: 'dark',
//     enableConversationManagement: true,
//     onMessage: (msg) => console.log('Message:', msg)
//   });
// </script>
*/