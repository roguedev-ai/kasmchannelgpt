/**
 * Simplified Floating Button Example
 * 
 * This example shows how to create a floating chat button using the
 * enhanced widget API. All conversation management is handled by the
 * core widget - no need to implement it yourself!
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

import React, { useState, useEffect, useRef } from 'react';

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

const SimplifiedFloatingButton = ({
  agentId,
  agentName,
  apiKey, // Add API key support
  apiBaseUrl, // Add proxy URL support
  position = 'bottom-right',
  primaryColor = '#007acc',
  buttonSize = 'md',
  chatWidth = '400px',
  chatHeight = '600px',
  maxConversations,
  enableConversationManagement = true,
  showLabel = true,
  label = 'Chat with us',
  theme = 'light', // Add theme support
  onMessage, // Add message callback
  onConversationChange, // Add conversation change callback
  // Add these props to specify file locations
  vendorsPath = `${CDN_BASE}/vendors.js`,
  widgetPath = `${CDN_BASE}/customgpt-widget.js`,
  cssPath = `${CDN_BASE}/customgpt-widget.css`,
  autoLoad = false, // Set to true to automatically load scripts
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const widgetRef = useRef(null);

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
    if (!scriptsLoaded || !window.CustomGPTWidget) {
      return;
    }

    // Create floating widget instance
    const widget = window.CustomGPTWidget.init({
      agentId: parseInt(agentId) || agentId,
      agentName,
      apiKey, // Pass API key for standalone usage
      apiBaseUrl, // Pass proxy URL if provided
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
      onClose: () => setIsOpen(false),
    });

    widgetRef.current = widget;

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [scriptsLoaded, agentId, agentName, apiKey, apiBaseUrl, position, chatWidth, chatHeight, theme, enableConversationManagement, maxConversations, onMessage, onConversationChange]);

  const handleToggle = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle();
    }
  };

  // Button sizing
  const sizes = {
    sm: { button: 'w-12 h-12', icon: 'w-5 h-5' },
    md: { button: 'w-14 h-14', icon: 'w-6 h-6' },
    lg: { button: 'w-16 h-16', icon: 'w-7 h-7' },
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  if (error) {
    return <div className="fixed bottom-6 right-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  if (!scriptsLoaded && autoLoad) {
    return (
      <div className="fixed bottom-6 right-6 p-4 bg-gray-100 text-gray-700 rounded-lg">
        Loading CustomGPT widget...
      </div>
    );
  }

  if (!scriptsLoaded && !autoLoad) {
    return (
      <div className="fixed bottom-6 right-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg max-w-sm">
        <p className="font-semibold mb-2">CustomGPT Widget Not Loaded</p>
        <p className="text-sm mb-2">Please include the required scripts in your HTML:</p>
        <pre className="text-xs bg-yellow-50 p-2 rounded overflow-x-auto">
{`<script src="${vendorsPath}"></script>
<script src="${widgetPath}"></script>
<link rel="stylesheet" href="${cssPath}">`}
        </pre>
        <p className="text-sm mt-2">Or set <code className="bg-yellow-200 px-1 rounded">autoLoad={true}</code></p>
      </div>
    );
  }

  if (isOpen) {
    return null; // Hide button when chat is open
  }

  return (
    <div className={`fixed z-50 ${positionClasses[position]}`}>
      {/* Hover Label */}
      {showLabel && isHovered && (
        <div
          className={`absolute ${
            position.includes('right') ? 'right-full mr-3' : 'left-full ml-3'
          } top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap`}
        >
          {label}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${sizes[buttonSize].button} rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center`}
        style={{ backgroundColor: primaryColor }}
      >
        <svg
          className={`${sizes[buttonSize].icon} text-white`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    </div>
  );
};

export default SimplifiedFloatingButton;

// Example usage:
/*
// Option 1: With scripts already loaded in HTML (your current pattern)
<SimplifiedFloatingButton
  agentId="123"
  agentName="Support Assistant"
  apiKey="cgpt_your_api_key_here"
  position="bottom-right"
  maxConversations={5}
  enableConversationManagement={true}
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>

// Option 2: With your custom fields pattern
<SimplifiedFloatingButton
  apiKey={customFields?.CUSTOMGPT_API_KEY as string}
  agentId={customFields?.CUSTOMGPT_AGENT_ID as string}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
  position="bottom-right"
  maxConversations={5}
  enableConversationManagement={true}
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>

// Option 3: With backend proxy (most secure)
<SimplifiedFloatingButton
  agentId="123"
  agentName="Support Assistant"
  apiBaseUrl="/api/proxy" // Your backend proxy
  position="bottom-right"
  maxConversations={5}
  enableConversationManagement={true}
  autoLoad={true}
  vendorsPath={`${CDN_BASE}/vendors.js`}
  widgetPath={`${CDN_BASE}/customgpt-widget.js`}
  cssPath={`${CDN_BASE}/customgpt-widget.css`}
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>
*/