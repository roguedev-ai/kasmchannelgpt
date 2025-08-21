/**
 * Demo Mode Screen Component
 * 
 * Initial screen shown when no deployment mode is selected.
 * Allows users to choose between demo mode or production mode.
 */

'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Key, 
  Shield, 
  Info, 
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Terminal,
  Mic,
  ChevronDown,
  ChevronUp,
  Server,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useDemoStore } from '@/store/demo';
import { useBreakpoint } from '@/hooks/useMediaQuery';

export function DemoModeScreen() {
  const { setApiKey, setOpenAIApiKey, error, setError } = useDemoStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [openAIKeyInput, setOpenAIKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [enableVoice, setEnableVoice] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isMobile } = useBreakpoint();
  
  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      console.log('[DemoModeScreen] Starting demo session');
      
      // Show immediate feedback
      const button = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Starting Demo...';
      }
      
      // Set deployment mode to demo
      localStorage.setItem('customgpt.deploymentMode', 'demo');
      setApiKey(apiKeyInput);
      if (enableVoice && openAIKeyInput.trim()) {
        setOpenAIApiKey(openAIKeyInput);
      }
      
      console.log('[DemoModeScreen] Demo session configured, reloading in 100ms');
      
      // Force reload to ensure clean state
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 100);
    }
  };
  
  const handleProductionMode = () => {
    console.log('[DemoModeScreen] Switching to production mode');
    
    // Show immediate feedback - disable button
    const button = document.querySelector('[data-production-button]') as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = 'Switching...';
    }
    
    // Set deployment mode to production
    localStorage.setItem('customgpt.deploymentMode', 'production');
    console.log('[DemoModeScreen] localStorage set, forcing reload in 100ms');
    
    // Force reliable reload
    setTimeout(() => {
      window.location.href = window.location.href;
    }, 100);
  };
  
  const handleCopyInstructions = () => {
    const instructions = `# CustomGPT.ai UI Setup

# 1. Copy environment template
cp .env.example .env.local

# 2. Configure API keys (server-side, never exposed to browser)
CUSTOMGPT_API_KEY=your_api_key_here       # Required - from CustomGPT.ai
OPENAI_API_KEY=your_openai_key_here       # Optional (for voice)

# 3. Start the application
npm install && npm run dev

# For production deployment:
npm run build && npm start`;
   
    navigator.clipboard.writeText(instructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            CustomGPT.ai Setup
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Choose your deployment mode
          </p>
        </div>
        
        {/* Two Column Layout */}
        <div className={cn(
          "grid gap-8 items-start",
          isMobile ? "grid-cols-1" : "grid-cols-[1fr,auto,1fr]"
        )}>
          {/* Demo Mode Column */}
          <div className="space-y-4 flex flex-col">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Demo Mode
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quick start with browser-based API keys
              </p>
            </div>
            
            {/* Security Warning */}
            <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Demo Mode Notice
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    API keys stored in browser only. Session expires after 2 hours.
                  </p>
                </div>
              </div>
            </Card>
            
            {/* API Key Input */}
            <Card className="p-6">
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CustomGPT.ai API Key
                  </label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter your API key..."
                      className={cn(
                        "pr-10",
                        error && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                </div>
                
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className={cn(
                    "text-gray-600 dark:text-gray-400",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {!isMobile && "Get your API key from "}
                    <a 
                      href="https://app.customgpt.ai/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      {isMobile ? "Get API Key" : "CustomGPT.ai Dashboard"}
                      <ExternalLink className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                    </a>
                  </p>
                </div>
                
                {/* Voice Capability Toggle */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="voice-toggle" className="flex items-center gap-2 cursor-pointer">
                      <Mic className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable voice capability (optional)
                      </span>
                    </label>
                    <Switch
                      id="voice-toggle"
                      checked={enableVoice}
                      onCheckedChange={setEnableVoice}
                    />
                  </div>
                  
                  {/* OpenAI Key Input - Only shown when voice is enabled */}
                  {enableVoice && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label htmlFor="openaiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        OpenAI API Key
                      </label>
                      <div className="relative">
                        <Input
                          id="openaiKey"
                          type={showOpenAIKey ? 'text' : 'password'}
                          value={openAIKeyInput}
                          onChange={(e) => setOpenAIKeyInput(e.target.value)}
                          placeholder="sk-..."
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Required for voice interactions. Get your key from{' '}
                        <a 
                          href="https://platform.openai.com/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          OpenAI Platform
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </p>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!apiKeyInput.trim() || (enableVoice && !openAIKeyInput.trim())}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Try Demo with your Data
                </Button>
              </form>
            </Card>
            
            {/* Demo Features */}
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p className="font-medium">Demo Mode Features:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>No server setup required</li>
                <li>Quick testing and evaluation</li>
                <li>2-hour session limit</li>
                <li>Browser-only storage</li>
              </ul>
            </div>
          </div>
          
          {/* Divider - Only show on desktop */}
          {!isMobile && (
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
              <div className="relative bg-gray-50 dark:bg-gray-800 px-4 py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  OR
                </span>
              </div>
            </div>
          )}
          
          {/* Production Mode Column */}
          <div className="space-y-4 flex flex-col">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Server className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Production Mode
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Secure server-side API key configuration
              </p>
            </div>
            
            {/* Production Info */}
            <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    Production Ready
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    API keys configured securely in environment variables.
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Production Setup */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Server-Side Configuration
                  </h3>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ensure you have configured your API keys in the server environment:
                </p>
                
                <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-100 overflow-x-auto">
                  <pre className="whitespace-pre">
{`# .env.local or server environment
CUSTOMGPT_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here  # Optional`}
                  </pre>
                </div>
                
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    {showInstructions ? 'Hide' : 'Show'} Setup Instructions
                  </Button>
                  
                  {showInstructions && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-100 overflow-x-auto">
                        <pre className="whitespace-pre">
{`# 1. Copy environment template
cp .env.example .env.local

# 2. Configure API keys
CUSTOMGPT_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here

# 3. Start the application
npm install && npm run dev

# For production deployment:
npm run build && npm start`}
                        </pre>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyInstructions}
                        className="w-full"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Instructions
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleProductionMode} 
                    className="w-full"
                    variant="default"
                    data-production-button
                  >
                    <Server className="h-4 w-4 mr-2" />
                    Use Production Mode
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* Production Features */}
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p className="font-medium">Production Mode Features:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Secure server-side API keys</li>
                <li>No session limits</li>
                <li>Full application features</li>
                <li>Production-ready deployment</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            This choice can be changed later by clearing browser data
          </p>
        </div>
      </div>
    </div>
  );
}