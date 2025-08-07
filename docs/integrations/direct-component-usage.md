# Direct Component Usage Guide

This guide explains how to use the CustomGPT widgets as direct React components in your project - exactly as you've been doing before!

## Quick Setup (Your Current Pattern)

### Step 1: Copy Files to Your Project

```bash
# Copy the built widget files to your project
cp -r dist/widget/ your-project/public/dist/widget/
```

### Step 2: Copy Component Files

```bash
# Copy the updated component files to your components directory
cp examples/SimplifiedWidget.jsx your-project/src/components/SimplifiedCustomGPTWidget.jsx
cp examples/SimplifiedFloatingButton.jsx your-project/src/components/SimplifiedFloatingButton.jsx
```

### Step 3: Load Scripts in Your HTML

Add these to your `public/index.html` (before your React app loads):

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Your existing head content -->
  <link rel="stylesheet" href="/dist/widget/customgpt-widget.css">
</head>
<body>
  <div id="root"></div>
  
  <!-- Load CustomGPT Widget Scripts BEFORE React -->
  <script src="/dist/widget/vendors.js"></script>
  <script src="/dist/widget/customgpt-widget.js"></script>
  
  <!-- Your React app script -->
  <script src="/static/js/bundle.js"></script>
</body>
</html>
```

### Step 4: Use Components (Your Exact Pattern!)

```jsx
import SimplifiedCustomGPTWidget from './components/SimplifiedCustomGPTWidget';

function MyApp() {
  const { customFields } = useYourCustomFields(); // Your existing setup

  return (
    <div>
      <h1>My App</h1>
      
      {/* This is EXACTLY your current pattern - it still works! */}
      <SimplifiedCustomGPTWidget
        apiKey={customFields?.CUSTOMGPT_API_KEY as string}
        agentId={customFields?.CUSTOMGPT_AGENT_ID as string}
        agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
        maxConversations={5}
        enableConversationManagement={true}
        onMessage={(message) => console.log('New message:', message)}
        onConversationChange={(conv) => console.log('Switched to:', conv)}
      />
    </div>
  );
}
```

## Component Props Reference

### SimplifiedCustomGPTWidget

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiKey` | string | Yes* | Your CustomGPT API key |
| `agentId` | string/number | Yes | Your agent/project ID |
| `agentName` | string | No | Display name for the agent |
| `apiBaseUrl` | string | No | Use instead of `apiKey` for proxy setup |
| `width` | string | No | Widget width (default: '100%') |
| `height` | string | No | Widget height (default: '600px') |
| `theme` | 'light'/'dark' | No | UI theme (default: 'light') |
| `maxConversations` | number | No | Max conversation history |
| `enableConversationManagement` | boolean | No | Enable conversation switching |
| `onMessage` | function | No | Callback when messages are sent/received |
| `onConversationChange` | function | No | Callback when conversation switches |

*Required unless using `apiBaseUrl` for proxy setup

