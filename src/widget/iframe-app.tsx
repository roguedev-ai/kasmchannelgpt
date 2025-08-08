import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';

import '../app/globals.css';
import { useAgentStore } from '../store';
import { ChatLayout } from '../components/chat/ChatLayout';

interface IframeConfig {
  agentId: number | string;
  agentName?: string;
  mode: 'embedded' | 'floating' | 'widget';
  theme: 'light' | 'dark';
  enableCitations: boolean;
  enableFeedback: boolean;
  sessionId?: string;
  threadId?: string;
  isolateConversations?: boolean;
}

const IframeApp: React.FC = () => {
  const [config, setConfig] = useState<IframeConfig | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const agentIdParam = urlParams.get('agentId');
    
    const iframeConfig: IframeConfig = {
      agentId: agentIdParam ? (isNaN(Number(agentIdParam)) ? agentIdParam : Number(agentIdParam)) : '',
      agentName: urlParams.get('agentName') || undefined,
      mode: (urlParams.get('mode') as any) || 'embedded',
      theme: (urlParams.get('theme') as any) || 'light',
      enableCitations: urlParams.get('enableCitations') !== 'false',
      enableFeedback: urlParams.get('enableFeedback') !== 'false',
      sessionId: urlParams.get('sessionId') || undefined,
      threadId: urlParams.get('threadId') || undefined,
      isolateConversations: urlParams.get('isolateConversations') === 'true',
    };
    
    if (!iframeConfig.agentId) {
      console.error('CustomGPT: Agent ID is required');
      return;
    }

    setConfig(iframeConfig);
    
    // Set up the agent - create a minimal agent object with the provided ID
    const agent: any = {
      id: typeof iframeConfig.agentId === 'string' ? parseInt(iframeConfig.agentId) : iframeConfig.agentId,
      project_name: iframeConfig.agentName || `Agent ${iframeConfig.agentId}`,
      is_chat_active: true,
    };
    useAgentStore.getState().selectAgent(agent);

    // Set up message handling with parent window
    setupMessageHandling();

    // Notify parent that iframe is ready
    postMessageToParent('ready', { config: iframeConfig });
    setIsReady(true);
  }, []);

  const setupMessageHandling = () => {
    window.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'customgpt-open':
          handleOpen();
          break;
        case 'customgpt-close':
          handleClose();
          break;
        case 'customgpt-config-update':
          handleConfigUpdate(data);
          break;
      }
    });

    // Handle window resize for responsive behavior
    const handleResize = () => {
      postMessageToParent('resize', {
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // Send initial size
    setTimeout(handleResize, 100);
  };

  const postMessageToParent = (type: string, data: any = {}) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: `customgpt-${type}`,
        data
      }, '*');
    }
  };

  const handleOpen = () => {
    // Handle any iframe-specific open logic
  };

  const handleClose = () => {
    // Handle any iframe-specific close logic
    postMessageToParent('close');
  };

  const handleConfigUpdate = (newConfig: Partial<IframeConfig>) => {
    if (config) {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      
      // Update agent if needed
      if (newConfig.agentId || newConfig.agentName) {
        const agent: any = {
          id: typeof updatedConfig.agentId === 'string' ? parseInt(updatedConfig.agentId) : updatedConfig.agentId,
          project_name: updatedConfig.agentName || `Agent ${updatedConfig.agentId}`,
          is_chat_active: true,
        };
        useAgentStore.getState().selectAgent(agent);
      }
    }
  };

  const handleMessage = (message: any) => {
    // Relay messages to parent window
    postMessageToParent('message', message);
  };

  const handleError = (error: any) => {
    // Relay errors to parent window
    postMessageToParent('error', error);
    console.error('Widget error:', error);
  };

  // Show loading state until config is available
  if (!config || !isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CustomGPT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      <ChatLayout
        mode="widget"
        showSidebar={false} // No sidebar in iframe mode
        onClose={config.mode === 'floating' ? handleClose : undefined}
      />
      <Toaster 
        position="top-center"
        closeButton
        gap={8}
        toastOptions={{
          style: { 
            zIndex: 10000,
            marginTop: '8px'
          }
        }}
      />
    </div>
  );
};

// Initialize the app
const initIframeApp = () => {
  const container = document.getElementById('iframe-app');
  if (container) {
    const root = createRoot(container);
    root.render(<IframeApp />);
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIframeApp);
} else {
  initIframeApp();
}

export default IframeApp;