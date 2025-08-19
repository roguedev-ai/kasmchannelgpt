# CustomGPT Widget Examples

This directory contains examples showing how to integrate the CustomGPT widget in various scenarios.

## 🚨 Security Note

The widget supports two modes:
- **Proxy Mode** (Default): API keys are handled server-side for maximum security
- **Direct Mode**: API key is provided client-side for standalone deployments (use with caution)

## Example Files

### 🚀 Quick Start
- `quick-start.html` - Minimal setup to get started (proxy mode)
- `simplified-demo.html` - Basic demo with common features

### 🔒 Secure Integration (Recommended)
- `iframe-embed-example.html` - Complete iframe integration with security isolation
- `widget-example.html` - Direct widget embedding (proxy mode)
- `widget-with-logo.html` - Widget with custom branding

### 🔑 Direct API Integration
- `widget-direct-api.html` - Direct API mode (no proxy needed)
- `vanilla-js-widget.html` - Complete JavaScript example with all features

### ⚛️ React Integration
- `react-integration.jsx` - Full React component integration
- `react-widget.jsx` - React widget component patterns
- `react-floating-button.jsx` - Floating button implementation
- `react-standalone-example.jsx` - Standalone React app example

### 📦 Helper Components
- `SimplifiedWidget.jsx` - Simplified React wrapper component
- `SimplifiedFloatingButton.jsx` - Simplified floating button component


## Integration Methods

### Method 1: Iframe Embed (Recommended)

```html
<!-- Include the embed script -->
<script src="/dist/iframe-embed.js"></script>

<script>
  // Initialize embedded widget
  const widget = CustomGPTEmbed.init({
    agentId: 123,
    mode: 'embedded',
    containerId: 'chat-container',
    iframeSrc: 'https://your-domain.com/widget/',
    theme: 'light'
  });
</script>
```

**Pros:**
- Complete style isolation
- Cross-domain compatible
- Most secure option
- No CSS conflicts

### Method 2: Direct Widget (Proxy Mode)

```html
<!-- Include widget files -->
<script src="/dist/widget/customgpt-widget.js"></script>

<div id="chat-widget"></div>
<script>
  const widget = CustomGPTWidget.init({
    agentId: 123,
    mode: 'embedded',
    containerId: 'chat-widget',
    apiUrl: 'https://your-nextjs-app.com'  // Your proxy server
  });
</script>
```

**Pros:**
- Secure (API key on server)
- Direct API access
- More customization options

### Method 3: Direct Widget (Direct API Mode)

```html
<!-- Include widget files -->
<script src="/dist/widget/customgpt-widget.js"></script>

<div id="chat-widget"></div>
<script>
  const widget = CustomGPTWidget.init({
    agentId: 123,
    apiKey: 'your-api-key',  // Direct API access
    mode: 'embedded',
    containerId: 'chat-widget'
  });
</script>
```

**Pros:**
- No server required
- Works on static sites
- Simpler deployment

**Cons:**
- API key exposed in browser
- Only use for internal/trusted environments

## Key Features Demonstrated

### Conversation Management
```javascript
// Built-in conversation management
const widget = CustomGPTWidget.init({
  agentId: 123,
  mode: 'floating',
  enableConversationManagement: true,
  maxConversations: 10
});

// Get all conversations
const conversations = widget.getConversations();

// Switch conversation
widget.switchConversation('conv_123');

// Create new conversation
widget.createConversation('Order Support');
```

### Session Handling
```javascript
// Custom session ID
const widget = CustomGPTWidget.init({
  agentId: 123,
  sessionId: 'user_12345',
  isolateConversations: true  // Isolate per page
});
```

### Event Handling
```javascript
const widget = CustomGPTWidget.init({
  agentId: 123,
  onOpen: () => console.log('Widget opened'),
  onClose: () => console.log('Widget closed'),
  onMessage: (msg) => console.log('New message:', msg),
  onConversationChange: (conv) => console.log('Switched to:', conv)
});
```

## React Integration Best Practices

### Using Hooks
```jsx
import { useEffect, useRef } from 'react';

function useCustomGPTWidget(config) {
  const widgetRef = useRef(null);

  useEffect(() => {
    const widget = window.CustomGPTWidget?.init(config);
    widgetRef.current = widget;

    return () => {
      if (widget) {
        widget.destroy();
      }
    };
  }, []);

  return widgetRef.current;
}

// Usage
function Chat() {
  const widget = useCustomGPTWidget({
    agentId: 123,
    containerId: 'my-chat',
    mode: 'embedded'
  });

  return <div id="my-chat" style={{ height: '600px' }} />;
}
```

### Loading Scripts Dynamically
```jsx
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// In your component
useEffect(() => {
  async function loadWidget() {
    try {
      await loadScript('/dist/widget/customgpt-widget.js');
      // Widget is now available
    } catch (error) {
      console.error('Failed to load widget:', error);
    }
  }
  
  loadWidget();
}, []);
```

## Configuration Examples

### Minimal Configuration
```javascript
CustomGPTWidget.init({
  agentId: 123
});
```

### Full Featured
```javascript
CustomGPTWidget.init({
  agentId: 123,
  mode: 'floating',
  theme: 'dark',
  position: 'bottom-left',
  width: '450px',
  height: '700px',
  enableConversationManagement: true,
  maxConversations: 20,
  enableCitations: true,
  enableFeedback: true,
  sessionId: 'custom_session_123',
  isolateConversations: false,
  onOpen: () => analytics.track('Chat Opened'),
  onMessage: (msg) => analytics.track('Message Sent', msg),
  onConversationChange: (conv) => console.log('Conversation:', conv)
});
```

## Security Considerations

1. **No API Keys in Client Code**: The new architecture handles authentication server-side
2. **Use HTTPS**: Always serve widget files over HTTPS
3. **Configure CORS**: Set allowed origins in your server configuration
4. **Validate Agent IDs**: Ensure agent IDs are validated server-side
5. **Use Iframe for Isolation**: When embedding on third-party sites

## Troubleshooting Common Issues

### Widget Not Loading
```javascript
// Check if widget is available
if (typeof CustomGPTWidget === 'undefined') {
  console.error('Widget script not loaded');
  return;
}

// Enable debug mode
window.CUSTOMGPT_DEBUG = true;
```

### Conversation Persistence
```javascript
// Check localStorage
console.log(localStorage.getItem('customgpt_conversations'));

// Clear if needed
localStorage.removeItem('customgpt_conversations');
```

### Style Conflicts
```css
/* Use iframe mode or add CSS specificity */
#customgpt-widget * {
  all: initial;
  font-family: inherit;
}
```


## Next Steps

1. Start with `quick-start.html` for the fastest setup
2. Choose your integration method:
   - **Most Secure**: Use `iframe-embed-example.html`
   - **Most Flexible**: Use `widget-example.html` (proxy mode)
   - **No Server**: Use `widget-direct-api.html` (API key required)
   - **React App**: Use `react-integration.jsx` or simplified components
3. Replace the agent ID with your own
4. Configure your server (if using proxy mode)
5. Deploy and test

## File Organization

- **Main examples**: Essential integration patterns
- **Archive folder**: Legacy and duplicate examples (kept for reference)

For more details, see the main [README.md](../README.md).