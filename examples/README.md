# CustomGPT.ai Widget Examples

Complete examples and setup guides for integrating CustomGPT.ai widgets into any web application.

## 🚀 Quick Start 

### Development/Demo (2 Minutes)

**For testing and internal tools only:**

```html
<!-- Add this to your HTML -->
<div id="my-chat" style="width: 400px; height: 600px;"></div>
<script src="https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/customgpt-widget.js"></script>
<script>
  CustomGPTWidget.init({
    agentId: 'YOUR_AGENT_ID',        // Get from CustomGPT.ai dashboard
    apiKey: 'YOUR_API_KEY',          // ⚠️ ONLY for development/demos!
    containerId: 'my-chat'
  });
</script>
```

### Production (Secure)

**For public websites - requires server setup:**

```html
<!-- Frontend code -->
<div id="my-chat" style="width: 400px; height: 600px;"></div>
<script src="https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/customgpt-widget.js"></script>
<script>
  CustomGPTWidget.init({
    agentId: 'YOUR_AGENT_ID',
    apiBaseUrl: '/api/proxy',        // Your secure proxy endpoint
    containerId: 'my-chat'
  });
</script>
```

**Want a floating button?** Just change the mode:

```javascript
CustomGPTWidget.init({
  agentId: 'YOUR_AGENT_ID',
  apiKey: 'YOUR_API_KEY',  // or apiBaseUrl for production
  mode: 'floating',
  position: 'bottom-right'
});
```

## 📁 Available Examples

### 🎯 Getting Started
- **`quick-start.html`** - Interactive demo with live configuration and code generation

### ⚛️ React Integration
- **`SimplifiedWidget.jsx`** - React component wrapper for embedded widgets
- **`SimplifiedFloatingButton.jsx`** - React component wrapper for floating chat buttons
- **`react-standalone-example.jsx`** - Complete React integration guide with all patterns

### 🌐 Vanilla JavaScript  
- **`vanilla-js-widget.html`** - Multiple widget examples for non-React applications
- **`widget-direct-api.html`** - Direct API integration for internal tools and static sites

### 🔒 Secure Integration
- **`iframe-embed-example.html`** - Maximum security with complete CSS/JS isolation
- **`universal-customgpt-proxy.js`** - Production-ready proxy server for secure API key handling
- **`nextjs-api-route.js`** - Next.js API route for built-in proxy functionality

### 📚 Setup Guides
- **`env-setup-guide.md`** - Environment variables and security best practices
- **`proxy-package.json`** - Package.json for the universal proxy server

## 🎯 Choose Your Integration Method

### Method 1: CDN (Recommended for Testing)

**Use Case**: Quick prototypes, demos, static websites

```html
<script src="https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/customgpt-widget.js"></script>
<script>
  CustomGPTWidget.init({
    agentId: 'YOUR_AGENT_ID',
    apiKey: 'YOUR_API_KEY', // ⚠️ Only for development/internal tools
    containerId: 'chat-container'
  });
</script>
```

### Method 2: React with Universal Proxy (Production)

**Use Case**: React applications requiring secure API key handling

```jsx
// Component
<SimplifiedWidget
  agentId={process.env.REACT_APP_CUSTOMGPT_AGENT_ID}
  agentName={process.env.REACT_APP_CUSTOMGPT_AGENT_NAME}
  apiBaseUrl="http://localhost:3001/api/proxy"
/>
```

```bash
# Setup
npm install express cors dotenv
node universal-customgpt-proxy.js  # Runs on port 3001
```

### Method 3: Next.js with Built-in Proxy (Production)

**Use Case**: Next.js applications with built-in API routes

```jsx
// Component
<SimplifiedWidget
  agentId={process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID}
  agentName={process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME}
  apiBaseUrl="/api/proxy"
/>
```

```javascript
// pages/api/proxy/projects/[projectId]/conversations.js
export default function handler(req, res) {
  // Proxy logic with server-side API key
}
```

### Method 4: Iframe Embed (Maximum Security)

**Use Case**: Third-party sites, strict CSP requirements

```html
<iframe 
  src="https://your-domain.com/widget/iframe.html?agentId=123"
  width="400" 
  height="600"
  frameborder="0">
</iframe>
```

## 🔧 Configuration Options

### Basic Configuration

```javascript
CustomGPTWidget.init({
  agentId: 'YOUR_AGENT_ID',           // Required: Your CustomGPT.ai agent ID
  mode: 'embedded',                   // 'embedded' | 'floating'
  containerId: 'chat-container',      // Required for embedded mode
  position: 'bottom-right',           // For floating mode
  theme: 'light',                     // 'light' | 'dark'
  width: '400px',
  height: '600px'
});
```

### Advanced Configuration

