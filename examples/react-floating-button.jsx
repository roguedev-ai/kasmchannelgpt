/**
 * React Floating Button Integration Example
 * 
 * Shows how to integrate CustomGPT floating button in React applications
 * with conversation management features.
 * 
 * IMPORTANT: Before using this example, ensure you have loaded the widget files:
 * 
 * In your HTML:
 * <script src="/dist/widget/vendors.js"></script>
 * <script src="/dist/widget/customgpt-widget.js"></script>
 * <link rel="stylesheet" href="/dist/widget/customgpt-widget.css">
 * 
 * Or use SimplifiedFloatingButton with autoLoad={true}
 */

import React, { useEffect, useRef } from 'react';
import SimplifiedFloatingButton from './SimplifiedFloatingButton';

// Option 1: Using the simplified wrapper component (RECOMMENDED)
export const FloatingButtonWithWrapper = () => {
  return (
    <SimplifiedFloatingButton
      agentId="123"
      agentName="Support Assistant"
      position="bottom-right"
      primaryColor="#007acc"
      buttonSize="md"
      maxConversations={5}
      enableConversationManagement={true}
      showLabel={true}
      label="Chat with us"
      // Auto-load the widget files
      autoLoad={true}
      vendorsPath="/dist/widget/vendors.js"
      widgetPath="/dist/widget/customgpt-widget.js"
      cssPath="/dist/widget/customgpt-widget.css"
    />
  );
};

// Option 2: Direct widget API usage with floating mode (requires scripts loaded in HTML)
export const FloatingButtonDirect = () => {
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!window.CustomGPTWidget) {
      console.error('Widget script not loaded. Please include the widget scripts in your HTML.');
      return;
    }

    // Initialize floating widget
    const widget = window.CustomGPTWidget.init({
      agentId: '123',
      agentName: 'Support Assistant',
      mode: 'floating',
      position: 'bottom-right',
      width: '400px',
      height: '600px',
      enableConversationManagement: true,
      maxConversations: 5,
      onOpen: () => console.log('Chat opened'),
      onClose: () => console.log('Chat closed'),
      onMessage: (msg) => console.log('Message:', msg),
    });

    widgetRef.current = widget;

    // Cleanup
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, []);

  return null; // Floating button renders itself
};

// Option 3: Custom floating button with widget control
export const CustomFloatingButton = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!window.CustomGPTWidget) return;

    // Create widget but don't auto-show
    const widget = window.CustomGPTWidget.init({
      agentId: '123',
      mode: 'floating',
      position: 'bottom-right',
      enableConversationManagement: true,
      onOpen: () => setIsOpen(true),
      onClose: () => setIsOpen(false),
    });

    widgetRef.current = widget;

    return () => widget.destroy();
  }, []);

  const toggleChat = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle();
    }
  };

  // Custom button UI
  if (isOpen) return null;

  return (
    <button
      onClick={toggleChat}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#007acc',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9998,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </button>
  );
};

// Option 4: Multiple chat instances
export const MultipleChats = () => {
  const salesWidgetRef = useRef(null);
  const supportWidgetRef = useRef(null);

  useEffect(() => {
    if (!window.CustomGPTWidget) return;

    // Sales chat
    salesWidgetRef.current = window.CustomGPTWidget.init({
      agentId: 'sales-agent-id',
      agentName: 'Sales Assistant',
      containerId: 'sales-chat',
      mode: 'embedded',
      sessionId: 'sales-session', // Different session
    });

    // Support chat
    supportWidgetRef.current = window.CustomGPTWidget.init({
      agentId: 'support-agent-id',
      agentName: 'Support Assistant',
      containerId: 'support-chat',
      mode: 'embedded',
      sessionId: 'support-session', // Different session
    });

    return () => {
      salesWidgetRef.current?.destroy();
      supportWidgetRef.current?.destroy();
    };
  }, []);

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div id="sales-chat" style={{ flex: 1, height: '500px' }} />
      <div id="support-chat" style={{ flex: 1, height: '500px' }} />
    </div>
  );
};

/**
 * Required scripts in your HTML:
 * <script src="/dist/widget/vendors.js"></script>
 * <script src="/dist/widget/customgpt-widget.js"></script>
 * <link rel="stylesheet" href="/dist/widget/customgpt-widget.css">
 * 
 * Or use SimplifiedFloatingButton with autoLoad={true} for automatic loading
 */