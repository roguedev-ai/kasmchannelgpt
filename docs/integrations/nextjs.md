# Next.js Integration Guide

Complete guide for integrating CustomGPT widget with Next.js applications, including App Router and Pages Router support.

## Table of Contents
- [Installation](#installation)
- [App Router Integration](#app-router-integration)
- [Pages Router Integration](#pages-router-integration)
- [API Routes Setup](#api-routes-setup)
- [TypeScript Configuration](#typescript-configuration)
- [Deployment](#deployment)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Installation

### 1. Clone or Install

```bash
# Clone the full project (includes API proxy)
git clone https://github.com/customgpt/customgpt-ui.git
cd customgpt-ui
npm install

# Or install widget files only
npm install @customgpt/widget # Coming soon
```

### 2. Environment Setup

Create `.env.local`:
```env
# Required - Server-side only
CUSTOMGPT_API_KEY=your_api_key_here

# Optional
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
ALLOWED_ORIGINS=https://yourdomain.com
```

## App Router Integration

### Basic Client Component

```tsx
// app/components/ChatWidget.tsx
'use client';

import { useEffect, useRef } from 'react';

interface ChatWidgetProps {
  agentId: number;
  mode?: 'embedded' | 'floating';
}

export default function ChatWidget({ agentId, mode = 'embedded' }: ChatWidgetProps) {
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import widget script
    const loadWidget = async () => {
      if (typeof window !== 'undefined' && !window.CustomGPTWidget) {
        const script = document.createElement('script');
        script.src = '/widget/customgpt-widget.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Initialize widget
      if (window.CustomGPTWidget) {
        widgetRef.current = window.CustomGPTWidget.init({
          agentId,
          mode,
          containerId: mode === 'embedded' ? 'chat-container' : undefined,
        });
      }
    };

    loadWidget();

    // Cleanup
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [agentId, mode]);

  if (mode === 'floating') return null;

  return <div id="chat-container" className="h-[600px] w-full" />;
}
```

### Using in App Router Page

```tsx
// app/support/page.tsx
import ChatWidget from '@/components/ChatWidget';

export default function SupportPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Support</h1>
      
      {/* Chat widget with server-side API proxy */}
      <ChatWidget agentId={123} mode="embedded" />
    </div>
  );
}
```

### Dynamic Import with Loading State

```tsx
// app/components/DynamicChat.tsx
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ChatWidget = dynamic(
  () => import('./ChatWidget'),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[600px] w-full" />
    ),
  }
);

export default function DynamicChat({ agentId }: { agentId: number }) {
  return <ChatWidget agentId={agentId} />;
}
```

### Layout Integration (Floating Widget)

```tsx
// app/layout.tsx
import './globals.css';
import FloatingChat from '@/components/FloatingChat';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Floating widget available on all pages */}
        <FloatingChat agentId={123} />
      </body>
    </html>
  );
}
```

```tsx
// app/components/FloatingChat.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function FloatingChat({ agentId }: { agentId: number }) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Skip on certain pages
    const excludedPaths = ['/admin', '/login'];
    if (excludedPaths.some(path => pathname.startsWith(path))) {
      return;
    }

    let widget: any;

    const initWidget = async () => {
      if (typeof window !== 'undefined' && window.CustomGPTWidget) {
        widget = window.CustomGPTWidget.init({
          agentId,
          mode: 'floating',
          position: 'bottom-right',
        });
      }
    };

    initWidget();

    return () => {
      if (widget) {
        widget.destroy();
      }
    };
  }, [agentId, pathname]);

  return null;
}
```

## Pages Router Integration

### Basic Component

```tsx
// components/ChatWidget.tsx
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface ChatWidgetProps {
  agentId: number;
}

export default function ChatWidget({ agentId }: ChatWidgetProps) {
  const widgetRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initWidget = () => {
      if (window.CustomGPTWidget) {
        widgetRef.current = window.CustomGPTWidget.init({
          agentId,
          mode: 'embedded',
          containerId: 'chat-widget',
        });
      }
    };

    // Load script
    if (!window.CustomGPTWidget) {
      const script = document.createElement('script');
      script.src = '/widget/customgpt-widget.js';
      script.onload = initWidget;
      document.body.appendChild(script);
    } else {
      initWidget();
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [agentId]);

  return <div id="chat-widget" style={{ height: '600px' }} />;
}
```

### Page Implementation

```tsx
// pages/support.tsx
import Head from 'next/head';
import ChatWidget from '@/components/ChatWidget';

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Support - CustomGPT</title>
      </Head>
      
      <div className="container">
        <h1>Customer Support</h1>
        <ChatWidget agentId={123} />
      </div>
    </>
  );
}
```

### _app.tsx Global Widget

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize floating widget globally
    if (typeof window !== 'undefined' && window.CustomGPTWidget) {
      const widget = window.CustomGPTWidget.init({
        agentId: 123,
        mode: 'floating',
      });

      return () => {
        widget.destroy();
      };
    }
  }, []);

  return <Component {...pageProps} />;
}
```

## API Routes Setup

### Proxy Configuration

The CustomGPT UI includes built-in API proxy routes. If you're integrating into an existing Next.js app, you can copy the proxy setup:

```typescript
// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.CUSTOMGPT_API_KEY;
const API_BASE_URL = process.env.CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = new URL(request.url);
  const queryString = url.searchParams.toString();
  const apiUrl = `${API_BASE_URL}/${path}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const apiUrl = `${API_BASE_URL}/${path}`;
  const body = await request.json();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### CORS Configuration

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS for widget endpoints
  if (request.nextUrl.pathname.startsWith('/api/proxy')) {
    const response = NextResponse.next();
    
    // Get allowed origins from env
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    const origin = request.headers.get('origin') || '';
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    return response;
  }
}

export const config = {
  matcher: '/api/proxy/:path*',
};
```

## TypeScript Configuration

### Type Definitions

Create `types/customgpt.d.ts`:

```typescript
declare global {
  interface Window {
    CustomGPTWidget: {
      init(config: WidgetConfig): WidgetInstance;
    };
    CustomGPTEmbed: {
      init(config: EmbedConfig): EmbedInstance;
    };
  }
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
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: any) => void;
}

interface WidgetInstance {
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
  getConversations(): any[];
  createConversation(title?: string): any;
  switchConversation(id: string): void;
}

interface EmbedConfig extends WidgetConfig {
  iframeSrc: string;
}

interface EmbedInstance extends WidgetInstance {
  postMessage(type: string, data?: any): void;
}

export {};
```

### Update tsconfig.json

```json
{
  "compilerOptions": {
    "types": ["./types/customgpt"]
  },
  "include": ["types/**/*.ts"]
}
```

## Deployment

### Vercel Deployment

1. **Environment Variables**
   ```bash
   # Add to Vercel dashboard
   CUSTOMGPT_API_KEY=your_api_key_here
   CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Build Configuration**
   ```json
   // vercel.json
   {
     "functions": {
       "app/api/proxy/[...path]/route.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Self-Hosted Deployment

1. **Build**
   ```bash
   npm run build
   ```

2. **Start**
   ```bash
   npm start
   ```

3. **PM2 Process Manager**
   ```bash
   pm2 start npm --name "customgpt-ui" -- start
   pm2 save
   pm2 startup
   ```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./

RUN npm ci --only=production

EXPOSE 3000
CMD ["npm", "start"]
```

## Performance Optimization

### 1. Lazy Loading

```tsx
// components/LazyChat.tsx
'use client';

import { lazy, Suspense, useState } from 'react';

const ChatWidget = lazy(() => import('./ChatWidget'));

export default function LazyChat() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowChat(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-4"
      >
        💬 Chat
      </button>

      {showChat && (
        <Suspense fallback={<div>Loading chat...</div>}>
          <ChatWidget agentId={123} />
        </Suspense>
      )}
    </>
  );
}
```

### 2. Resource Hints

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Preconnect to API */}
        <link rel="preconnect" href="https://app.customgpt.ai" />
        <link rel="dns-prefetch" href="https://app.customgpt.ai" />
        
        {/* Preload widget script */}
        <link rel="preload" href="/widget/customgpt-widget.js" as="script" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3. Script Optimization

```tsx
// components/OptimizedWidget.tsx
import Script from 'next/script';

export default function OptimizedWidget({ agentId }: { agentId: number }) {
  return (
    <>
      <Script
        src="/widget/customgpt-widget.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (window.CustomGPTWidget) {
            window.CustomGPTWidget.init({
              agentId,
              mode: 'embedded',
              containerId: 'optimized-chat',
            });
          }
        }}
      />
      <div id="optimized-chat" className="h-[600px]" />
    </>
  );
}
```

### 4. Intersection Observer

```tsx
// components/VisibleChat.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function VisibleChat({ agentId }: { agentId: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-[600px]">
      {isVisible && <ChatWidget agentId={agentId} />}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

#### 1. Hydration Mismatch

```tsx
// Fix: Use dynamic import with ssr: false
const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false,
});
```

#### 2. Window is not defined

```tsx
// Fix: Check for window
if (typeof window !== 'undefined') {
  // Browser-only code
}
```

#### 3. CORS Issues

```typescript
// Fix: Configure middleware.ts properly
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
```

#### 4. API Key Not Found

```bash
# Fix: Ensure .env.local is properly configured
CUSTOMGPT_API_KEY=your_actual_api_key_here
```

### Debug Mode

```tsx
// Enable debug logging
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    window.CUSTOMGPT_DEBUG = true;
  }
}, []);
```

## Advanced Features

### Multi-Agent Support

```tsx
// components/MultiAgentChat.tsx
'use client';

import { useState } from 'react';
import ChatWidget from './ChatWidget';

const agents = [
  { id: 123, name: 'Sales Support' },
  { id: 456, name: 'Technical Support' },
  { id: 789, name: 'General Inquiries' },
];

export default function MultiAgentChat() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);

  return (
    <div>
      <select 
        value={selectedAgent.id}
        onChange={(e) => {
          const agent = agents.find(a => a.id === Number(e.target.value));
          if (agent) setSelectedAgent(agent);
        }}
        className="mb-4 p-2 border rounded"
      >
        {agents.map(agent => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>

      <ChatWidget key={selectedAgent.id} agentId={selectedAgent.id} />
    </div>
  );
}
```

### Analytics Integration

```tsx
// components/AnalyticsChat.tsx
'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function AnalyticsChat({ agentId }: { agentId: number }) {
  const { track } = useAnalytics();

  useEffect(() => {
    if (window.CustomGPTWidget) {
      const widget = window.CustomGPTWidget.init({
        agentId,
        mode: 'floating',
        onOpen: () => track('chat_opened'),
        onClose: () => track('chat_closed'),
        onMessage: (msg) => track('message_sent', { 
          role: msg.role,
          length: msg.content.length 
        }),
      });

      return () => widget.destroy();
    }
  }, [agentId, track]);

  return null;
}
```

## Examples

Complete examples available in the repository:

- `/examples/nextjs-app-router/` - App Router example
- `/examples/nextjs-pages-router/` - Pages Router example
- `/app/` - Full Next.js application with API proxy

## Support

- GitHub: [CustomGPT UI Issues](https://github.com/customgpt/customgpt-ui/issues)
- Documentation: [CustomGPT Docs](https://docs.customgpt.ai)
- Next.js Docs: [Next.js Documentation](https://nextjs.org/docs)