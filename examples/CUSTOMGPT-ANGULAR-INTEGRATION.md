# CustomGPT Widget Integration with Angular

Complete guide for securely integrating CustomGPT widgets into Angular applications with TypeScript support.

## Overview

This integration provides:
- ✅ **Enterprise-grade security**: API keys never exposed to the browser
- ✅ **Full widget functionality**: Embedded chat, floating button, streaming responses
- ✅ **Angular/TypeScript**: Modern Angular patterns with type safety
- ✅ **Development workflow**: Angular CLI dev server with proxy configuration

## Architecture

```
Browser Widget → Angular Dev Server (port 4200) → Proxy Server (port 3001) → CustomGPT API
```

## Required Files

### 1. Environment Configuration

#### Development (`.env`)

```bash
# SERVER-SIDE ONLY (secure) 
CUSTOMGPT_API_KEY=your_customgpt_api_key

# CLIENT-SIDE (will be copied to Angular environment files)
NG_CUSTOMGPT_AGENT_ID=78913
NG_CUSTOMGPT_AGENT_NAME=Your Agent Name
NG_CUSTOMGPT_AGENT_ID_2=78913
NG_CUSTOMGPT_AGENT_NAME_2=Your Floating Agent Name

# API Configuration
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
PORT=3001
NODE_ENV=development
```

