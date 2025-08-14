# CustomGPT Widget - Direct API Mode Guide

This guide explains how to use the CustomGPT widget with direct API keys, allowing you to embed the chat widget on any website without needing a proxy server.

## ⚠️ Security Warning

**Using API keys directly in the browser exposes them to users.** This approach should only be used with:
- Restricted API keys with limited permissions
- Internal/trusted applications
- Development environments

For production use, consider using the [proxy mode](./widget-proxy-guide.md) with a backend server.

## Quick Start

### 1. Get Your Files

Copy these files from the `dist/widget/` directory to your website:
- `customgpt-widget.js`
- `customgpt-widget.css`
- `vendors.js`
- `logo.png`

### 2. Include the Files

Add these to your HTML:

```html
<!-- In the <head> section -->
<link rel="stylesheet" href="/path/to/customgpt-widget.css">

<!-- Before closing </body> -->
<script src="/path/to/vendors.js"></script>
<script src="/path/to/customgpt-widget.js"></script>
```

### 3. Initialize the Widget

```javascript
// Embedded widget
const widget = CustomGPTWidget.init({
  apiKey: 'cgpt_your_api_key_here',
  agentId: '123',
  agentName: 'Support Assistant',
  containerId: 'chat-widget',
  mode: 'embedded'
});

// Floating button
const floatingWidget = CustomGPTWidget.init({
  apiKey: 'cgpt_your_api_key_here',
  agentId: '123',
  agentName: 'Support Assistant',
  mode: 'floating',
  position: 'bottom-right'
});
```

## Configuration Options

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `apiKey` | string | Your CustomGPT API key (starts with `cgpt_`) |
| `agentId` | string/number | Your agent/project ID |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentName` | string | `"Agent {ID}"` | Display name for the agent |
| `mode` | string | `"embedded"` | Widget mode: `"embedded"` or `"floating"` |
| `containerId` | string | - | Required for embedded mode |
| `position` | string | `"bottom-right"` | Position for floating mode |
| `theme` | string | `"light"` | Color theme: `"light"` or `"dark"` |
| `width` | string | `"400px"` | Widget width |
| `height` | string | `"600px"` | Widget height |
| `enableConversationManagement` | boolean | `false` | Enable conversation switching |
| `maxConversations` | number | `5` | Maximum conversations per session |
| `enableCitations` | boolean | `true` | Show citation sources |
| `enableFeedback` | boolean | `true` | Show feedback buttons |

### Event Callbacks

| Callback | Description |
|----------|-------------|
| `onOpen` | Called when widget opens (floating mode) |
| `onClose` | Called when widget closes (floating mode) |
| `onMessage` | Called when a message is sent/received |
| `onConversationChange` | Called when conversation switches |

## Examples

### Basic Embedded Widget

```html
<div id="chat-widget" style="height: 600px;"></div>

<script>
  const widget = CustomGPTWidget.init({
    apiKey: 'cgpt_your_api_key_here',
    agentId: '123',
    containerId: 'chat-widget'
  });
</script>
```

### Floating Button with Callbacks

```javascript
const widget = CustomGPTWidget.init({
  apiKey: 'cgpt_your_api_key_here',
  agentId: '456',
  agentName: 'Sales Assistant',
  mode: 'floating',
  position: 'bottom-left',
  theme: 'dark',
  onOpen: () => {
    console.log('Chat opened');
    // Track analytics event
  },
  onMessage: (message) => {
    console.log('Message:', message);
    // Log conversation data
  }
});
```

### With React Component

```jsx
import React, { useEffect, useRef } from 'react';

const ChatWidget = ({ apiKey, agentId }) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.CustomGPTWidget) {
      widgetRef.current = window.CustomGPTWidget.init({
        apiKey,
        agentId,
        containerId: containerRef.current.id,
        mode: 'embedded'
      });
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [apiKey, agentId]);

  return <div ref={containerRef} id="chat-widget" style={{ height: '600px' }} />;
};
```

### Multiple Agents

```javascript
// Sales agent - bottom left
const salesWidget = CustomGPTWidget.init({
  apiKey: 'cgpt_your_api_key_here',
  agentId: 'sales-agent',
  agentName: 'Sales Assistant',
  mode: 'floating',
  position: 'bottom-left'
});

// Support agent - bottom right
const supportWidget = CustomGPTWidget.init({
  apiKey: 'cgpt_your_api_key_here',
  agentId: 'support-agent',
  agentName: 'Support Assistant',
  mode: 'floating',
  position: 'bottom-right'
});
```

## Security Best Practices

### 1. Use Restricted API Keys

Create API keys specifically for frontend use with:
- **Domain restrictions**: Only allow specific domains
- **Agent restrictions**: Limit to specific agents
- **Rate limiting**: Prevent abuse
- **Read-only permissions**: Where possible

### 2. Environment-Specific Keys

Use different API keys for different environments:
```javascript
const apiKey = process.env.NODE_ENV === 'production' 
  ? 'cgpt_prod_restricted_key'
  : 'cgpt_dev_key';
```

### 3. Monitor Usage

Regularly check your API key usage for:
- Unusual spikes in requests
- Requests from unauthorized domains
- Suspicious patterns

### 4. Rotate Keys Regularly

- Set up a key rotation schedule
- Update keys across all deployments
- Revoke old keys promptly

## Common Issues

### Widget Not Loading

1. **Check console errors**: Open browser console for error messages
2. **Verify file paths**: Ensure all JS/CSS files are loading correctly
3. **Check API key**: Ensure your API key is valid and has proper permissions
4. **CORS issues**: API key might be restricted to specific domains

### API Errors

1. **401 Unauthorized**: Invalid API key or key doesn't have access to the agent
2. **429 Rate Limited**: Too many requests - implement rate limiting
3. **403 Forbidden**: Domain not allowed for this API key

### Styling Issues

1. **CSS conflicts**: Widget styles conflicting with your site
2. **Solution**: Wrap widget in isolated container or use iframe

## Migration from Proxy Mode

If you're currently using proxy mode and want to switch to direct API mode:

1. **Remove proxy configuration**:
   ```javascript
   // Old (proxy mode)
   CustomGPTWidget.init({
     apiUrl: 'https://your-server.com',
     agentId: '123'
   });
   
   // New (direct mode)
   CustomGPTWidget.init({
     apiKey: 'cgpt_your_api_key_here',
     agentId: '123'
   });
   ```

2. **Update your build process** to include widget files
3. **Add security measures** as outlined above

## Support

For additional help:
- Check the [examples](../examples/) directory
- View the [FAQ](./faq.md)
- Report issues on [GitHub](https://github.com/customgpt/widget/issues)