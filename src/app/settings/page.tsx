/**
 * Settings Page
 * 
 * Application settings management interface for CustomGPT UI.
 * Now focuses on theme settings and server configuration info.
 * 
 * Features:
 * - Theme selection (light/dark)
 * - Server configuration status
 * - Security information
 * - Application info
 * 
 * Security Note:
 * - API key is now stored on server only
 * - No client-side API key management
 * - Server handles all authentication
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Sun,
  Moon,
  Shield,
  Server,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

import { useConfigStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';

/**
 * Settings Page Component
 * 
 * Settings interface for theme and viewing server status
 */
export default function SettingsPage() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'configured' | 'not-configured'>('checking');
  const { theme, setTheme } = useConfigStore();

  // Check server configuration status
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('/api/proxy/projects');
        if (response.ok) {
          setServerStatus('configured');
        } else {
          setServerStatus('not-configured');
        }
      } catch (error) {
        setServerStatus('not-configured');
      }
    };
    
    checkServerStatus();
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme} mode`);
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your application preferences and configuration
          </p>
        </div>

        {/* Server Configuration Status */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Server className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Server Configuration
              </h2>
              
              {serverStatus === 'checking' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Checking server configuration...
                </div>
              )}
              
              {serverStatus === 'configured' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Server configured successfully</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your server is properly configured with the CustomGPT API key.
                    All API requests are securely proxied through your server.
                  </p>
                </div>
              )}
              
              {serverStatus === 'not-configured' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Server configuration required</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please configure your server with the CustomGPT API key.
                    See the setup instructions for details.
                  </p>
                  <div className="bg-muted rounded-lg p-4 mt-3">
                    <h4 className="font-medium text-foreground mb-2">Quick Setup:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1">
                      <li>1. Copy <code className="bg-secondary px-1 rounded">.env.example</code> to <code className="bg-secondary px-1 rounded">.env.local</code></li>
                      <li>2. Add your API key: <code className="bg-secondary px-1 rounded">CUSTOMGPT_API_KEY=your_key</code></li>
                      <li>3. Restart the development server</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="p-6 mb-6 bg-card text-card-foreground border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent rounded-lg">
              {theme === 'light' ? (
                <Sun className="w-6 h-6 text-accent-foreground" />
              ) : (
                <Moon className="w-6 h-6 text-accent-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Appearance
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Choose your preferred color theme. Changes apply immediately across the entire application.
              </p>
              
              <div className="flex gap-3 mb-4">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('light')}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Sun className="w-4 h-4" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('dark')}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </Button>
              </div>
              
              {/* Theme preview */}
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-foreground">Theme Preview</h4>
                <div className="flex gap-2 flex-wrap">
                  <div className="w-6 h-6 bg-background border-2 border-border rounded-md" title="Background"></div>
                  <div className="w-6 h-6 bg-primary rounded-md" title="Primary"></div>
                  <div className="w-6 h-6 bg-secondary rounded-md" title="Secondary"></div>
                  <div className="w-6 h-6 bg-accent rounded-md" title="Accent"></div>
                  <div className="w-6 h-6 bg-muted rounded-md" title="Muted"></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently using <strong>{theme}</strong> theme
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Information */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Security
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">API Key Protection</p>
                    <p className="text-sm text-muted-foreground">
                      Your API key is stored securely on the server and never exposed to the browser
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Secure Proxy</p>
                    <p className="text-sm text-muted-foreground">
                      All API requests are proxied through your server for enhanced security
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">No Client Storage</p>
                    <p className="text-sm text-muted-foreground">
                      Sensitive data is never stored in browser localStorage or cookies
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Application Info */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                About
              </h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Version:</span> 1.0.0
                </p>
                <p>
                  <span className="font-medium text-foreground">Environment:</span> {process.env.NODE_ENV}
                </p>
                <p>
                  <span className="font-medium text-foreground">API Endpoint:</span> Proxied through /api/proxy/*
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}