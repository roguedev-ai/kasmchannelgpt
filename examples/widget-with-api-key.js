/**
 * CustomGPT Widget Component with Direct API Key Support
 * 
 * This component shows how to use the CustomGPT widget with a direct API key,
 * allowing it to work on external sites without a proxy server.
 * 
 * SECURITY WARNING: Using API keys directly in the browser exposes them to users.
 * Only use this approach with:
 * - Restricted API keys with limited permissions
 * - Internal/trusted applications
 * - Development environments
 * 
 * For production use, consider using the proxy mode with a backend server.
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

const CustomGPTWidgetWithApiKey = ({
  // Required props
  apiKey, // Your CustomGPT API key
  agentId, // Your agent/project ID
  
  // Optional props
  agentName,
  width = '100%',
  height = '600px',
  maxConversations = 5,
  enableConversationManagement = true,
  theme = 'light',
  
  // Widget file paths
  vendorsPath = '/dist/widget/vendors.js',
  widgetPath = '/dist/widget/customgpt-widget.js',
  cssPath = '/dist/widget/customgpt-widget.css',
  autoLoad = true,
  
  // Callbacks
  onMessage,
  onConversationChange,
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Validate required props
  useEffect(() => {
    if (!apiKey) {
      setError('API key is required for widget initialization');
    }
    if (!agentId) {
      setError('Agent ID is required for widget initialization');
    }
  }, [apiKey, agentId]);

  // Load scripts if autoLoad is enabled
  useEffect(() => {
    if (autoLoad && !window.CustomGPTWidget && !error) {
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
  }, [autoLoad, vendorsPath, widgetPath, cssPath, error]);

  // Initialize widget
  useEffect(() => {
    if (!scriptsLoaded || !containerRef.current || !window.CustomGPTWidget || error) {
      return;
    }

    try {
      // Initialize widget with API key for direct mode
      const widget = window.CustomGPTWidget.init({
        // API Configuration
        apiKey: apiKey, // This enables direct API mode
        agentId: parseInt(agentId) || agentId,
        agentName: agentName,
        
        // Widget Configuration
        containerId: containerRef.current.id,
        mode: 'embedded',
        width: width,
        height: height,
        theme: theme,
        
        // Features
        enableCitations: true,
        enableFeedback: true,
        enableConversationManagement: enableConversationManagement,
        maxConversations: maxConversations,
        
        // Callbacks
        onMessage: onMessage,
        onConversationChange: onConversationChange,
      });

      widgetRef.current = widget;
      console.log('Widget initialized successfully in direct API mode');

    } catch (err) {
      setError(`Failed to initialize widget: ${err.message}`);
      console.error('Widget initialization error:', err);
    }

    // Cleanup on unmount
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [scriptsLoaded, apiKey, agentId, agentName, width, height, theme, enableConversationManagement, maxConversations, error]);

  // Generate unique container ID
  const containerId = `customgpt-widget-${Math.random().toString(36).substr(2, 9)}`;

  if (error) {
    return (
      <div style={{ 
        color: '#721c24',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        padding: '12px 20px',
        margin: '10px 0',
        fontFamily: 'Arial, sans-serif'
      }}>
        <strong>Widget Error:</strong> {error}
      </div>
    );
  }

  if (!scriptsLoaded && autoLoad) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        color: '#666'
      }}>
        Loading CustomGPT widget...
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

export default CustomGPTWidgetWithApiKey;

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// Example 1: Basic usage with API key
<CustomGPTWidgetWithApiKey
  apiKey="cgpt_your_api_key_here"
  agentId="123"
  agentName="Support Assistant"
/>

// Example 2: Full configuration
<CustomGPTWidgetWithApiKey
  apiKey="cgpt_your_api_key_here"
  agentId="456"
  agentName="Customer Support Bot"
  width="400px"
  height="600px"
  maxConversations={10}
  enableConversationManagement={true}
  theme="light"
  onMessage={(message) => {
    console.log('New message:', message);
    // Track analytics, log, etc.
  }}
  onConversationChange={(conversation) => {
    console.log('Switched to conversation:', conversation);
  }}
/>

// Example 3: Your use case (corrected)
<CustomGPTWidgetWithApiKey
  apiKey={customFields?.CUSTOMGPT_API_KEY}
  agentId={customFields?.CUSTOMGPT_AGENT_ID}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME || "Assistant"}
  maxConversations={5}
  enableConversationManagement={true}
  theme="light"
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>

// Example 4: Floating button variant
// You would need to create a similar component for floating mode
const CustomGPTFloatingButtonWithApiKey = ({ apiKey, agentId, ...props }) => {
  // Similar implementation but with mode: 'floating'
  // and no container - widget creates its own
};
*/

// ========================================
// IMPORTANT SECURITY NOTES
// ========================================

/*
1. API Key Exposure:
   - The API key will be visible in the browser's developer tools
   - Anyone can extract and use your API key
   - Only use restricted keys with limited permissions

2. Best Practices:
   - Create API keys specifically for frontend use with restrictions:
     * Limited to specific domains
     * Limited to specific agents
     * Rate limited
     * Read-only permissions where possible
   
3. Alternative Approaches:
   - Use proxy mode with a backend server (most secure)
   - Implement your own backend that adds the API key
   - Use environment-specific keys (dev/staging/prod)

4. For Production:
   - Consider implementing a backend proxy
   - Use the apiUrl parameter instead of apiKey
   - Keep your API key secure on the server

Example proxy setup:
<CustomGPTWidgetWithApiKey
  apiUrl="https://your-backend.com/api/customgpt"
  agentId="123"
  // No apiKey needed - backend adds it
/>
*/