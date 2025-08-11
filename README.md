<div align="center">
  <img src="logo.png" alt="CustomGPT.ai" width="100" height="100" />
  <h1>CustomGPT Chat UI(beta)</h1>
  <p><strong>A modern, secure chat interface for CustomGPT.ai with multiple deployment options including embedded widgets, floating buttons, and standalone applications.</strong></p>
</div>


## Table of Contents

- [Features](#features)
- [Security](#security)
- [Quick Start](#quick-start)
- [Demo Mode](#demo-mode)
- [Installation](#installation)
- [Widget Integration](#widget-integration)
  - [Iframe Embed (Recommended)](#iframe-embed-recommended)
  - [Direct Widget](#direct-widget)
  - [React Integration](#react-integration)
- [Configuration Options](#configuration-options)
- [Building and Deployment](#building-and-deployment)
- [Development](#development)
- [API Proxy Setup](#api-proxy-setup)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Features

- 🚀 **Multiple Deployment Modes**: Iframe embed, direct widget, floating button, or standalone
- 🔒 **Secure API Proxy**: Server-side API key management
- 💬 **Conversation Management**: Multi-conversation support with persistence
- 🎨 **Customizable UI**: Themes, colors, positioning, and branding options
- 🔄 **Real-time Streaming**: Live message streaming with typing indicators
- 📎 **Rich Media Support**: File uploads, citations, and markdown rendering
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- ⚡ **Optimized Performance**: Lazy loading and efficient bundling
- 🏢 **Multi-Agent Support**: Switch between different CustomGPT agents
- 🎭 **Demo Mode**: Try the app without server setup using your own API keys
- 🎤 **Voice Features**: Speech-to-text and voice chat capabilities (requires OpenAI API key)

## Security

This project implements several security best practices:

- **Server-Side API Keys**: API keys are stored only in server environment variables
- **Proxy API Routes**: All API calls go through Next.js API routes that add authentication
- **No Client Exposure**: API keys are never sent to or stored in the browser
- **Environment Variables**: Sensitive configuration is kept in `.env.local`

## Quick Start

### Option 1: Iframe Embed (Most Secure & Lightweight)

```html
<!-- Include the embed script -->
<script src="https://your-domain.com/iframe-embed.js"></script>

<script>
  // Initialize the widget
  const widget = CustomGPTEmbed.init({
    agentId: 123,  // Your agent ID
    mode: 'floating', // or 'embedded'
    iframeSrc: 'https://your-domain.com/widget/', // Your hosted iframe app
    position: 'bottom-right',
    theme: 'light'
  });
</script>
```

### Option 2: Direct Widget

```html
<!-- For embedded mode -->
<div id="my-widget-container"></div>
<script src="https://your-domain.com/customgpt-widget.js"></script>
<script>
  CustomGPTWidget.init({
    agentId: 123,
    mode: 'embedded',
    containerId: 'my-widget-container'
  });
</script>
```

## Demo Mode

Demo mode allows you to try CustomGPT UI without setting up a server or adding API keys to environment files. Perfect for testing and evaluation!

### How to Use Demo Mode

1. **Build and run the app in demo mode**:
```bash
# Set demo mode environment variable
NEXT_PUBLIC_DEMO_MODE=true npm run dev

# Or build for production demo
NEXT_PUBLIC_DEMO_MODE=true npm run build
npm start
```

2. **Select Demo Mode**: On first visit, you'll see a deployment mode selection screen:
   - Choose "Demo Mode" to try the app with your own API keys
   - Choose "Production Mode" to use server-side API keys

3. **Enter Your API Keys**:
   - **CustomGPT API Key** (Required): Get from [CustomGPT Dashboard](https://app.customgpt.ai)
   - **OpenAI API Key** (Optional): Required only for voice features

### Demo Mode Features

✅ **What Works in Demo Mode**:
- Full chat functionality with your CustomGPT agents
- Multi-conversation support
- File uploads and citations
- All UI customization options
- Voice chat and speech-to-text (with OpenAI key)
- Real-time message streaming
- Agent switching

❌ **Limitations**:
- API keys are stored in browser (localStorage)
- Keys need to be re-entered if browser data is cleared
- Not recommended for production use
- Some enterprise features may be limited

### Security Considerations

While demo mode is secure for testing, note that:
- API keys are stored in the browser's localStorage
- Keys are sent via secure headers to the proxy endpoints
- For production use, always use server-side environment variables

### Voice Features in Demo Mode

To use voice features (speech-to-text, voice chat) in demo mode:

1. Enable voice features in the demo configuration
2. Add your OpenAI API key
3. The key will be securely passed to voice endpoints
4. Voice features include:
   - Speech-to-text transcription
   - Real-time voice conversations
   - Multiple voice options and personas

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm
- CustomGPT API key

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/customgpt/customgpt-ui.git
cd customgpt-ui
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
# Required - Server-side only (never exposed to client)
CUSTOMGPT_API_KEY=your-api-key-here

# Optional - For voice features (speech-to-text, voice chat)
OPENAI_API_KEY=your-openai-api-key-here

# Optional - Custom API base URL
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1

# Optional - Enable demo mode
NEXT_PUBLIC_DEMO_MODE=true
```

5. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Widget Integration

### Iframe Embed (Recommended)

The iframe embed provides the best isolation and security:

```javascript
const widget = CustomGPTEmbed.init({
  agentId: 123,              // Required: Your agent ID
  mode: 'floating',          // 'floating' or 'embedded'
  theme: 'light',            // 'light' or 'dark'
  position: 'bottom-right',  // For floating mode
  width: '400px',           
  height: '600px',
  enableCitations: true,
  enableFeedback: true,
  iframeSrc: 'https://your-domain.com/widget/', // Your hosted iframe app
  
  // Callbacks
  onReady: () => console.log('Widget ready'),
  onMessage: (data) => console.log('New message:', data),
  onError: (error) => console.error('Widget error:', error)
});

// Methods
widget.open();      // Open the widget
widget.close();     // Close the widget
widget.toggle();    // Toggle open/closed
widget.destroy();   // Remove widget
```

### Direct Widget

For direct integration into your page:

```javascript
const widget = CustomGPTWidget.init({
  agentId: 123,
  mode: 'embedded',
  containerId: 'chat-container',
  theme: 'light',
  enableCitations: true,
  enableFeedback: true
});
```

### React Integration

**For standalone API key setup, see**: [React Standalone Guide](./docs/integrations/react-standalone.md)

```jsx
import { useEffect, useRef } from 'react';

function ChatWidget({ apiKey, agentId }) {
  const widgetRef = useRef(null);

  useEffect(() => {
    // Load widget script first
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/customgpt-widget.js';
    script.onload = () => {
      const widget = window.CustomGPTWidget.init({
        agentId: agentId,
        apiKey: apiKey, // For standalone usage
        // OR use proxy:
        // apiBaseUrl: '/api/customgpt-proxy',
        containerId: 'my-chat',
        mode: 'embedded'
      });
      widgetRef.current = widget;
    };
    document.body.appendChild(script);

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [apiKey, agentId]);

  return <div id="my-chat" style={{ height: '600px' }} />;
}
```

## Configuration Options

### Core Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `agentId` | number/string | Yes | Your CustomGPT agent ID |
| `mode` | string | No | 'embedded', 'floating', or 'fullscreen' |
| `theme` | string | No | 'light' or 'dark' (default: 'light') |

### Display Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerId` | string | - | DOM element ID for embedded mode |
| `position` | string | 'bottom-right' | Position for floating mode |
| `width` | string | '400px' | Widget width |
| `height` | string | '600px' | Widget height |
| `borderRadius` | string | '12px' | Corner radius |
| `zIndex` | number | 9999 | Stack order |

### Feature Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableCitations` | boolean | true | Show citation sources |
| `enableFeedback` | boolean | true | Show thumbs up/down buttons |
| `sessionId` | string | auto | Custom session identifier |
| `isolateConversations` | boolean | false | Isolate conversations per page |

### Iframe-Specific Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `iframeSrc` | string | Yes | URL where iframe app is hosted |

## Building and Deployment

### Build for Production

```bash
# Build everything
npm run build:all

# Build individual components
npm run build:widget    # Widget bundle only
npm run build:iframe    # Iframe app only
npm run build          # Next.js standalone app
```

### Build Outputs

#### Widget Bundle (`dist/widget/`)
- `customgpt-widget.js` (179KB) - Main widget bundle
- `customgpt-widget.css` (76KB) - Widget styles
- `vendors.js` (1.57MB) - React and dependencies
- `index.html` - Demo/test page

#### Iframe App (`dist/iframe/`)
- `iframe-app.js` (154KB) - Iframe application
- `iframe-app.css` (75KB) - Iframe styles
- `vendors.js` (1.57MB) - Shared dependencies
- `index.html` - Iframe container

#### Standalone App
- `.next/` - Next.js build output

**Key Features:**
- 🔐 **Multiple API Key Options** - Proxy, environment variables, or runtime config
- 🎨 **Theme Support** - Light, dark, and auto themes
- 📱 **Responsive Design** - Works on all device sizes
- 🔊 **Voice Input** - Built-in speech recognition
- 📎 **File Upload** - Document and image support
- 🌐 **Iframe Isolation** - Complete CSS and JS isolation

### Deployment Options

#### 1. Docker (Recommended)

The project includes comprehensive Docker support with flexible deployment options:

```bash
# Quick start - Main application only
docker-compose up app

# Widget only
docker-compose --profile widget up widget

# Iframe only
docker-compose --profile iframe up iframe

# Everything with production proxy
docker-compose --profile all up

# Development environment
docker-compose --profile dev up dev
```

**Setup**:
1. Copy environment file: `cp .env.docker.example .env`
2. Add your API keys:
   - `CUSTOMGPT_API_KEY=your-api-key-here`
   - `OPENAI_API_KEY=your-openai-key-here` (optional, for voice features)
3. For demo mode, add: `NEXT_PUBLIC_DEMO_MODE=true`
4. Run desired service: `docker-compose up app`

**Available Services**:
- **`app`** (port 3000): Full Next.js application with dashboard
- **`widget`** (port 8080): Widget-only static files for embedding
- **`iframe`** (port 8081): Iframe-only static files for embedding  
- **`nginx`** (ports 80/443): Production reverse proxy with SSL
- **`dev`** (ports 3000/8080/8081): Development environment with hot reload

#### 2. Vercel (For Next.js App)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/customgpt/customgpt-ui)

1. Click the deploy button
2. Add environment variables:
   - `CUSTOMGPT_API_KEY`: Your API key

#### 3. Static Hosting (For Widget Only)

```bash
# Build widget files
npm run build:widget
npm run build:iframe

# Upload dist/widget/ and dist/iframe/ to your CDN or static host
```

#### 4. Manual Docker Build

```bash
# Build specific deployment target
docker build --target standalone -t customgpt-ui:app .
docker build --target widget -t customgpt-ui:widget .
docker build --target iframe -t customgpt-ui:iframe .

# Run standalone app
docker run -p 3000:3000 -e CUSTOMGPT_API_KEY=your-key customgpt-ui:app

# Run widget server
docker run -p 8080:80 customgpt-ui:widget

# Run iframe server  
docker run -p 8081:80 customgpt-ui:iframe
```

## API Proxy Setup

The application uses Next.js API routes as a proxy to securely handle API authentication:

### Proxy Endpoints

All API calls go through `/api/proxy/*` which adds the API key server-side:

- `/api/proxy/agents` - Agent management
- `/api/proxy/conversations` - Conversation handling  
- `/api/proxy/messages` - Message operations
- `/api/proxy/sources` - Source management

### Environment Variables

```env
# Required - Your CustomGPT API key (server-side only)
CUSTOMGPT_API_KEY=your-api-key-here

# Optional - For voice features (speech-to-text, voice chat)
OPENAI_API_KEY=your-openai-api-key-here

# Optional - Custom API base URL
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1

# Optional - Allowed origins for CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://anotherdomain.com

# Optional - Enable demo mode
NEXT_PUBLIC_DEMO_MODE=true
```

## Development

### Project Structure

```
customgpt-ui/
├── app/                  # Next.js app directory
│   └── api/             
│       └── proxy/       # Secure API proxy routes
├── src/
│   ├── components/      # React components
│   ├── store/          # State management (Zustand)
│   ├── lib/            # Utilities and API client
│   └── widget/         # Widget-specific code
├── public/             # Static assets
├── dist/              # Build outputs
└── examples/          # Integration examples
```

### Development Commands

```bash
# Start development server
npm run dev

# Run widget dev server
npm run dev:widget

# Type checking
npm run type-check

# Linting
npm run lint

# Run all builds
npm run build:all
```

### Adding New Features

1. Components go in `src/components/`
2. API logic goes in `src/lib/api/`
3. State management in `src/store/`
4. Widget-specific code in `src/widget/`

## Examples

See the `examples/` directory for integration examples:

### React Examples
- **`react-standalone-example.jsx`** - Complete standalone React demo with all API key methods
- **`react-integration.jsx`** - Updated React component with API key support  
- **`react-floating-button.jsx`** - Custom floating button implementation

### HTML Examples
- **`iframe-embed-example.html`** - Iframe embedding
- **`widget-example.html`** - Direct widget embedding
- **`quick-start.html`** - Minimal setup

### Documentation
- **`docs/integrations/react-standalone.md`** - Comprehensive React integration guide
- **`docs/integrations/react.md`** - Basic React integration
- **`docs/integrations/nextjs.md`** - Next.js specific setup

## Troubleshooting

### Widget Not Loading

1. Check browser console for errors
2. Verify agent ID is correct
3. Ensure your domain is allowed (CORS)
4. Check that API proxy is working

### API Errors

1. Verify API key in `.env.local`
2. Check API proxy routes are deployed
3. Look for errors in server logs
4. Ensure API key has correct permissions

### Demo Mode Issues

1. **"API key required" errors**: Ensure you've entered your API keys in demo settings
2. **Voice features not working**: Add OpenAI API key in demo configuration
3. **Keys not persisting**: Check browser's localStorage is not being cleared
4. **Can't exit demo mode**: Clear localStorage or switch to production mode

### Voice Features Issues

1. **Speech-to-text not working**: 
   - Check microphone permissions
   - Ensure OpenAI API key is configured
   - Verify browser supports Web Speech API
2. **Voice chat errors**: 
   - Both CustomGPT and OpenAI keys are required
   - Check browser console for specific errors

### Styling Issues

1. Check for CSS conflicts
2. Use iframe mode for better isolation
3. Increase z-index if needed
4. Check responsive breakpoints

## Support

- Issues: [GitHub Issues](https://github.com/customgpt/customgpt-ui/issues)
- Documentation: [CustomGPT Docs](https://docs.customgpt.ai)
- Email: support@customgpt.ai

## License

MIT License - see LICENSE file for details.