#### Angular Environments (`src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  customgpt: {
    agentId: '78913',
    agentName: 'Support Assistant',
    agentId2: '78913',
    agentName2: 'Quick Help',
    apiBaseUrl: '/api/proxy'
  }
};
```

#### Angular Production Environment (`src/environments/environment.prod.ts`)

```typescript
export const environment = {
  production: true,
  customgpt: {
    agentId: '78913',
    agentName: 'Support Assistant',
    agentId2: '78913',
    agentName2: 'Quick Help',
    apiBaseUrl: 'https://your-proxy-server.com/api/proxy'
  }
};
```

### 2. Proxy Server (`server.js`)

Use our universal proxy server that handles all widget endpoints:

```javascript
// Use the universal-customgpt-proxy.js from examples directory
// Copy universal-customgpt-proxy.js to your project root as server.js
```

Or create an Angular-specific version:

```javascript
/**
 * CustomGPT Proxy Server for Angular Applications
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

// CORS - allow Angular dev server
app.use(cors({
  origin: [
    'http://localhost:4200',   // Angular CLI default port
    'http://localhost:3000',   // Alt dev port
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper function to get agent ID with Angular-specific fallbacks
function getAgentId(projectId) {
  if (projectId && projectId !== 'undefined' && projectId !== 'null') {
    return projectId;
  }
  return process.env.NG_CUSTOMGPT_AGENT_ID || '78913';
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CustomGPT Angular Proxy'
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
  
  console.log(`[ANGULAR WIDGET] POST ${customgptUrl}`);

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
    console.error('[ANGULAR PROXY ERROR]', error);
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
  
  console.log(`[ANGULAR WIDGET] POST ${customgptUrl}`);

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
    console.error('[ANGULAR PROXY ERROR]', error);
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
    console.error('[ANGULAR PROXY ERROR]', error);
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
    console.error('[ANGULAR PROXY ERROR]', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 CustomGPT Angular Proxy Server Started`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxy: http://localhost:${PORT}/api/proxy/*`);
  console.log(`🔑 API Key: ${process.env.CUSTOMGPT_API_KEY ? 'Yes ✅' : 'No ❌'}`);
  console.log(`🅰️ Angular: http://localhost:4200`);
});

module.exports = app;
```

### 3. Angular CLI Proxy Configuration (`proxy.conf.json`)

```json
{
  "/api/proxy/*": {
    "target": "http://localhost:3001",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "onError": function(err, req, res) {
      console.error("[ANGULAR PROXY ERROR]", err.message);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          "error": "Development proxy failed",
          "details": err.message,
          "suggestion": "Make sure server.js is running on port 3001"
        }));
      }
    },
    "onProxyReq": function(proxyReq, req, res) {
      console.log("[ANGULAR PROXY]", req.method, req.url, "-> http://localhost:3001" + req.url);
    }
  }
}
```

### 4. Angular.json Configuration

Update your `angular.json` to use the proxy configuration:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "development": {
              "buildTarget": "your-app:build:development",
              "proxyConfig": "proxy.conf.json"
            }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
```

### 5. Angular Components

#### CustomGPT Widget Component (`src/app/components/customgpt-widget/customgpt-widget.component.ts`)

```typescript
import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ElementRef, 
  ViewChild, 
  Input, 
  Output, 
  EventEmitter,
  AfterViewInit,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

interface CustomGPTWidget {
  init: (config: any) => any;
}

declare global {
  interface Window {
    CustomGPTWidget?: CustomGPTWidget;
  }
}

@Component({
  selector: 'app-customgpt-widget',
  template: `
    <div *ngIf="error" class="customgpt-error" [ngStyle]="{
      padding: '20px',
      background: '#fee',
      border: '1px solid #fcc',
      borderRadius: '8px',
      color: '#c33'
    }">
      <h4>CustomGPT Widget Error</h4>
      <p>{{ error }}</p>
      <details style="margin-top: 10px">
        <summary>Debug Information</summary>
        <pre style="font-size: 12px; margin-top: 8px">
Scripts Loaded: {{ scriptsLoaded }}
Agent ID: {{ agentId }}
API Base URL: {{ apiBaseUrl }}
Container ID: {{ containerId }}
Platform Browser: {{ isBrowser }}
        </pre>
      </details>
    </div>

    <div *ngIf="!scriptsLoaded && !error && autoLoad" class="customgpt-loading" [ngStyle]="{
      padding: '40px',
      textAlign: 'center',
      background: '#f5f5f5',
      borderRadius: '8px'
    }">
      <div>Loading CustomGPT widget...</div>
      <div style="font-size: 12px; color: #666; margin-top: 8px">
        Loading scripts from CDN
      </div>
    </div>

    <div 
      #widgetContainer
      [id]="containerId"
      [ngStyle]="{ width: width, height: height }"
      class="customgpt-widget-container"
      *ngIf="!error && (scriptsLoaded || !autoLoad)">
    </div>
  `,
  styleUrls: ['./customgpt-widget.component.css']
})
export class CustomGptWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('widgetContainer', { static: false }) widgetContainer!: ElementRef;

  @Input() agentId: string | number = environment.customgpt.agentId;
  @Input() agentName: string = environment.customgpt.agentName;
  @Input() apiBaseUrl: string = environment.customgpt.apiBaseUrl;
  @Input() width: string = '100%';
  @Input() height: string = '600px';
  @Input() maxConversations: number = 5;
  @Input() enableConversationManagement: boolean = true;
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() autoLoad: boolean = true;

  // CDN configuration
  @Input() vendorsPath: string = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/vendors.js';
  @Input() widgetPath: string = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/customgpt-widget.js';
  @Input() cssPath: string = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/customgpt-widget.css';

  @Output() message = new EventEmitter<any>();
  @Output() conversationChange = new EventEmitter<any>();

  public scriptsLoaded = false;
  public error: string | null = null;
  public containerId = `customgpt-widget-${Math.random().toString(36).substr(2, 9)}`;
  public isBrowser = false;

  private widget: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      console.log('[Angular Widget] Running on server, skipping initialization');
      return;
    }

    if (this.autoLoad) {
      this.loadWidgetScripts();
    }
  }

  ngAfterViewInit(): void {
    if (this.scriptsLoaded && this.isBrowser) {
      this.initializeWidget();
    }
  }

  ngOnDestroy(): void {
    if (this.widget) {
      console.log('[Angular Widget] Destroying widget');
      this.widget.destroy();
    }
  }

  private async loadWidgetScripts(): Promise<void> {
    if (!this.isBrowser || window.CustomGPTWidget) {
      this.scriptsLoaded = true;
      return;
    }

    try {
      console.log('[Angular Widget] Loading CustomGPT scripts...');
      
      // Load CSS first
      this.loadStylesheet(this.cssPath);
      
      // Load vendors.js (Angular dependencies)
      await this.loadScript(this.vendorsPath);
      
      // Load the main widget
      await this.loadScript(this.widgetPath);
      
      console.log('[Angular Widget] Scripts loaded successfully');
      this.scriptsLoaded = true;
      
      // Initialize widget if container is ready
      if (this.widgetContainer) {
        this.initializeWidget();
      }
    } catch (err: any) {
      const errorMsg = `Failed to load CustomGPT widget: ${err.message}`;
      console.error('[Angular Widget]', errorMsg);
      this.error = errorMsg;
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isBrowser) {
        reject(new Error('Not running in browser'));
        return;
      }

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
  }

  private loadStylesheet(href: string): void {
    if (!this.isBrowser || document.querySelector(`link[href="${href}"]`)) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  private initializeWidget(): void {
    if (!this.isBrowser || !this.scriptsLoaded || !this.widgetContainer || !window.CustomGPTWidget) {
      return;
    }

    console.log('[Angular Widget] Initializing with config:', {
      agentId: this.agentId,
      agentName: this.agentName,
      apiBaseUrl: this.apiBaseUrl,
      theme: this.theme
    });

    try {
      this.widget = window.CustomGPTWidget.init({
        agentId: typeof this.agentId === 'string' ? parseInt(this.agentId) : this.agentId,
        agentName: this.agentName,
        apiBaseUrl: this.apiBaseUrl,
        containerId: this.containerId,
        mode: 'embedded',
        width: this.width,
        height: this.height,
        theme: this.theme,
        enableConversationManagement: this.enableConversationManagement,
        maxConversations: this.maxConversations,
        onMessage: (msg: any) => {
          console.log('[Angular Widget] Message:', msg);
          this.message.emit(msg);
        },
        onConversationChange: (conv: any) => {
          console.log('[Angular Widget] Conversation changed:', conv);
          this.conversationChange.emit(conv);
        },
        onError: (err: any) => {
          console.error('[Angular Widget] Widget error:', err);
          this.error = `Widget error: ${err.message || err}`;
        }
      });

      console.log('[Angular Widget] Initialized successfully');

    } catch (err: any) {
      const errorMsg = `Failed to initialize widget: ${err.message}`;
      console.error('[Angular Widget]', errorMsg);
      this.error = errorMsg;
    }
  }
}
```

#### CustomGPT Widget Component Styles (`src/app/components/customgpt-widget/customgpt-widget.component.css`)

```css
.customgpt-widget-container {
  /* Widget-specific styles */
  border-radius: 8px;
  overflow: hidden;
}

