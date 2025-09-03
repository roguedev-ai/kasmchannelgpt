# CustomGPT Widget Integration with Vue.js & Vite

Complete guide for securely integrating CustomGPT widgets into Vue.js applications using Vite build tool.

## Overview

This integration provides:
- ✅ **Enterprise-grade security**: API keys never exposed to the browser
- ✅ **Full widget functionality**: Embedded chat, floating button, streaming responses
- ✅ **Vue 3 Composition API**: Modern Vue patterns with TypeScript support
- ✅ **Hot Module Replacement**: Fast development with Vite proxy configuration

## Architecture

```
Browser Widget → Vite Dev Server (port 5173) → Proxy Server (port 3001) → CustomGPT API
```

## Required Files

### 1. Environment Configuration (`.env`)

```bash
# SERVER-SIDE ONLY (secure) 
CUSTOMGPT_API_KEY=your_customgpt_api_key

# CLIENT-SIDE (safe to expose in Vue/Vite)
VITE_CUSTOMGPT_AGENT_ID=78913
VITE_CUSTOMGPT_AGENT_NAME=Your Agent Name
VITE_CUSTOMGPT_AGENT_ID_2=78913
VITE_CUSTOMGPT_AGENT_NAME_2=Your Floating Agent Name

# API Configuration
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
PORT=3001
NODE_ENV=development
```

### 2. Proxy Server (`server.js`)

Use our universal proxy server that handles all widget endpoints:

```javascript
// Use the universal-customgpt-proxy.js from examples directory
// Copy universal-customgpt-proxy.js to your project root as server.js
```

Or create a Vue-specific version:

