/**
 * CustomGPT Floating Button Component with Direct API Key Support
 * 
 * This component creates a floating chat button that opens a CustomGPT widget.
 * It supports direct API key usage for standalone deployments.
 * 
 * SECURITY WARNING: Using API keys directly in the browser exposes them.
 * See security notes at the bottom of this file.
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

const CustomGPTFloatingButtonWithApiKey = ({
  // Required props
  apiKey, // Your CustomGPT API key
  agentId, // Your agent/project ID
  
  // Optional props
  agentName,
  position = 'bottom-right',
  maxConversations = 5,
  enableConversationManagement = true,
  theme = 'light',
  
  // Button customization
  buttonText = '💬', // Default chat icon
  buttonStyle = {},
  
  // Widget file paths
  vendorsPath = '/dist/widget/vendors.js',
  widgetPath = '/dist/widget/customgpt-widget.js',
  cssPath = '/dist/widget/customgpt-widget.css',
  autoLoad = true,
  
  // Callbacks
  onOpen,
  onClose,
  onMessage,
  onConversationChange,
}) => {
  const widgetRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

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
          
          // Load vendors.js first
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

  // Initialize floating widget
  useEffect(() => {
    if (!scriptsLoaded || !window.CustomGPTWidget || error) {
      return;
    }

    try {
      // Initialize widget in floating mode with API key
      const widget = window.CustomGPTWidget.init({
        // API Configuration
        apiKey: apiKey, // This enables direct API mode
        agentId: parseInt(agentId) || agentId,
        agentName: agentName,
        
        // Widget Configuration
        mode: 'floating',
        position: position,
        theme: theme,
        width: '400px',
        height: '600px',
        
        // Features
        enableCitations: true,
        enableFeedback: true,
        enableConversationManagement: enableConversationManagement,
        maxConversations: maxConversations,
        
        // Callbacks
        onOpen: () => {
          setIsOpen(true);
          onOpen?.();
        },
        onClose: () => {
          setIsOpen(false);
          onClose?.();
        },
        onMessage: onMessage,
        onConversationChange: onConversationChange,
      });

      widgetRef.current = widget;
      console.log('Floating widget initialized successfully in direct API mode');

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
  }, [scriptsLoaded, apiKey, agentId, agentName, position, theme, enableConversationManagement, maxConversations, error]);

  // Handle button click
  const handleButtonClick = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle();
    }
  };

  // Default button styles
  const defaultButtonStyle = {
    position: 'fixed',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease',
    zIndex: 9998,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...getPositionStyles(position),
    ...buttonStyle,
  };

  if (error) {
    console.error('CustomGPT Floating Button Error:', error);
    return null; // Don't render anything if there's an error
  }

  if (!scriptsLoaded && autoLoad) {
    // Don't show loading state for floating button
    return null;
  }

  return (
    <button
      onClick={handleButtonClick}
      style={defaultButtonStyle}
      className="customgpt-floating-button"
      aria-label="Open chat"
    >
      {buttonText}
    </button>
  );
};

// Helper function to get position styles
function getPositionStyles(position) {
  const margin = '20px';
  
  switch (position) {
    case 'bottom-right':
      return { bottom: margin, right: margin };
    case 'bottom-left':
      return { bottom: margin, left: margin };
    case 'top-right':
      return { top: margin, right: margin };
    case 'top-left':
      return { top: margin, left: margin };
    default:
      return { bottom: margin, right: margin };
  }
}

export default CustomGPTFloatingButtonWithApiKey;

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// Example 1: Basic floating button
<CustomGPTFloatingButtonWithApiKey
  apiKey="cgpt_your_api_key_here"
  agentId="123"
  agentName="Support Assistant"
/>

// Example 2: Customized floating button
<CustomGPTFloatingButtonWithApiKey
  apiKey="cgpt_your_api_key_here"
  agentId="456"
  agentName="Customer Support"
  position="bottom-left"
  buttonText="💬 Chat"
  buttonStyle={{
    backgroundColor: '#28a745',
    width: '120px',
    borderRadius: '25px',
  }}
  maxConversations={10}
  onOpen={() => console.log('Chat opened')}
  onClose={() => console.log('Chat closed')}
  onMessage={(message) => console.log('New message:', message)}
/>

// Example 3: Your use case (corrected)
<CustomGPTFloatingButtonWithApiKey
  apiKey={customFields?.CUSTOMGPT_API_KEY}
  agentId={customFields?.CUSTOMGPT_AGENT_ID_2}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME || "Assistant"}
  position="bottom-right"
  maxConversations={5}
  enableConversationManagement={true}
/>

// Example 4: Multiple floating buttons for different agents
<>
  <CustomGPTFloatingButtonWithApiKey
    apiKey={apiKey}
    agentId="sales-agent"
    agentName="Sales Assistant"
    position="bottom-left"
    buttonText="💼"
    buttonStyle={{ backgroundColor: '#17a2b8' }}
  />
  
  <CustomGPTFloatingButtonWithApiKey
    apiKey={apiKey}
    agentId="support-agent"
    agentName="Support Assistant"
    position="bottom-right"
    buttonText="🛟"
    buttonStyle={{ backgroundColor: '#28a745' }}
  />
</>
*/

// ========================================
// CUSTOM STYLING EXAMPLES
// ========================================

/*
// Example: Rectangular button with text
<CustomGPTFloatingButtonWithApiKey
  apiKey={apiKey}
  agentId={agentId}
  buttonText="💬 Need Help?"
  buttonStyle={{
    width: 'auto',
    padding: '12px 24px',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  }}
/>

// Example: Pulsing animation
<CustomGPTFloatingButtonWithApiKey
  apiKey={apiKey}
  agentId={agentId}
  buttonStyle={{
    animation: 'pulse 2s infinite',
  }}
/>

// Add this CSS to your stylesheet:
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
*/

// ========================================
// SECURITY CONSIDERATIONS
// ========================================

/*
⚠️ IMPORTANT: API Key Security

When using API keys in the browser:

1. The API key is visible to anyone who can:
   - Open browser developer tools
   - View page source
   - Intercept network requests

2. Recommended security measures:
   - Use restricted API keys with:
     * Domain whitelist (only your domains)
     * Specific agent restrictions
     * Rate limiting
     * Read-only permissions where possible
   
3. For production environments:
   - Set up a backend proxy server
   - Use the proxy mode instead:
   
   // Secure proxy mode (recommended)
   <CustomGPTFloatingButtonWithApiKey
     apiUrl="https://your-backend.com/api/customgpt"
     agentId={agentId}
     // No apiKey needed - backend adds it
   />

4. API Key best practices:
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly
   - Monitor usage for anomalies
   - Have separate keys for dev/staging/prod
*/