### SimplifiedFloatingButton

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiKey` | string | Yes* | Your CustomGPT API key |
| `agentId` | string/number | Yes | Your agent/project ID |
| `agentName` | string | No | Display name for the agent |
| `apiBaseUrl` | string | No | Use instead of `apiKey` for proxy setup |
| `position` | string | No | Button position: 'bottom-right', 'bottom-left', etc. |
| `primaryColor` | string | No | Button color (default: '#007acc') |
| `buttonSize` | 'sm'/'md'/'lg' | No | Button size (default: 'md') |
| `chatWidth` | string | No | Chat popup width (default: '400px') |
| `chatHeight` | string | No | Chat popup height (default: '600px') |
| `showLabel` | boolean | No | Show hover label (default: true) |
| `label` | string | No | Hover label text (default: 'Chat with us') |
| `theme` | 'light'/'dark' | No | UI theme (default: 'light') |

## Alternative Setup Methods

### Method 1: Auto-Load Scripts (No HTML Changes)

If you can't modify your HTML, use the `autoLoad` prop:

```jsx
<SimplifiedCustomGPTWidget
  apiKey={customFields?.CUSTOMGPT_API_KEY as string}
  agentId={customFields?.CUSTOMGPT_AGENT_ID as string}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
  maxConversations={5}
  enableConversationManagement={true}
  // Enable auto-loading
  autoLoad={true}
  vendorsPath="/dist/widget/vendors.js"
  widgetPath="/dist/widget/customgpt-widget.js"
  cssPath="/dist/widget/customgpt-widget.css"
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>
```

### Method 2: Backend Proxy (Most Secure)

Set up a backend proxy and use `apiBaseUrl` instead of `apiKey`:

```jsx
<SimplifiedCustomGPTWidget
  agentId={customFields?.CUSTOMGPT_AGENT_ID as string}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
  apiBaseUrl="/api/customgpt-proxy" // Your backend proxy
  maxConversations={5}
  enableConversationManagement={true}
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>
```

### Method 3: CDN/Remote Files

If you host the widget files elsewhere:

```jsx
<SimplifiedCustomGPTWidget
  apiKey={customFields?.CUSTOMGPT_API_KEY as string}
  agentId={customFields?.CUSTOMGPT_AGENT_ID as string}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
  maxConversations={5}
  enableConversationManagement={true}
  autoLoad={true}
  vendorsPath="https://your-cdn.com/customgpt/vendors.js"
  widgetPath="https://your-cdn.com/customgpt/customgpt-widget.js"
  cssPath="https://your-cdn.com/customgpt/customgpt-widget.css"
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>
```

## File Structure

After setup, your project should look like:

```
your-project/
├── public/
│   ├── dist/
│   │   └── widget/
│   │       ├── vendors.js (1.57MB)
│   │       ├── customgpt-widget.js (179KB)
│   │       ├── customgpt-widget.css (76KB)
│   │       └── index.html (demo page)
│   └── index.html (updated with scripts)
├── src/
│   └── components/
│       ├── SimplifiedCustomGPTWidget.jsx
│       └── SimplifiedFloatingButton.jsx (optional)
└── ...
```

## TypeScript Support

If using TypeScript, create a type definition file:

```typescript
// src/types/customgpt-widget.d.ts
export interface CustomGPTWidgetConfig {
  agentId: string | number;
  agentName?: string;
  apiKey?: string;
  apiBaseUrl?: string;
  containerId?: string;
  mode?: 'embedded' | 'floating';
  width?: string;
  height?: string;
  theme?: 'light' | 'dark';
  maxConversations?: number;
  enableConversationManagement?: boolean;
  onMessage?: (message: any) => void;
  onConversationChange?: (conversation: any) => void;
}

declare global {
  interface Window {
    CustomGPTWidget: {
      init(config: CustomGPTWidgetConfig): any;
    };
  }
}
```

## Troubleshooting

### Widget Not Loading
1. **Check browser console** for JavaScript errors
2. **Verify file paths** in your `public/` directory
3. **Ensure scripts load in order**: vendors.js first, then customgpt-widget.js
4. **Check API key** format (should start with `cgpt_`)

### Component Not Rendering
1. **Verify props** - `agentId` and `apiKey` are required
2. **Check container size** - ensure parent has defined width/height
3. **Look for errors** in browser dev tools console

### Styling Issues
1. **CSS conflicts** - widget CSS is scoped to avoid conflicts
2. **Z-index issues** - floating button uses z-index: 50
3. **Responsive issues** - widget adapts to container size

### API Issues
1. **Invalid API key** - check in CustomGPT dashboard
2. **CORS errors** - ensure your domain is whitelisted
3. **Rate limiting** - check API usage limits

## Migration from Previous Versions

If you were using an older version:

1. **Update component files** with the new versions
2. **Add new props** like `apiKey`, `theme`, etc.
3. **Rebuild widget files** with `npm run build:widget`
4. **Test thoroughly** - the API interface may have changed

## Performance Tips

1. **Load scripts once** - use the HTML method for best performance
2. **Use proxy setup** - keeps API keys secure and reduces bundle size
3. **Enable conversation management** - reduces API calls for conversation history
4. **Set maxConversations** - limits memory usage for long-running apps

## Security Best Practices

1. **Use backend proxy** instead of client-side API keys when possible
2. **Set environment variables** properly (use REACT_APP_ prefix)
3. **Don't commit API keys** to version control
4. **Use HTTPS** in production
5. **Whitelist domains** in your CustomGPT dashboard

---

## Your Exact Pattern Still Works!

The key point is that **your existing pattern still works exactly as before**:

```jsx
<SimplifiedCustomGPTWidget
  apiKey={customFields?.CUSTOMGPT_API_KEY as string}
  agentId={customFields?.CUSTOMGPT_AGENT_ID as string}
  agentName={customFields?.CUSTOMGPT_AGENT_NAME as string}
  maxConversations={5}
  enableConversationManagement={true}
  onMessage={(message) => console.log('New message:', message)}
  onConversationChange={(conv) => console.log('Switched to:', conv)}
/>
```

Just make sure to:
1. Copy the updated `dist/widget/` files to your project
2. Use the updated component files
3. Load the scripts in your HTML

That's it! Your existing integration will continue working with enhanced features.