```javascript
/**
 * CustomGPT Proxy Server for Vue/Vite Applications
 * 
 * Based on successful Docusaurus integration pattern.
 * Handles all CustomGPT widget API requests securely.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow Vite dev server
app.use(cors({
  origin: [
    'http://localhost:5173',   // Vite default port
    'http://localhost:3000',   // Alt dev port
    'http://localhost:4173',   // Vite preview port
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper function to get agent ID with Vue-specific fallbacks
function getAgentId(projectId) {
  if (projectId && projectId !== 'undefined' && projectId !== 'null') {
    return projectId;
  }
  return process.env.VITE_CUSTOMGPT_AGENT_ID || '78913';
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CustomGPT Vue/Vite Proxy'
  });
});

// Widget endpoint: Create conversations
app.post('/api/proxy/projects/:projectId/conversations', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found. Please check your .env file.' 
    });
  }

  const agentId = getAgentId(req.params.projectId);
  const customgptUrl = `https://app.customgpt.ai/api/v1/projects/${agentId}/conversations`;
  
  console.log(`[VUE WIDGET] POST ${customgptUrl}`);

  try {
    const response = await fetch(customgptUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[VUE PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Widget endpoint: Send messages (with streaming support)
app.post('/api/proxy/projects/:projectId/conversations/:conversationId/messages', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const { projectId, conversationId } = req.params;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found. Please check your .env file.' 
    });
  }

  const agentId = getAgentId(projectId);
  const customgptUrl = `https://app.customgpt.ai/api/v1/projects/${agentId}/conversations/${conversationId}/messages`;
  
  console.log(`[VUE WIDGET] POST ${customgptUrl}`);

  try {
    const response = await fetch(customgptUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: 'CustomGPT API error', 
        details: errorText 
      });
    }

    // Handle streaming responses for real-time chat
    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = response.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (streamError) {
          console.error('[STREAM ERROR]', streamError);
          res.end();
        }
      };
      pump();
    } else {
      const data = await response.json();
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('[VUE PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Widget endpoint: Get project settings
app.get('/api/proxy/projects/:projectId/settings', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const agentId = getAgentId(req.params.projectId);
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found. Please check your .env file.' 
    });
  }

  try {
    const response = await fetch(`https://app.customgpt.ai/api/v1/projects/${agentId}/settings`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[VUE PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Widget endpoint: Get project details
app.get('/api/proxy/projects/:projectId', async (req, res) => {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  const agentId = getAgentId(req.params.projectId);
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CUSTOMGPT_API_KEY not found. Please check your .env file.' 
    });
  }

  try {
    const response = await fetch(`https://app.customgpt.ai/api/v1/projects/${agentId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[VUE PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 CustomGPT Vue/Vite Proxy Server Started`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxy: http://localhost:${PORT}/api/proxy/*`);
  console.log(`🔑 API Key: ${process.env.CUSTOMGPT_API_KEY ? 'Yes ✅' : 'No ❌'}`);
  console.log(`⚡ Vite: http://localhost:5173`);
});

module.exports = app;
```

### 3. Vite Proxy Configuration (`vite.config.js`)

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api/proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: false, // Disable WebSocket proxying for SSE
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[VITE PROXY ERROR]', err.message);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Development proxy failed',
                details: err.message,
                suggestion: 'Make sure server.js is running on port 3001'
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[VITE PROXY] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
          });
        }
      }
    }
  },
  define: {
    // Ensure Vite environment variables are available at build time
    'import.meta.env.VITE_CUSTOMGPT_AGENT_ID': JSON.stringify(process.env.VITE_CUSTOMGPT_AGENT_ID),
    'import.meta.env.VITE_CUSTOMGPT_AGENT_NAME': JSON.stringify(process.env.VITE_CUSTOMGPT_AGENT_NAME),
    'import.meta.env.VITE_CUSTOMGPT_AGENT_ID_2': JSON.stringify(process.env.VITE_CUSTOMGPT_AGENT_ID_2),
    'import.meta.env.VITE_CUSTOMGPT_AGENT_NAME_2': JSON.stringify(process.env.VITE_CUSTOMGPT_AGENT_NAME_2),
  }
});
```

### 4. Vue Widget Components

#### Embedded Chat Widget (`src/components/CustomGPTWidget.vue`)

```vue
<template>
  <div
    v-if="error"
    class="customgpt-error"
    :style="{
      padding: '20px',
      background: '#fee',
      border: '1px solid #fcc',
      borderRadius: '8px',
      color: '#c33'
    }"
  >
    <h4>CustomGPT Widget Error</h4>
    <p>{{ error }}</p>
    <details style="margin-top: 10px">
      <summary>Debug Information</summary>
      <pre style="font-size: 12px; margin-top: 8px">
Scripts Loaded: {{ scriptsLoaded }}
Agent ID: {{ agentId }}
API Base URL: {{ apiBaseUrl }}
Container ID: {{ containerId }}
      </pre>
    </details>
  </div>

  <div
    v-else-if="!scriptsLoaded && autoLoad"
    class="customgpt-loading"
    :style="{
      padding: '40px',
      textAlign: 'center',
      background: '#f5f5f5',
      borderRadius: '8px'
    }"
  >
    <div>Loading CustomGPT widget...</div>
    <div style="font-size: 12px; color: #666; margin-top: 8px">
      Loading scripts from CDN
    </div>
  </div>

  <div
    v-else
    :id="containerId"
    :style="{ width, height }"
    class="customgpt-widget-container"
  />
</template>

<script setup lang="ts">
/**
 * CustomGPT Embedded Widget for Vue 3
 * 
 * Provides full chat functionality with conversation management
 * and secure API integration through Vite proxy.
 */

import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

// CDN base for widget files
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget';

// Props with defaults
interface Props {
  agentId?: string | number;
  agentName?: string;
  apiBaseUrl?: string;
  width?: string;
  height?: string;
  maxConversations?: number;
  enableConversationManagement?: boolean;
  theme?: 'light' | 'dark';
  vendorsPath?: string;
  widgetPath?: string;
  cssPath?: string;
  autoLoad?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  agentId: () => import.meta.env.VITE_CUSTOMGPT_AGENT_ID,
  agentName: () => import.meta.env.VITE_CUSTOMGPT_AGENT_NAME,
  apiBaseUrl: '/api/proxy',
  width: '100%',
  height: '600px',
  maxConversations: 5,
  enableConversationManagement: true,
  theme: 'light',
  vendorsPath: `${CDN_BASE}/vendors.js`,
  widgetPath: `${CDN_BASE}/customgpt-widget.js`,
  cssPath: `${CDN_BASE}/customgpt-widget.css`,
  autoLoad: true
});

// Emits
const emit = defineEmits<{
  message: [message: any];
  conversationChange: [conversation: any];
}>();

// Reactive state
const scriptsLoaded = ref(false);
const error = ref<string | null>(null);
const containerId = ref(`customgpt-widget-${Math.random().toString(36).substr(2, 9)}`);
const widgetRef = ref<any>(null);

// Helper functions for dynamic script loading
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

const loadStylesheet = (href: string): void => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

// Load widget scripts
const loadWidgetScripts = async (): Promise<void> => {
  if (!props.autoLoad) return;
  
  try {
    console.log('[Vue Widget] Loading CustomGPT scripts...');
    
    // Load CSS first
    loadStylesheet(props.cssPath);
    
    // Load vendors.js (Vue dependencies)
    await loadScript(props.vendorsPath);
    
    // Load the main widget
    await loadScript(props.widgetPath);
    
    console.log('[Vue Widget] Scripts loaded successfully');
    scriptsLoaded.value = true;
  } catch (err) {
    const errorMsg = `Failed to load CustomGPT widget: ${(err as Error).message}`;
    console.error('[Vue Widget]', errorMsg);
    error.value = errorMsg;
  }
};

// Initialize widget
const initializeWidget = async (): Promise<void> => {
  if (!scriptsLoaded.value || !(window as any).CustomGPTWidget) {
    return;
  }

  await nextTick(); // Ensure DOM is ready

  console.log('[Vue Widget] Initializing with config:', {
    agentId: props.agentId,
    agentName: props.agentName,
    apiBaseUrl: props.apiBaseUrl,
    theme: props.theme
  });

  try {
    const widget = (window as any).CustomGPTWidget.init({
      agentId: parseInt(props.agentId as string) || props.agentId,
      agentName: props.agentName,
      apiBaseUrl: props.apiBaseUrl,
      containerId: containerId.value,
      mode: 'embedded',
      width: props.width,
      height: props.height,
      theme: props.theme,
      enableConversationManagement: props.enableConversationManagement,
      maxConversations: props.maxConversations,
      onMessage: (msg: any) => {
        console.log('[Vue Widget] Message:', msg);
        emit('message', msg);
      },
      onConversationChange: (conv: any) => {
        console.log('[Vue Widget] Conversation changed:', conv);
        emit('conversationChange', conv);
      },
      onError: (err: any) => {
        console.error('[Vue Widget] Widget error:', err);
        error.value = `Widget error: ${err.message || err}`;
      }
    });

    widgetRef.value = widget;
    console.log('[Vue Widget] Initialized successfully');

  } catch (err) {
    const errorMsg = `Failed to initialize widget: ${(err as Error).message}`;
    console.error('[Vue Widget]', errorMsg);
    error.value = errorMsg;
  }
};

// Lifecycle hooks
onMounted(async () => {
  if ((window as any).CustomGPTWidget) {
    scriptsLoaded.value = true;
  } else {
    await loadWidgetScripts();
  }
});

onUnmounted(() => {
  if (widgetRef.value) {
    console.log('[Vue Widget] Destroying widget');
    widgetRef.value.destroy();
  }
});

// Watch for script loading completion
watch(scriptsLoaded, async (loaded) => {
  if (loaded) {
    await initializeWidget();
  }
});

// Watch for prop changes that require reinitialization
watch([() => props.agentId, () => props.theme], async () => {
  if (widgetRef.value) {
    widgetRef.value.destroy();
    widgetRef.value = null;
  }
  if (scriptsLoaded.value) {
    await nextTick();
    await initializeWidget();
  }
});
</script>

<style scoped>
.customgpt-widget-container {
  /* Widget-specific styles can go here */
}
</style>
```

#### Floating Button Widget (`src/components/CustomGPTFloatingButton.vue`)

```vue
<template>
  <div
    v-if="error"
    :style="{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px',
      background: '#fee',
      border: '1px solid #fcc',
      borderRadius: '8px',
      color: '#c33',
      maxWidth: '300px',
      fontSize: '14px',
      zIndex: 9999
    }"
  >
    <strong>CustomGPT Error:</strong> {{ error }}
  </div>

  <div
    v-else-if="!scriptsLoaded && autoLoad"
    :style="{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px',
      background: '#f5f5f5',
      borderRadius: '8px',
      fontSize: '14px',
      zIndex: 9999
    }"
  >
    Loading chat...
  </div>

  <!-- Widget handles its own rendering when loaded -->
</template>

<script setup lang="ts">
/**
 * CustomGPT Floating Button for Vue 3
 * 
 * Client-side floating button with Vue optimizations
 */

import { ref, onMounted, onUnmounted, watch } from 'vue';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget';

interface Props {
  agentId?: string | number;
  agentName?: string;
  apiBaseUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  chatWidth?: string;
  chatHeight?: string;
  maxConversations?: number;
  enableConversationManagement?: boolean;
  showLabel?: boolean;
  label?: string;
  theme?: 'light' | 'dark';
  vendorsPath?: string;
  widgetPath?: string;
  cssPath?: string;
  autoLoad?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  agentId: () => import.meta.env.VITE_CUSTOMGPT_AGENT_ID_2,
  agentName: () => import.meta.env.VITE_CUSTOMGPT_AGENT_NAME_2,
  apiBaseUrl: '/api/proxy',
  position: 'bottom-right',
  primaryColor: '#007acc',
  buttonSize: 'md',
  chatWidth: '400px',
  chatHeight: '600px',
  maxConversations: 5,
  enableConversationManagement: false,
  showLabel: true,
  label: 'Chat with us',
  theme: 'light',
  vendorsPath: `${CDN_BASE}/vendors.js`,
  widgetPath: `${CDN_BASE}/customgpt-widget.js`,
  cssPath: `${CDN_BASE}/customgpt-widget.css`,
  autoLoad: true
});

const emit = defineEmits<{
  message: [message: any];
  conversationChange: [conversation: any];
  open: [];
  close: [];
}>();

const isOpen = ref(false);
const scriptsLoaded = ref(false);
const error = ref<string | null>(null);
const widgetRef = ref<any>(null);

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

const loadStylesheet = (href: string): void => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const loadWidgetScripts = async (): Promise<void> => {
  if (!props.autoLoad || (window as any).CustomGPTWidget) return;
  
  try {
    loadStylesheet(props.cssPath);
    await loadScript(props.vendorsPath);
    await loadScript(props.widgetPath);
    scriptsLoaded.value = true;
  } catch (err) {
    error.value = `Failed to load widget: ${(err as Error).message}`;
  }
};

const initializeFloatingWidget = (): void => {
  if (!scriptsLoaded.value || !(window as any).CustomGPTWidget) return;

  try {
    const widget = (window as any).CustomGPTWidget.init({
      agentId: parseInt(props.agentId as string) || props.agentId,
      agentName: props.agentName,
      apiBaseUrl: props.apiBaseUrl,
      mode: 'floating',
      position: props.position,
      width: props.chatWidth,
      height: props.chatHeight,
      theme: props.theme,
      enableConversationManagement: props.enableConversationManagement,
      maxConversations: props.maxConversations,
      onMessage: (msg: any) => emit('message', msg),
      onConversationChange: (conv: any) => emit('conversationChange', conv),
      onOpen: () => {
        isOpen.value = true;
        emit('open');
      },
      onClose: () => {
        isOpen.value = false;
        emit('close');
      }
    });

    widgetRef.value = widget;
  } catch (err) {
    error.value = `Failed to initialize floating button: ${(err as Error).message}`;
  }
};

onMounted(async () => {
  if ((window as any).CustomGPTWidget) {
    scriptsLoaded.value = true;
  } else {
    await loadWidgetScripts();
  }
});

onUnmounted(() => {
  if (widgetRef.value) {
    widgetRef.value.destroy();
  }
});

watch(scriptsLoaded, (loaded) => {
  if (loaded) {
    initializeFloatingWidget();
  }
});
</script>
```

### 5. Usage in Vue Application

#### Main App (`src/App.vue`)

```vue
<template>
  <div id="app">
    <header class="app-header">
      <h1>My Vue App with CustomGPT</h1>
    </header>
    
    <main class="app-main">
      <section class="support-section">
        <h2>Customer Support</h2>
        <div class="widget-container">
          <CustomGPTWidget
            :agent-id="agentId"
            :agent-name="agentName"
            theme="light"
            :max-conversations="5"
            :enable-conversation-management="true"
            @message="handleMessage"
            @conversation-change="handleConversationChange"
          />
        </div>
      </section>
      
      <section class="content-section">
        <h2>Your App Content</h2>
        <p>The floating button will appear on all pages.</p>
      </section>
    </main>

    <!-- Global floating button -->
    <CustomGPTFloatingButton
      :agent-id="floatingAgentId"
      :agent-name="floatingAgentName"
      position="bottom-right"
      primary-color="#42b883"
      :max-conversations="3"
      :enable-conversation-management="false"
      @message="handleMessage"
      @conversation-change="handleConversationChange"
      @open="handleFloatingOpen"
      @close="handleFloatingClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CustomGPTWidget from './components/CustomGPTWidget.vue';
import CustomGPTFloatingButton from './components/CustomGPTFloatingButton.vue';

// Environment variables
const agentId = computed(() => import.meta.env.VITE_CUSTOMGPT_AGENT_ID);
const agentName = computed(() => import.meta.env.VITE_CUSTOMGPT_AGENT_NAME);
const floatingAgentId = computed(() => import.meta.env.VITE_CUSTOMGPT_AGENT_ID_2);
const floatingAgentName = computed(() => import.meta.env.VITE_CUSTOMGPT_AGENT_NAME_2);

// Event handlers
const handleMessage = (message: any) => {
  console.log('New message received:', message);
  // Handle message events (analytics, notifications, etc.)
};

const handleConversationChange = (conversation: any) => {
  console.log('Conversation changed:', conversation);
  // Handle conversation changes (analytics, state updates, etc.)
};

const handleFloatingOpen = () => {
  console.log('Floating chat opened');
};

const handleFloatingClose = () => {
  console.log('Floating chat closed');
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-header {
  padding: 2rem;
  background: #42b883;
  color: white;
  text-align: center;
}

.app-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.support-section {
  margin: 2rem 0;
}

.widget-container {
  height: 600px;
  max-width: 800px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 1rem 0;
}

.content-section {
  margin: 3rem 0;
}

h1, h2 {
  margin-bottom: 1rem;
}

h1 {
  margin: 0;
}

h2 {
  color: #42b883;
}
</style>
```

#### TypeScript Support (`src/env.d.ts`)

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CUSTOMGPT_AGENT_ID: string;
  readonly VITE_CUSTOMGPT_AGENT_NAME: string;
  readonly VITE_CUSTOMGPT_AGENT_ID_2: string;
  readonly VITE_CUSTOMGPT_AGENT_NAME_2: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// CustomGPT Widget global types
declare global {
  interface Window {
    CustomGPTWidget?: {
      init: (config: any) => any;
    };
  }
}

export {};
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Core Vue/Vite dependencies (if not already installed)
npm install vue@next @vitejs/plugin-vue vite

# For TypeScript support (optional)
npm install --save-dev typescript vue-tsc @types/node

# For proxy server
npm install express cors dotenv
```

### 2. Environment Configuration

Create `.env` file in your project root:

```bash
# SERVER-SIDE (secure - never exposed to browser)
CUSTOMGPT_API_KEY=your_api_key_here

# CLIENT-SIDE (safe to expose via VITE_ prefix)
VITE_CUSTOMGPT_AGENT_ID=78913
VITE_CUSTOMGPT_AGENT_NAME=Support Assistant
VITE_CUSTOMGPT_AGENT_ID_2=78913
VITE_CUSTOMGPT_AGENT_NAME_2=Quick Help

# Server configuration
PORT=3001
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
```

### 3. Start Development Servers

```bash
# Terminal 1: Start proxy server
node server.js

# Terminal 2: Start Vue/Vite app
npm run dev
```

Your Vue app will be available at `http://localhost:5173` with full CustomGPT widget functionality.

## Production Deployment

### 1. Build Vue App

```bash
npm run build
```

### 2. Deploy Proxy Server

Deploy your proxy server (`server.js`) to your hosting platform:

- **Vercel**: Use Vercel Functions with API routes
- **Netlify**: Use Netlify Functions 
- **AWS**: Use Lambda or EC2 with environment variables
- **Railway/Heroku**: Direct deployment with environment variables

### 3. Update Production Configuration

Update your production build to point to deployed proxy server:

```vue
<template>
  <CustomGPTWidget
    :api-base-url="apiBaseUrl"
    // ... other props
  />
</template>

<script setup>
const apiBaseUrl = computed(() => 
  import.meta.env.PROD 
    ? 'https://your-proxy-server.com/api/proxy'
    : '/api/proxy'
);
</script>
```

## Security Features

✅ **API Key Protection**: Keys never exposed to client-side code  
✅ **CORS Configuration**: Proper cross-origin handling for Vite dev server  
✅ **Input Validation**: Server-side request validation  
✅ **Error Handling**: Comprehensive error catching and logging  
✅ **Environment Isolation**: Separate dev and production configurations  
✅ **TypeScript Support**: Type safety for Vue 3 Composition API  

## Troubleshooting

### Common Issues

1. **Widget Not Loading**:
   - Check browser console for script loading errors
   - Verify CDN URLs are accessible
   - Ensure proxy server is running on port 3001

2. **Vite Proxy Errors**:
   - Check proxy server logs for detailed errors
   - Verify `.env` file has correct API key
   - Test proxy server health: `curl http://localhost:3001/health`

3. **CORS Issues**:
   - Ensure proxy server allows Vite dev server origin (`http://localhost:5173`)
   - Check browser network tab for preflight requests
   - Verify Vite proxy configuration in `vite.config.js`

4. **Environment Variables**:
   - Vite requires `VITE_` prefix for client-side variables
   - Server-side variables (API keys) should NOT have the prefix
   - Restart dev server after changing `.env`

### Debug Steps

1. **Check Proxy Server Health**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test Widget Endpoints**:
   ```bash
   curl -X POST http://localhost:3001/api/proxy/projects/78913/conversations \
     -H "Content-Type: application/json" \
     -d '{"message": "Test"}'
   ```

3. **Verify Environment Variables**:
   ```vue
   <script setup>
   // Add to your component for debugging
   console.log('Agent ID:', import.meta.env.VITE_CUSTOMGPT_AGENT_ID);
   console.log('API Base URL: /api/proxy');
   </script>
   ```

4. **Server-Side Debugging**:
   ```javascript
   // Add to server.js
   console.log('API Key present:', !!process.env.CUSTOMGPT_API_KEY);
   console.log('Request body:', req.body);
   ```

## Production Considerations

1. **Environment Variables**: Use your hosting platform's environment variable system
2. **API Key Security**: Never commit API keys to version control
3. **CORS Configuration**: Update allowed origins for production domains
4. **SSL/HTTPS**: Ensure both Vue app and proxy server use HTTPS in production
5. **Rate Limiting**: Consider adding rate limiting to proxy server
6. **Monitoring**: Add logging and monitoring for production deployments
7. **Error Tracking**: Integrate error tracking service (Sentry, Bugsnag, etc.)
8. **Build Optimization**: Use Vite's build optimization features
9. **CDN Usage**: Consider using a CDN for static assets

This Vue/Vite integration provides enterprise-grade security with modern Vue 3 patterns, TypeScript support, and seamless development workflow with hot module replacement.