// Complete React Standalone Example with API Key Management
// This example demonstrates all three methods of API key configuration
// for standalone CustomGPT widget usage

import React, { useEffect, useState, useCallback } from 'react';

// Method 1: Backend Proxy Setup (Recommended)
export function ProxyBasedChatWidget({ agentId }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWidget = async () => {
      try {
        // Load widget assets
        await loadWidgetAssets();
        
        // Initialize with proxy configuration
        if (window.CustomGPTWidget) {
          window.CustomGPTWidget.init({
            agentId: parseInt(agentId),
            apiBaseUrl: '/api/customgpt-proxy', // Your backend proxy endpoint
            containerId: 'proxy-chat-widget',
            mode: 'embedded',
            theme: 'light',
            // No apiKey needed - handled by your backend
          });
          setIsLoaded(true);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    loadWidget();
  }, [agentId]);

  return (
    <div className="chat-widget-container">
      <h3>Proxy-Based Chat Widget (Recommended)</h3>
      {error && <div className="error">Error: {error}</div>}
      {!isLoaded && <div className="loading">Loading chat widget...</div>}
      <div 
        id="proxy-chat-widget" 
        style={{ 
          width: '100%', 
          height: '500px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }} 
      />
    </div>
  );
}

// Method 2: Environment Variable Configuration
export function EnvBasedChatWidget({ agentId }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Validate environment variables
    if (!process.env.REACT_APP_CUSTOMGPT_API_KEY) {
      setError('REACT_APP_CUSTOMGPT_API_KEY environment variable is required');
      return;
    }

    const loadWidget = async () => {
      try {
        await loadWidgetAssets();
        
        if (window.CustomGPTWidget) {
          window.CustomGPTWidget.init({
            agentId: parseInt(agentId || process.env.REACT_APP_CUSTOMGPT_AGENT_ID),
            apiKey: process.env.REACT_APP_CUSTOMGPT_API_KEY,
            containerId: 'env-chat-widget',
            mode: 'embedded',
            theme: 'dark',
            debug: process.env.NODE_ENV === 'development',
          });
          setIsLoaded(true);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    loadWidget();
  }, [agentId]);

  return (
    <div className="chat-widget-container">
      <h3>Environment Variable Based Widget</h3>
      {error && <div className="error">Error: {error}</div>}
      {!isLoaded && <div className="loading">Loading chat widget...</div>}
      <div 
        id="env-chat-widget" 
        style={{ 
          width: '100%', 
          height: '500px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }} 
      />
    </div>
  );
}

// Method 3: Runtime Configuration Widget
export function RuntimeConfigChatWidget() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({
    agentId: '',
    apiKey: '',
  });

  const handleConfigSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!config.agentId || !config.apiKey) {
      setError('Both Agent ID and API Key are required');
      return;
    }

    try {
      await loadWidgetAssets();
      
      if (window.CustomGPTWidget) {
        window.CustomGPTWidget.init({
          agentId: parseInt(config.agentId),
          apiKey: config.apiKey,
          containerId: 'runtime-chat-widget',
          mode: 'embedded',
          theme: 'auto',
        });
        setIsLoaded(true);
        setIsConfigured(true);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [config]);

  if (!isConfigured) {
    return (
      <div className="config-form">
        <h3>Configure Chat Widget</h3>
        <form onSubmit={handleConfigSubmit}>
          <div className="form-group">
            <label htmlFor="agentId">Agent ID:</label>
            <input
              type="text"
              id="agentId"
              value={config.agentId}
              onChange={(e) => setConfig(prev => ({ ...prev, agentId: e.target.value }))}
              placeholder="Enter your agent ID"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="apiKey">API Key:</label>
            <input
              type="password"
              id="apiKey"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Enter your CustomGPT API key"
              required
            />
          </div>
          <button type="submit">Initialize Chat Widget</button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="chat-widget-container">
      <h3>Runtime Configured Widget</h3>
      {!isLoaded && <div className="loading">Loading chat widget...</div>}
      <div 
        id="runtime-chat-widget" 
        style={{ 
          width: '100%', 
          height: '500px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }} 
      />
    </div>
  );
}

// Floating Button with Multiple Trigger Options
export function CustomFloatingButton({ agentId, apiKey, position = 'bottom-right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadWidget = async () => {
      try {
        await loadWidgetAssets();
        
        if (window.CustomGPTWidget) {
          window.CustomGPTWidget.init({
            agentId: parseInt(agentId),
            apiKey: apiKey,
            mode: 'floating',
            position: position,
            theme: 'auto',
            autoOpen: false, // We'll control opening manually
            customTrigger: true, // Disable default floating button
          });
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load floating widget:', err);
      }
    };

    loadWidget();
  }, [agentId, apiKey, position]);

  const toggleChat = () => {
    if (window.CustomGPTWidget) {
      if (isOpen) {
        window.CustomGPTWidget.close();
      } else {
        window.CustomGPTWidget.open();
      }
      setIsOpen(!isOpen);
    }
  };

  const positionStyles = {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
  };

  return (
    <button
      onClick={toggleChat}
      disabled={!isLoaded}
      style={{
        position: 'fixed',
        ...positionStyles[position],
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        cursor: isLoaded ? 'pointer' : 'not-allowed',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        transition: 'all 0.3s ease',
      }}
      className="floating-chat-button"
    >
      {isLoaded ? (isOpen ? '✕' : '💬') : '⏳'}
    </button>
  );
}

// Main Demo App Component
export function StandaloneChatDemo() {
  const [activeDemo, setActiveDemo] = useState('proxy');

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>CustomGPT React Standalone Demo</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Choose Integration Method:</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setActiveDemo('proxy')}
            className={activeDemo === 'proxy' ? 'active' : ''}
          >
            Backend Proxy (Recommended)
          </button>
          <button 
            onClick={() => setActiveDemo('env')}
            className={activeDemo === 'env' ? 'active' : ''}
          >
            Environment Variables
          </button>
          <button 
            onClick={() => setActiveDemo('runtime')}
            className={activeDemo === 'runtime' ? 'active' : ''}
          >
            Runtime Configuration
          </button>
          <button 
            onClick={() => setActiveDemo('floating')}
            className={activeDemo === 'floating' ? 'active' : ''}
          >
            Floating Button
          </button>
        </div>
      </div>

      <div className="demo-content">
        {activeDemo === 'proxy' && (
          <ProxyBasedChatWidget agentId="123" />
        )}
        
        {activeDemo === 'env' && (
          <EnvBasedChatWidget agentId="123" />
        )}
        
        {activeDemo === 'runtime' && (
          <RuntimeConfigChatWidget />
        )}
        
        {activeDemo === 'floating' && (
          <div>
            <p>Floating button widget initialized. Check bottom-right corner.</p>
            <CustomFloatingButton 
              agentId="123" 
              apiKey="your-api-key-here"
              position="bottom-right"
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
        <h3>Backend Proxy Setup Example (Node.js/Express):</h3>
        <pre style={{ backgroundColor: '#1e293b', color: '#e2e8f0', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
{`// server.js
app.use('/api/customgpt-proxy', async (req, res) => {
  const apiPath = req.path;
  const response = await fetch(\`https://app.customgpt.ai/api/v1\${apiPath}\`, {
    method: req.method,
    headers: {
      'Authorization': \`Bearer \${process.env.CUSTOMGPT_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
});`}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
        <h3>Environment Variables Setup:</h3>
        <pre style={{ backgroundColor: '#92400e', color: '#fef3c7', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
{`# .env.local
REACT_APP_CUSTOMGPT_API_KEY=cgpt_your_api_key_here
REACT_APP_CUSTOMGPT_AGENT_ID=123

# .env.production (for production builds)
REACT_APP_CUSTOMGPT_API_KEY=cgpt_production_key_here
REACT_APP_CUSTOMGPT_AGENT_ID=456`}
        </pre>
      </div>
    </div>
  );
}

// Utility function to load widget assets
async function loadWidgetAssets() {
  // Skip if already loaded
  if (window.CustomGPTWidget) {
    return Promise.resolve();
  }

  // Load CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = '/customgpt-widget.css'; // Adjust path as needed
  document.head.appendChild(cssLink);

  // Load scripts
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  };

  // Load in correct order
  await loadScript('/vendors.js');
  await loadScript('/customgpt-widget.js');
}

// CSS styles (add to your CSS file)
const styles = `
.chat-widget-container {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}

.config-form {
  max-width: 400px;
  margin: 20px auto;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover {
  background: #2563eb;
}

button.active {
  background: #1d4ed8;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  padding: 12px;
  border-radius: 6px;
  margin: 10px 0;
  border: 1px solid #fecaca;
}

.loading {
  color: #6b7280;
  font-style: italic;
  padding: 20px;
  text-align: center;
}
`;

export default StandaloneChatDemo;