```javascript
CustomGPTWidget.init({
  agentId: 'YOUR_AGENT_ID',
  agentName: 'Support Assistant',
  
  // Security Options
  apiKey: 'YOUR_API_KEY',            // Direct API (development only)
  apiBaseUrl: '/api/proxy',          // Proxy API (production)
  
  // UI Options
  mode: 'floating',
  position: 'bottom-right',
  theme: 'dark',
  width: '400px',
  height: '600px',
  
  // Features
  enableConversationManagement: true,
  maxConversations: 10,
  enableCitations: true,
  enableFeedback: true,
  
  // Events
  onOpen: () => console.log('Chat opened'),
  onClose: () => console.log('Chat closed'),
  onMessage: (msg) => console.log('New message:', msg),
  onConversationChange: (conv) => console.log('Switched conversation:', conv)
});
```

## 🛡️ Security & Environment Variables

### Production Environment Setup

**React (.env.local)**:
```env
# Client-side (exposed to browser - safe)
REACT_APP_CUSTOMGPT_AGENT_ID=78913
REACT_APP_CUSTOMGPT_AGENT_NAME=My Assistant
REACT_APP_API_PROXY_URL=http://localhost:3001/api/proxy
```

**Next.js (.env.local)**:
```env
# Server-side (secure)
CUSTOMGPT_API_KEY=your_secret_api_key_here

# Client-side (exposed to browser - safe)  
NEXT_PUBLIC_CUSTOMGPT_AGENT_ID=78913
NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME=My Assistant
```

**Universal Proxy Server (.env)**:
```env
CUSTOMGPT_API_KEY=your_secret_api_key_here
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
PORT=3001
```

### Security Rules

✅ **Safe to Expose (Client-side)**:
- Agent IDs
- Agent names  
- UI configuration
- Proxy URLs

❌ **Never Expose (Server-side only)**:
- API keys
- Internal endpoints
- Database credentials

## 🚀 Quick Setup Commands

### React + Universal Proxy

```bash
# 1. Setup proxy server
mkdir customgpt-proxy && cd customgpt-proxy
npm init -y && npm install express cors dotenv
# Copy universal-proxy-server.js and create .env with your API key
node server.js &

# 2. Setup React app
cd ../your-react-app
echo "REACT_APP_CUSTOMGPT_AGENT_ID=YOUR_AGENT_ID" > .env.local
echo "REACT_APP_API_PROXY_URL=http://localhost:3001/api/proxy" >> .env.local
npm start
```

### Next.js Setup

```bash
# 1. Environment setup
echo "CUSTOMGPT_API_KEY=your_secret_key" > .env.local
echo "NEXT_PUBLIC_CUSTOMGPT_AGENT_ID=YOUR_AGENT_ID" >> .env.local

# 2. Add API route
mkdir -p pages/api/proxy/projects
# Copy API route files for widget endpoints

npm run dev
```

## 📱 Framework Support

| Framework | Direct API | Proxy Required | Setup Complexity |
|-----------|------------|----------------|------------------|
| **HTML/JS** | ✅ Yes | ❌ No | ⭐ Easy |
| **React** | ✅ Yes | ✅ Recommended | ⭐⭐ Medium |
| **Next.js** | ✅ Yes | ✅ Built-in | ⭐⭐ Medium |
| **Vue.js** | ✅ Yes | ✅ External proxy | ⭐⭐ Medium |
| **Angular** | ✅ Yes | ✅ External proxy | ⭐⭐⭐ Advanced |
| **Svelte** | ✅ Yes | ✅ External proxy | ⭐⭐ Medium |

## 🔍 Troubleshooting

### Widget Not Loading

```javascript
// Check if widget loaded
if (typeof CustomGPTWidget === 'undefined') {
  console.error('Widget not loaded - check script src');
}

// Enable debug mode
window.CUSTOMGPT_DEBUG = true;
```

### Environment Variables Not Working

**React**: Variables need `REACT_APP_` prefix and app restart
**Next.js**: Client variables need `NEXT_PUBLIC_` prefix
**Check**: `console.log(process.env.REACT_APP_YOUR_VARIABLE)`

### API Connection Issues

1. Verify agent ID in CustomGPT.ai dashboard
2. Check API key is correct and active
3. Ensure proxy server is running (if using proxy mode)
4. Check browser console for CORS errors

### Clear Conversation Data

```javascript
// Clear stored conversations
localStorage.removeItem('customgpt_conversations');
localStorage.removeItem('customgpt_sessions');
```

## 📚 Additional Resources

- [CustomGPT.ai Dashboard](https://app.customgpt.ai) - Manage your agents and get API keys
- [Main Documentation](../README.md) - Complete project documentation and deployment guides
- [API Documentation](https://docs.customgpt.ai) - CustomGPT.ai API reference
- [Widget Configuration](https://docs.customgpt.ai/widget) - Complete widget API documentation

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/Poll-The-People/customgpt-starter-kit/issues)
- **Email**: support@customgpt.ai
- **Documentation**: [docs.customgpt.ai](https://docs.customgpt.ai)

---

**🎉 Ready to get started?** Begin with `quick-start.html` to test your agent, then choose the integration method that fits your project!