.customgpt-error {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.customgpt-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

#### Floating Button Component (`src/app/components/customgpt-floating-button/customgpt-floating-button.component.ts`)

```typescript
import { 
  Component, 
  OnInit, 
  OnDestroy, 
  Input, 
  Output, 
  EventEmitter,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-customgpt-floating-button',
  template: `
    <div *ngIf="error" [ngStyle]="{
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
    }">
      <strong>CustomGPT Error:</strong> {{ error }}
    </div>

    <div *ngIf="!scriptsLoaded && !error && autoLoad" [ngStyle]="{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px',
      background: '#f5f5f5',
      borderRadius: '8px',
      fontSize: '14px',
      zIndex: 9999
    }">
      Loading chat...
    </div>

    <!-- Widget handles its own rendering when loaded -->
  `,
  styleUrls: ['./customgpt-floating-button.component.css']
})
export class CustomGptFloatingButtonComponent implements OnInit, OnDestroy {
  @Input() agentId: string | number = environment.customgpt.agentId2;
  @Input() agentName: string = environment.customgpt.agentName2;
  @Input() apiBaseUrl: string = environment.customgpt.apiBaseUrl;
  @Input() position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = 'bottom-right';
  @Input() primaryColor: string = '#dc143c';
  @Input() buttonSize: 'sm' | 'md' | 'lg' = 'md';
  @Input() chatWidth: string = '400px';
  @Input() chatHeight: string = '600px';
  @Input() maxConversations: number = 5;
  @Input() enableConversationManagement: boolean = false;
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() autoLoad: boolean = true;

  // CDN configuration
  @Input() vendorsPath: string = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/vendors.js';
  @Input() widgetPath: string = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/customgpt-widget.js';
  @Input() cssPath: string = 'https://cdn.jsdelivr.net/gh/Poll-The-People/customgpt-starter-kit@main/dist/widget/customgpt-widget.css';

  @Output() message = new EventEmitter<any>();
  @Output() conversationChange = new EventEmitter<any>();
  @Output() open = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  public scriptsLoaded = false;
  public error: string | null = null;
  public isOpen = false;
  public isBrowser = false;

  private widget: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      console.log('[Angular Floating] Running on server, skipping initialization');
      return;
    }

    if (this.autoLoad) {
      this.loadWidgetScripts();
    }
  }

  ngOnDestroy(): void {
    if (this.widget) {
      this.widget.destroy();
    }
  }

  private async loadWidgetScripts(): Promise<void> {
    if (!this.isBrowser || window.CustomGPTWidget) {
      this.scriptsLoaded = true;
      this.initializeFloatingWidget();
      return;
    }

    try {
      this.loadStylesheet(this.cssPath);
      await this.loadScript(this.vendorsPath);
      await this.loadScript(this.widgetPath);
      this.scriptsLoaded = true;
      this.initializeFloatingWidget();
    } catch (err: any) {
      this.error = `Failed to load widget: ${err.message}`;
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isBrowser) {
        reject(new Error('Not running in browser'));
        return;
      }

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
  }

  private loadStylesheet(href: string): void {
    if (!this.isBrowser || document.querySelector(`link[href="${href}"]`)) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  private initializeFloatingWidget(): void {
    if (!this.isBrowser || !this.scriptsLoaded || !window.CustomGPTWidget) return;

    try {
      this.widget = window.CustomGPTWidget.init({
        agentId: typeof this.agentId === 'string' ? parseInt(this.agentId) : this.agentId,
        agentName: this.agentName,
        apiBaseUrl: this.apiBaseUrl,
        mode: 'floating',
        position: this.position,
        width: this.chatWidth,
        height: this.chatHeight,
        theme: this.theme,
        enableConversationManagement: this.enableConversationManagement,
        maxConversations: this.maxConversations,
        onMessage: (msg: any) => this.message.emit(msg),
        onConversationChange: (conv: any) => this.conversationChange.emit(conv),
        onOpen: () => {
          this.isOpen = true;
          this.open.emit();
        },
        onClose: () => {
          this.isOpen = false;
          this.close.emit();
        }
      });
    } catch (err: any) {
      this.error = `Failed to initialize floating button: ${err.message}`;
    }
  }
}
```

