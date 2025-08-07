/**
 * Simplified CustomGPT Widget Example
 * 
 * This example shows how to use the enhanced widget with built-in
 * conversation management instead of implementing it yourself.
 * 
 * IMPORTANT: You must load the widget JavaScript files before using this component!
 * 
 * Option 1 - In your HTML (before React app):
 * <script src="/path/to/dist/widget/vendors.js"></script>
 * <script src="/path/to/dist/widget/customgpt-widget.js"></script>
 * <link rel="stylesheet" href="/path/to/dist/widget/customgpt-widget.css">
 * 
 * Option 2 - CDN (when available):
 * <script src="https://cdn.customgpt.ai/widget/latest/vendors.js"></script>
 * <script src="https://cdn.customgpt.ai/widget/latest/customgpt-widget.js"></script>
 * <link rel="stylesheet" href="https://cdn.customgpt.ai/widget/latest/customgpt-widget.css">
 * 
 * Option 3 - Dynamic loading in the component (see below)
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
  vendorsPath = '/dist/widget/vendors.js',
  widgetPath = '/dist/widget/customgpt-widget.js',
  cssPath = '/dist/widget/customgpt-widget.css',
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

// Example usage:
/*
// Option 1: With scripts already loaded in HTML (your current pattern)
<SimplifiedCustomGPTWidget
  agentId="123"
  agentName="Support Bot"
  apiKey="cgpt_your_api_key_here"
  maxConversations={5}
  enableConversationManagement={true}
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Changed to:', conv)}
/>

// Option 2: With backend proxy (most secure)
<SimplifiedCustomGPTWidget
  agentId="123"
  agentName="Support Bot"
  apiBaseUrl="/api/customgpt-proxy" // Your backend proxy
  maxConversations={5}
  enableConversationManagement={true}
  autoLoad={true}
  vendorsPath="/dist/widget/vendors.js"
  widgetPath="/dist/widget/customgpt-widget.js"
  cssPath="/dist/widget/customgpt-widget.css"
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Changed to:', conv)}
/>

// Option 3: With environment variables (your exact current pattern)
<SimplifiedCustomGPTWidget
  apiKey={customFields?.CUSTOMGPT_API_KEY as string}
  agentId={customFields?.CUSTOMGPT_AGENT_ID as string}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
  maxConversations={5}
  enableConversationManagement={true}
  theme="light"
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>

// Option 4: With automatic script loading from your dist folder
<SimplifiedCustomGPTWidget
  agentId="123"
  agentName="Support Bot"
  apiKey="cgpt_your_api_key_here"
  maxConversations={5}
  enableConversationManagement={true}
  autoLoad={true}
  vendorsPath="/dist/widget/vendors.js"
  widgetPath="/dist/widget/customgpt-widget.js"
  cssPath="/dist/widget/customgpt-widget.css"
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Changed to:', conv)}
/>
*/