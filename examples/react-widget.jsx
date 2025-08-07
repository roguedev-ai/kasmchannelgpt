/**
 * React Widget Integration Example
 * 
 * Shows how to integrate CustomGPT widget in React applications
 * using the simplified API with built-in conversation management.
 * 
 * IMPORTANT: Before using this example, ensure you have loaded the widget files:
 * 
 * In your HTML:
 * <script src="/dist/widget/vendors.js"></script>
 * <script src="/dist/widget/customgpt-widget.js"></script>
 * <link rel="stylesheet" href="/dist/widget/customgpt-widget.css">
 * 
 * Or use the SimplifiedWidget with autoLoad={true}
 */

import React, { useEffect, useRef } from 'react';
import SimplifiedCustomGPTWidget from './SimplifiedWidget';

// Option 1: Using the simplified wrapper component (RECOMMENDED)
export const WidgetWithWrapper = () => {
  return (
    <SimplifiedCustomGPTWidget
      agentId="123"
      agentName="Support Assistant"
      width="100%"
      height="600px"
      maxConversations={10}
      enableConversationManagement={true}
      // Auto-load the widget files
      autoLoad={true}
      vendorsPath="/dist/widget/vendors.js"
      widgetPath="/dist/widget/customgpt-widget.js"
      cssPath="/dist/widget/customgpt-widget.css"
      onMessage={(message) => console.log('New message:', message)}
      onConversationChange={(conv) => console.log('Conversation changed:', conv)}
    />
  );
};

// Option 2: Direct widget API usage (requires scripts loaded in HTML)
export const WidgetDirectAPI = () => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!window.CustomGPTWidget) {
      console.error('Widget script not loaded. Please include the widget scripts in your HTML.');
      return;
    }

    // Initialize widget
    const widget = window.CustomGPTWidget.init({
      agentId: '123',
      agentName: 'Support Assistant',
      containerId: 'chat-container',
      mode: 'embedded',
      width: '100%',
      height: '600px',
      enableConversationManagement: true,
      maxConversations: 10,
      onMessage: (msg) => console.log('Message:', msg),
      onConversationChange: (conv) => console.log('Conversation:', conv),
    });

    widgetRef.current = widget;

    // Cleanup
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, []);

  return <div id="chat-container" ref={containerRef} />;
};

// Option 3: With custom controls
export const WidgetWithControls = () => {
  const widgetRef = useRef(null);
  const [conversations, setConversations] = React.useState([]);

  useEffect(() => {
    if (!window.CustomGPTWidget) return;

    const widget = window.CustomGPTWidget.init({
      agentId: '123',
      containerId: 'chat-container',
      mode: 'embedded',
      enableConversationManagement: true,
    });

    widgetRef.current = widget;

    // Load conversations
    setConversations(widget.getConversations());

    return () => widget.destroy();
  }, []);

  const createNewConversation = () => {
    if (widgetRef.current) {
      const newConv = widgetRef.current.createConversation('New Chat');
      setConversations(widgetRef.current.getConversations());
    }
  };

  const switchConversation = (convId) => {
    if (widgetRef.current) {
      widgetRef.current.switchConversation(convId);
    }
  };

  return (
    <div>
      <div className="controls">
        <button onClick={createNewConversation}>New Conversation</button>
        <select onChange={(e) => switchConversation(e.target.value)}>
          {conversations.map(conv => (
            <option key={conv.id} value={conv.id}>{conv.title}</option>
          ))}
        </select>
      </div>
      <div id="chat-container" style={{ height: '600px' }} />
    </div>
  );
};

/**
 * Required scripts in your HTML:
 * <script src="/dist/widget/vendors.js"></script>
 * <script src="/dist/widget/customgpt-widget.js"></script>
 * <link rel="stylesheet" href="/dist/widget/customgpt-widget.css">
 * 
 * Or use SimplifiedCustomGPTWidget with autoLoad={true} for automatic loading
 */