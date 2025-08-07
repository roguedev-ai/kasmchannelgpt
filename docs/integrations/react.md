# React Integration Guide

This guide covers how to integrate the CustomGPT widget into React applications.

## Table of Contents
- [Installation](#installation)
- [Basic Integration](#basic-integration)
- [Advanced Integration](#advanced-integration)
- [Custom Hooks](#custom-hooks)
- [TypeScript Support](#typescript-support)
- [Server-Side Rendering (SSR)](#server-side-rendering-ssr)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Installation

### Option 1: NPM Package (Coming Soon)
```bash
npm install @customgpt/react-widget
# or
yarn add @customgpt/react-widget
```

### Option 2: Script Tag
Add to your `public/index.html`:
```html
<script src="https://your-domain.com/widget/customgpt-widget.js"></script>
```

### Option 3: Dynamic Import
Load the widget dynamically in your component (recommended for better performance).

## Basic Integration

### Simple Embedded Widget

```jsx
import React, { useEffect, useRef } from 'react';

function ChatWidget() {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    // Initialize widget
    if (window.CustomGPTWidget && containerRef.current) {
      widgetRef.current = window.CustomGPTWidget.init({
        agentId: 123,
        mode: 'embedded',
        containerId: 'chat-container',
        theme: 'light'
      });
    }

    // Cleanup on unmount
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, []);

  return (
    <div 
      id="chat-container" 
      ref={containerRef}
      style={{ height: '600px', width: '100%' }}
    />
  );
}

export default ChatWidget;
```

### Floating Button Widget

```jsx
import React, { useEffect, useState } from 'react';

function FloatingChat() {
  const [widget, setWidget] = useState(null);

  useEffect(() => {
    const initWidget = () => {
      if (window.CustomGPTWidget) {
        const instance = window.CustomGPTWidget.init({
          agentId: 123,
          mode: 'floating',
          position: 'bottom-right',
          theme: 'light'
        });
        setWidget(instance);
      }
    };

    // Try to initialize immediately
    initWidget();

    // Also listen for script load if not ready
    window.addEventListener('load', initWidget);
    
    return () => {
      if (widget) {
        widget.destroy();
      }
      window.removeEventListener('load', initWidget);
    };
  }, []);

  return null; // Floating widget doesn't need a container
}

export default FloatingChat;
```

## Advanced Integration

### Dynamic Script Loading

```jsx
import React, { useEffect, useState } from 'react';

function DynamicChatWidget({ agentId }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [widget, setWidget] = useState(null);

  useEffect(() => {
    // Function to load script
    const loadScript = () => {
      const script = document.createElement('script');
      script.src = 'https://your-domain.com/widget/customgpt-widget.js';
      script.async = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => console.error('Failed to load widget script');
      document.body.appendChild(script);
    };

    // Check if already loaded
    if (window.CustomGPTWidget) {
      setIsLoaded(true);
    } else {
      loadScript();
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !widget) {
      const instance = window.CustomGPTWidget.init({
        agentId,
        mode: 'embedded',
        containerId: 'dynamic-chat',
        enableConversationManagement: true
      });
      setWidget(instance);
    }

    return () => {
      if (widget) {
        widget.destroy();
      }
    };
  }, [isLoaded, agentId]);

  if (!isLoaded) {
    return <div>Loading chat...</div>;
  }

  return <div id="dynamic-chat" style={{ height: '600px' }} />;
}
```

### With State Management

```jsx
import React, { useEffect, useContext } from 'react';
import { ChatContext } from './ChatContext';

function ManagedChatWidget() {
  const { 
    agentId, 
    theme, 
    isOpen, 
    setIsOpen,
    onMessage 
  } = useContext(ChatContext);

  useEffect(() => {
    if (!window.CustomGPTWidget) return;

    const widget = window.CustomGPTWidget.init({
      agentId,
      mode: 'floating',
      theme,
      onOpen: () => setIsOpen(true),
      onClose: () => setIsOpen(false),
      onMessage: (message) => {
        console.log('New message:', message);
        onMessage?.(message);
      }
    });

    // Control widget state
    if (isOpen) {
      widget.open();
    } else {
      widget.close();
    }

    return () => widget.destroy();
  }, [agentId, theme, isOpen]);

  return null;
}
```

## Custom Hooks

### useCustomGPTWidget Hook

```jsx
import { useEffect, useRef, useState } from 'react';

function useCustomGPTWidget(config) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    // Load script if needed
    const loadWidget = async () => {
      try {
        if (!window.CustomGPTWidget) {
          await loadScript('https://your-domain.com/widget/customgpt-widget.js');
        }
        
        // Initialize widget
        widgetRef.current = window.CustomGPTWidget.init(config);
        setIsReady(true);
      } catch (err) {
        setError(err);
        console.error('Failed to initialize widget:', err);
      }
    };

    loadWidget();

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, []);

  return {
    widget: widgetRef.current,
    isReady,
    error,
    open: () => widgetRef.current?.open(),
    close: () => widgetRef.current?.close(),
    toggle: () => widgetRef.current?.toggle()
  };
}

// Helper function to load script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Usage
function App() {
  const { widget, isReady, open, close } = useCustomGPTWidget({
    agentId: 123,
    mode: 'floating'
  });

  return (
    <div>
      <button onClick={open} disabled={!isReady}>
        Open Chat
      </button>
    </div>
  );
}
```

### useConversations Hook

```jsx
function useConversations(widget) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    if (!widget) return;

    // Load initial conversations
    const loadConversations = () => {
      const convs = widget.getConversations();
      setConversations(convs);
      setActiveConversation(widget.getCurrentConversation());
    };

    loadConversations();

    // Listen for changes
    const handleChange = (conversation) => {
      setActiveConversation(conversation);
      loadConversations();
    };

    // Assuming widget emits events
    widget.on?.('conversationChange', handleChange);

    return () => {
      widget.off?.('conversationChange', handleChange);
    };
  }, [widget]);

  const switchConversation = (conversationId) => {
    widget?.switchConversation(conversationId);
  };

  const createConversation = (title) => {
    return widget?.createConversation(title);
  };

  return {
    conversations,
    activeConversation,
    switchConversation,
    createConversation
  };
}
```

## TypeScript Support

### Type Definitions

Create a `types/customgpt.d.ts` file:

```typescript
declare global {
  interface Window {
    CustomGPTWidget: CustomGPTWidgetStatic;
    CustomGPTEmbed: CustomGPTEmbedStatic;
  }
}

interface CustomGPTWidgetStatic {
  init(config: WidgetConfig): WidgetInstance;
}

interface WidgetConfig {
  agentId: number | string;
  mode?: 'embedded' | 'floating' | 'fullscreen';
  theme?: 'light' | 'dark';
  containerId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width?: string;
  height?: string;
  enableConversationManagement?: boolean;
  maxConversations?: number;
  sessionId?: string;
  enableCitations?: boolean;
  enableFeedback?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: Message) => void;
  onConversationChange?: (conversation: Conversation) => void;
}

interface WidgetInstance {
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
  getConversations(): Conversation[];
  getCurrentConversation(): Conversation | null;
  createConversation(title?: string): Conversation;
  switchConversation(conversationId: string): void;
  deleteConversation(conversationId: string): void;
  updateConversationTitle(conversationId: string, title: string): void;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
}

interface Citation {
  id: string;
  title: string;
  url: string;
  snippet: string;
}

export {};
```

### TypeScript Component Example

```tsx
import React, { useEffect, useRef } from 'react';

interface ChatWidgetProps {
  agentId: number;
  theme?: 'light' | 'dark';
  onMessage?: (message: Message) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  agentId, 
  theme = 'light',
  onMessage 
}) => {
  const widgetRef = useRef<WidgetInstance | null>(null);

  useEffect(() => {
    if (window.CustomGPTWidget) {
      widgetRef.current = window.CustomGPTWidget.init({
        agentId,
        mode: 'embedded',
        containerId: 'ts-chat-widget',
        theme,
        onMessage
      });
    }

    return () => {
      widgetRef.current?.destroy();
    };
  }, [agentId, theme, onMessage]);

  return <div id="ts-chat-widget" style={{ height: '600px' }} />;
};

export default ChatWidget;
```

## Server-Side Rendering (SSR)

### Next.js App Router

See the [Next.js Integration Guide](./nextjs.md) for detailed instructions.

### Generic SSR Solution

```jsx
import React, { useEffect, useState } from 'react';

function SSRSafeChatWidget({ agentId }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return placeholder during SSR
    return <div style={{ height: '600px' }}>Chat will load here</div>;
  }

  // Only render on client side
  return <ClientChatWidget agentId={agentId} />;
}

function ClientChatWidget({ agentId }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget/customgpt-widget.js';
    script.async = true;
    script.onload = () => {
      if (window.CustomGPTWidget) {
        window.CustomGPTWidget.init({
          agentId,
          mode: 'embedded',
          containerId: 'ssr-chat'
        });
      }
    };
    document.body.appendChild(script);
  }, [agentId]);

  return <div id="ssr-chat" style={{ height: '600px' }} />;
}
```

## Best Practices

### 1. Lazy Loading

```jsx
import React, { lazy, Suspense } from 'react';

const ChatWidget = lazy(() => import('./ChatWidget'));

function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChat(true)}>
        Load Chat
      </button>
      
      {showChat && (
        <Suspense fallback={<div>Loading chat...</div>}>
          <ChatWidget agentId={123} />
        </Suspense>
      )}
    </div>
  );
}
```

### 2. Error Boundaries

```jsx
class ChatErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chat widget error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Sorry, the chat is temporarily unavailable.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ChatErrorBoundary>
  <ChatWidget agentId={123} />
</ChatErrorBoundary>
```

### 3. Performance Optimization

```jsx
import React, { memo, useCallback } from 'react';

const ChatWidget = memo(({ agentId, theme }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Only re-render if agentId or theme changes
  return prevProps.agentId === nextProps.agentId && 
         prevProps.theme === nextProps.theme;
});

// Parent component
function App() {
  const [theme, setTheme] = useState('light');
  
  // Memoize callback to prevent re-renders
  const handleMessage = useCallback((message) => {
    console.log('Message:', message);
  }, []);

  return (
    <ChatWidget 
      agentId={123} 
      theme={theme}
      onMessage={handleMessage}
    />
  );
}
```

### 4. Context Integration

```jsx
// ChatProvider.jsx
import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [agentId, setAgentId] = useState(123);
  const [theme, setTheme] = useState('light');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ChatContext.Provider value={{
      agentId,
      setAgentId,
      theme,
      setTheme,
      isOpen,
      setIsOpen
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

// Usage in component
function ChatButton() {
  const { isOpen, setIsOpen } = useChat();
  
  return (
    <button onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? 'Close' : 'Open'} Chat
    </button>
  );
}
```

## Troubleshooting

### Common Issues

#### 1. Widget not initializing

```jsx
// Check if script is loaded
useEffect(() => {
  const checkWidget = setInterval(() => {
    if (window.CustomGPTWidget) {
      console.log('Widget loaded!');
      clearInterval(checkWidget);
      // Initialize widget
    }
  }, 100);

  return () => clearInterval(checkWidget);
}, []);
```

#### 2. Multiple instances conflict

```jsx
// Use unique container IDs
const containerId = useRef(`chat-${Math.random().toString(36).substr(2, 9)}`);

useEffect(() => {
  if (window.CustomGPTWidget) {
    window.CustomGPTWidget.init({
      agentId: 123,
      containerId: containerId.current,
      mode: 'embedded'
    });
  }
}, []);

return <div id={containerId.current} />;
```

#### 3. Memory leaks

```jsx
useEffect(() => {
  let widget;
  
  const initWidget = async () => {
    widget = window.CustomGPTWidget?.init({
      agentId: 123,
      mode: 'floating'
    });
  };

  initWidget();

  // Always cleanup
  return () => {
    if (widget) {
      widget.destroy();
      widget = null;
    }
  };
}, []);
```

### Debug Mode

```jsx
// Enable debug logging
useEffect(() => {
  window.CUSTOMGPT_DEBUG = true;
  
  // Your widget initialization
}, []);
```

## Examples

Find complete working examples in the `/examples` directory:

- `react-widget.jsx` - Basic React integration
- `react-floating-button.jsx` - Floating button example
- `SimplifiedWidget.jsx` - Production-ready wrapper component

## Support

- GitHub Issues: [Project Issues](https://github.com/customgpt/customgpt-ui/issues)
- Documentation: [CustomGPT Docs](https://docs.customgpt.ai)
- Examples: [React Examples](/examples)