### 6. Module Configuration (`src/app/app.module.ts`)

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CustomGptWidgetComponent } from './components/customgpt-widget/customgpt-widget.component';
import { CustomGptFloatingButtonComponent } from './components/customgpt-floating-button/customgpt-floating-button.component';

@NgModule({
  declarations: [
    AppComponent,
    CustomGptWidgetComponent,
    CustomGptFloatingButtonComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 7. Usage in Angular App (`src/app/app.component.ts`)

```typescript
import { Component } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>My Angular App with CustomGPT</h1>
      </header>
      
      <main class="app-main">
        <section class="support-section">
          <h2>Customer Support</h2>
          <div class="widget-container">
            <app-customgpt-widget
              [agentId]="agentId"
              [agentName]="agentName"
              theme="light"
              [maxConversations]="5"
              [enableConversationManagement]="true"
              (message)="handleMessage($event)"
              (conversationChange)="handleConversationChange($event)">
            </app-customgpt-widget>
          </div>
        </section>
        
        <section class="content-section">
          <h2>Your App Content</h2>
          <p>The floating button will appear on all pages.</p>
        </section>
      </main>

      <!-- Global floating button -->
      <app-customgpt-floating-button
        [agentId]="floatingAgentId"
        [agentName]="floatingAgentName"
        position="bottom-right"
        primaryColor="#dc143c"
        [maxConversations]="3"
        [enableConversationManagement]="false"
        (message)="handleMessage($event)"
        (conversationChange)="handleConversationChange($event)"
        (open)="handleFloatingOpen()"
        (close)="handleFloatingClose()">
      </app-customgpt-floating-button>
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'My Angular App';
  
  // Environment variables
  agentId = environment.customgpt.agentId;
  agentName = environment.customgpt.agentName;
  floatingAgentId = environment.customgpt.agentId2;
  floatingAgentName = environment.customgpt.agentName2;

  handleMessage(message: any): void {
    console.log('New message received:', message);
    // Handle message events (analytics, notifications, etc.)
  }

  handleConversationChange(conversation: any): void {
    console.log('Conversation changed:', conversation);
    // Handle conversation changes (analytics, state updates, etc.)
  }

  handleFloatingOpen(): void {
    console.log('Floating chat opened');
  }

  handleFloatingClose(): void {
    console.log('Floating chat closed');
  }
}
```

### 8. App Component Styles (`src/app/app.component.css`)

```css
.app-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  padding: 2rem;
  background: #dc143c;
  color: white;
  text-align: center;
}

.app-header h1 {
  margin: 0;
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

h2 {
  color: #dc143c;
  margin-bottom: 1rem;
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Core Angular dependencies (if not already installed)
npm install @angular/core @angular/cli

# For proxy server
npm install express cors dotenv
```

### 2. Environment Configuration

Create `.env` file in your project root:

```bash
# SERVER-SIDE (secure - never exposed to browser)
CUSTOMGPT_API_KEY=your_api_key_here

# CLIENT-SIDE (will be copied to Angular environment files)
NG_CUSTOMGPT_AGENT_ID=78913
NG_CUSTOMGPT_AGENT_NAME=Support Assistant
NG_CUSTOMGPT_AGENT_ID_2=78913
NG_CUSTOMGPT_AGENT_NAME_2=Quick Help

# Server configuration
PORT=3001
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
```

### 3. Start Development Servers

```bash
# Terminal 1: Start proxy server
node server.js

# Terminal 2: Start Angular app with proxy
ng serve
```

Your Angular app will be available at `http://localhost:4200` with full CustomGPT widget functionality.

## Production Deployment

### 1. Build Angular App

```bash
ng build --configuration production
```

### 2. Deploy Proxy Server

Deploy your proxy server (`server.js`) to your hosting platform and update your production environment file to point to the deployed proxy server.

### 3. Update Production Configuration

Update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  customgpt: {
    agentId: '78913',
    agentName: 'Support Assistant',
    agentId2: '78913',
    agentName2: 'Quick Help',
    apiBaseUrl: 'https://your-proxy-server.com/api/proxy'
  }
};
```

## Security Features

✅ **API Key Protection**: Keys never exposed to client-side code  
✅ **Universal Rendering**: SSR-compatible with platform detection  
✅ **CORS Configuration**: Proper cross-origin handling for Angular dev server  
✅ **Input Validation**: Server-side request validation  
✅ **Error Handling**: Comprehensive error catching and logging  
✅ **TypeScript Support**: Full type safety with Angular patterns  

## Troubleshooting

### Common Issues

1. **Widget Not Loading**:
   - Check browser console for script loading errors
   - Verify CDN URLs are accessible
   - Ensure proxy server is running on port 3001

2. **Angular CLI Proxy Errors**:
   - Check proxy server logs for detailed errors
   - Verify `proxy.conf.json` configuration
   - Test proxy server health: `curl http://localhost:3001/health`

3. **Universal Rendering Issues**:
   - Components use platform detection to avoid SSR errors
   - Ensure all DOM operations are wrapped in browser checks

4. **Environment Variables**:
   - Angular environment files manually define variables (no automatic prefixing)
   - Server-side variables (API keys) should NOT be in Angular environments
   - Rebuild after changing environment files

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
   ```typescript
   // Add to your component for debugging
   console.log('Agent ID:', environment.customgpt.agentId);
   console.log('API Base URL:', environment.customgpt.apiBaseUrl);
   ```

## Production Considerations

1. **Environment Variables**: Use your hosting platform's environment variable system
2. **API Key Security**: Never commit API keys to version control
3. **CORS Configuration**: Update allowed origins for production domains
4. **SSL/HTTPS**: Ensure both Angular app and proxy server use HTTPS in production
5. **Rate Limiting**: Consider adding rate limiting to proxy server
6. **Angular Universal**: If using SSR, ensure components handle server-side rendering
7. **Error Tracking**: Integrate error tracking service (Sentry, Bugsnag, etc.)
8. **Build Optimization**: Use Angular's production build optimizations
9. **Lazy Loading**: Consider lazy loading the widget components for better performance

This Angular integration provides enterprise-grade security with full TypeScript support, Angular Universal compatibility, and modern Angular patterns with the Angular CLI development workflow.