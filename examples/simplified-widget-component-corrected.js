/**
 * Simplified CustomGPT Widget Example - CORRECTED VERSION
 * 
 * IMPORTANT CHANGES:
 * - The widget no longer accepts apiKey parameter
 * - You must use apiUrl to point to your deployed Next.js server
 * - The API key should be stored as CUSTOMGPT_API_KEY environment variable in your Next.js deployment
 * 
 * This example shows how to use the widget on external sites.
 * 
 * IMPORTANT: You must load the widget JavaScript files before using this component!
 * 
 * Option 1 - In your HTML (before React app):
 * <script src="/path/to/dist/widget/vendors.js"></script>
 * <script src="/path/to/dist/widget/customgpt-widget.js"></script>
 * <link rel="stylesheet" href="/path/to/dist/widget/customgpt-widget.css">
 * 
 * Option 2 - Dynamic loading in the component (see below)
 */

import React, { useEffect, useRef, useState } from 'react';

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
  apiUrl, // REQUIRED: URL to your Next.js server (e.g., 'https://your-app.vercel.app')
  width = '100%',
  height = '600px',
  maxConversations,
  enableConversationManagement = true,
  onMessage,
  onConversationChange,
  theme = 'light',
  // Add these props to specify file locations
  vendorsPath = '/dist/widget/vendors.js',
  widgetPath = '/dist/widget/customgpt-widget.js',
  cssPath = '/dist/widget/customgpt-widget.css',
  autoLoad = true, // Set to true to automatically load scripts
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Validate required props
  useEffect(() => {
    if (!apiUrl) {
      setError('apiUrl is required. Please provide the URL to your deployed Next.js CustomGPT UI server.');
    }
  }, [apiUrl]);

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
    // Only initialize if scripts are loaded and we have required props
    if (!scriptsLoaded || !containerRef.current || !window.CustomGPTWidget || !apiUrl) {
      return;
    }

    // Initialize widget with correct configuration
    const widget = window.CustomGPTWidget.init({
      agentId: parseInt(agentId) || agentId,
      agentName,
      apiUrl, // This is the key parameter - points to your Next.js server
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
  }, [scriptsLoaded, agentId, agentName, apiUrl, width, height, theme, enableConversationManagement, maxConversations]);

  // Generate unique container ID
  const containerId = `customgpt-widget-${Math.random().toString(36).substr(2, 9)}`;

  if (error) {
    return (
      <div className="error-message" style={{ 
        color: 'red', 
        padding: '20px', 
        background: '#fee', 
        borderRadius: '8px',
        margin: '10px 0'
      }}>
        <strong>Widget Error:</strong> {error}
      </div>
    );
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

// CORRECT USAGE EXAMPLES:

// Example 1: Using with deployed Next.js app (RECOMMENDED)
/*
<SimplifiedCustomGPTWidget
  apiUrl="https://your-customgpt-ui.vercel.app" // Your deployed Next.js app
  agentId="123"
  agentName="Support Bot"
  maxConversations={5}
  enableConversationManagement={true}
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Changed to:', conv)}
/>
*/

// Example 2: Using with local development
/*
<SimplifiedCustomGPTWidget
  apiUrl="http://localhost:3000" // Your local Next.js dev server
  agentId="123"
  agentName="Support Bot"
  maxConversations={5}
  enableConversationManagement={true}
  autoLoad={true}
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Changed to:', conv)}
/>
*/

// Example 3: CORRECTED version of your usage
/*
// First, deploy your Next.js app to Vercel with CUSTOMGPT_API_KEY in environment variables
// Then use it like this:

<SimplifiedCustomGPTWidget
  apiUrl="https://your-customgpt-ui.vercel.app" // REPLACE with your actual deployment URL
  agentId={customFields?.CUSTOMGPT_AGENT_ID as string}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
  maxConversations={5}
  enableConversationManagement={true}
  theme="light"
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>

// For the floating button:
<SimplifiedFloatingButton
  apiUrl="https://your-customgpt-ui.vercel.app" // REPLACE with your actual deployment URL
  agentId={customFields?.CUSTOMGPT_AGENT_ID_2 as string}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
  position="bottom-right"
  maxConversations={5}
  enableConversationManagement={true}
/>
*/

// IMPORTANT NOTES:
// 1. The widget DOES NOT accept API keys directly for security reasons
// 2. You must deploy the Next.js CustomGPT UI app with your API key in environment variables
// 3. The apiUrl parameter should point to your deployed Next.js app
// 4. The Next.js app acts as a proxy, adding the API key server-side
// 5. This ensures your API key is never exposed in the browser