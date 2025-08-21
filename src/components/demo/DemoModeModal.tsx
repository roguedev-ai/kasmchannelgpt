/**
 * Demo Mode Modal Component
 * 
 * Modal overlay shown when no deployment mode is selected.
 * Allows users to choose between demo mode or see deployment instructions.
 * Shows main UI in background to demonstrate app look and feel.
 */

'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Key, 
  Info, 
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Terminal,
  Mic,
  X,
  Github,
  Zap,
  Clock,
  MessageSquare,
  FolderOpen,
  Container,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useDemoStore } from '@/store/demo';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { FREE_TRIAL_LIMITS, DEMO_STORAGE_KEYS } from '@/lib/constants/demo-limits';
import { SimpleCaptcha, isCaptchaVerified } from './SimpleCaptcha';
import { usageTracker } from '@/lib/analytics/usage-tracker';
import { proxyClient } from '@/lib/api/proxy-client';

interface DemoModeModalProps {
  onClose?: () => void;
  hideFreeTrial?: boolean;
  canClose?: boolean;
}

export function DemoModeModal({ onClose, hideFreeTrial = false, canClose = true }: DemoModeModalProps) {
  const { setApiKey, setOpenAIApiKey, error, setError } = useDemoStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [openAIKeyInput, setOpenAIKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [enableVoice, setEnableVoice] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'try' | 'deploy'>('try');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { isMobile } = useBreakpoint();
  const [isFreeTrialPermanentlyExpired] = useState(() => {
    return localStorage.getItem('customgpt.freeTrialExpired') === 'true';
  });
  
  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      console.log('[DemoModeModal] Starting demo session', {
        hideFreeTrial,
        canClose,
        currentDeploymentMode: localStorage.getItem(DEMO_STORAGE_KEYS.DEPLOYMENT_MODE),
        currentFreeTrialMode: localStorage.getItem(DEMO_STORAGE_KEYS.FREE_TRIAL_MODE)
      });
      
      setIsValidating(true);
      setError(null);
      
      // First, validate the API key by making a test request
      try {
        // Test the API key by fetching projects
        const response = await fetch('/api/proxy/projects', {
          headers: {
            'X-CustomGPT-API-Key': apiKeyInput.trim(),
            'X-Deployment-Mode': 'demo'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError('Invalid API key. Please check your key and try again.');
          } else {
            setError('Failed to validate API key. Please try again.');
          }
          
          setIsValidating(false);
          return;
        }
        
        // API key is valid, proceed with setup
        // Track user API key demo start
        usageTracker.track({
          eventType: 'session_start',
          eventName: 'user_api_key_demo_started',
          metadata: {
            source: 'modal',
            voice_enabled: enableVoice
          }
        });
        
        // Clear free trial mode flag when switching to API key mode
        localStorage.removeItem(DEMO_STORAGE_KEYS.FREE_TRIAL_MODE);
        sessionStorage.removeItem(DEMO_STORAGE_KEYS.FREE_TRIAL_SESSION);
        sessionStorage.removeItem('customgpt.captchaVerified');
        
        // Set up demo mode with API key
        localStorage.setItem(DEMO_STORAGE_KEYS.DEPLOYMENT_MODE, 'demo');
        
        // Create demo session for 120 minutes
        const demoSessionData = {
          startTime: Date.now(),
          sessionId: `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`
        };
        sessionStorage.setItem(DEMO_STORAGE_KEYS.DEMO_SESSION, JSON.stringify(demoSessionData));
        
        setApiKey(apiKeyInput);
        if (enableVoice && openAIKeyInput.trim()) {
          setOpenAIApiKey(openAIKeyInput);
        }
        
        setTimeout(() => {
          window.location.href = window.location.href;
        }, 100);
      } catch (error) {
        console.error('[DemoModeModal] Error validating API key:', error);
        setError('Failed to validate API key. Please check your connection and try again.');
        setIsValidating(false);
      }
    }
  };

  const handleFreeTrial = () => {
    // Check if free trial has been permanently expired
    if (localStorage.getItem('customgpt.freeTrialExpired') === 'true') {
      console.log('[DemoModeModal] Free trial permanently expired - cannot start new trial');
      // Show error message
      setError('Free trial is no longer available. Please use your own API key.');
      return;
    }
    
    // Check if already verified
    if (!isCaptchaVerified()) {
      setShowCaptcha(true);
      return;
    }
    
    startFreeTrial();
  };
  
  const startFreeTrial = () => {
    console.log('[DemoModeModal] Starting free trial');
    
    // Track free trial start
    usageTracker.track({
      eventType: 'session_start',
      eventName: 'free_trial_started',
      metadata: {
        source: 'modal',
        captcha_verified: true
      }
    });
    
    // Set special marker for free trial mode
    localStorage.setItem(DEMO_STORAGE_KEYS.DEPLOYMENT_MODE, 'demo');
    localStorage.setItem(DEMO_STORAGE_KEYS.FREE_TRIAL_MODE, 'true');
    
    // Start free trial session
    const sessionData = {
      startTime: Date.now(),
      projectCount: 0,
      conversationCount: 0,
      messageCount: 0,
      sessionId: `trial_${Date.now()}_${Math.random().toString(36).substring(7)}`
    };
    
    sessionStorage.setItem(DEMO_STORAGE_KEYS.FREE_TRIAL_SESSION, JSON.stringify(sessionData));
    
    setTimeout(() => {
      window.location.href = window.location.href;
    }, 100);
  };
  
  const handleModalClose = () => {
    // Don't start free trial if it's permanently expired
    if (localStorage.getItem('customgpt.freeTrialExpired') === 'true') {
      console.log('[DemoModeModal] Cannot close modal - free trial permanently expired');
      return;
    }
    
    console.log('[DemoModeModal] Closing modal - starting free trial by default');
    handleFreeTrial();
  };
  
  const handleCopyCommand = () => {
    const command = 'git clone https://github.com/Poll-The-People/customgpt-starter-kit';
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div>
      {/* Background Overlay - prevents clicks on background UI */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
        onClick={canClose ? handleModalClose : undefined}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className={cn(
          "bg-white dark:bg-gray-900 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto",
          isMobile ? "w-full max-w-lg" : "w-full max-w-4xl"
        )}>
          {/* Modal Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Welcome to the CustomGPT.ai Developer Starter Kit
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  A completely open-source reference app - working code you can customize and deploy today.
                </p>
              </div>
              {canClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600"
                  title="Start free trial"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-1 mt-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('try')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'try' 
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                Try It Out
              </button>
              <button
                onClick={() => setActiveTab('deploy')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'deploy' 
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                Deploy Your Own
              </button>
            </div>
          </div>
          
          {/* Modal Content */}
          <div className="p-6">
            {/* Session Expired Message */}
            {hideFreeTrial && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                      Free Trial Session Expired
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      Your free trial session has ended. Please enter your API key to continue with a 2-hour demo session.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'try' ? (
              <>
                <div className={cn(
                  "grid gap-6",
                  isMobile ? "grid-cols-1" : hideFreeTrial ? "grid-cols-1" : "grid-cols-2"
                )}>
                {/* Free Trial Option */}
                {!hideFreeTrial && (
                <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          Instant Playground
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Try now - no signup needed
                        </p>
                      </div>
                    </div>
                    
                    {/* Trial Limitations */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FolderOpen className="h-4 w-4" />
                        <span>{FREE_TRIAL_LIMITS.MAX_PROJECTS} Project</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MessageSquare className="h-4 w-4" />
                        <span>{FREE_TRIAL_LIMITS.MAX_CONVERSATIONS} Conversations</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{FREE_TRIAL_LIMITS.MAX_MESSAGES_PER_CONVERSATION} messages per chat</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{FREE_TRIAL_LIMITS.SESSION_DURATION / 60000} minute session</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Info className="h-4 w-4" />
                        <span className="text-xs">Shared demo - rate limits may apply</span>
                      </div>
                    </div>
                    
                    {showCaptcha ? (
                      <SimpleCaptcha 
                        onVerified={() => {
                          setShowCaptcha(false);
                          startFreeTrial();
                        }}
                      />
                    ) : (
                      <>
                        <Button 
                          onClick={handleFreeTrial}
                          className="w-full"
                          size="lg"
                          disabled={isFreeTrialPermanentlyExpired}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {isFreeTrialPermanentlyExpired ? 'Free Trial Unavailable' : 'Try Demo with Sample Data'}
                        </Button>
                        
                        <p className="text-xs text-center text-gray-500 dark:text-gray-500">
                          {isFreeTrialPermanentlyExpired 
                            ? 'Free trial has ended. Please use your API key.'
                            : 'Instant access • No login required'}
                        </p>
                      </>
                    )}
                  </div>
                </Card>
                )}
                
                {/* API Key Demo Mode */}
                <Card className="p-6">
                  <form onSubmit={handleDemoSubmit} className="space-y-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          Use Your API Key
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Load your projects & data
                        </p>
                      </div>
                    </div>
                    
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get your API key from{' '}
                        <a 
                          href="https://app.customgpt.ai/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          CustomGPT.ai Dashboard
                          <ExternalLink className="h-3 w-3" />
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
                            Required for voice interactions. Get from{' '}
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
                      size="lg"
                      disabled={!apiKeyInput.trim() || (enableVoice && !openAIKeyInput.trim()) || isValidating}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {isValidating ? 'Validating...' : 'Try Demo with your Data'}
                    </Button>
                    
                    <p className="text-xs text-center text-gray-500 dark:text-gray-500">
                      Browser storage • 2 hour session
                    </p>
                  </form>
                </Card>
                </div>
                
                {/* Bottom CTA to Deploy Section */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Want to deploy your own CustomGPT UI with full features?
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('deploy')}
                      className="inline-flex items-center gap-2"
                    >
                      <Github className="h-4 w-4" />
                      View Deployment Options
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {/* Deployment Options Header */}
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Choose Your Deployment Method
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Deploy CustomGPT UI using your preferred method
                  </p>
                </div>
                
                {/* Option 1: GitHub Clone */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <Github className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          Method 1: Clone from GitHub
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Traditional deployment with full customization
                        </p>
                      </div>
                    </div>
                    
                    {/* Clone Command */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Step 1: Clone the repository
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-gray-900 dark:bg-gray-950 rounded-lg px-4 py-3 font-mono text-sm text-gray-100">
                          git clone https://github.com/Poll-The-People/customgpt-starter-kit
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyCommand}
                          title="Copy command"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Setup Steps */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Step 2: Configure environment
                      </label>
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-100 overflow-x-auto">
                        <pre className="whitespace-pre">
{`cd customgpt-starter-kit
cp .env.example .env.local

# Edit .env.local and add your keys:
CUSTOMGPT_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here  # Optional`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Step 3: Install and run
                      </label>
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-100 overflow-x-auto">
                        <pre className="whitespace-pre">
{`# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build && npm start`}
                        </pre>
                      </div>
                    </div>
                    
                    {/* GitHub CTA */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open('https://github.com/Poll-The-People/customgpt-starter-kit', '_blank')}
                    >
                      <Github className="h-4 w-4 mr-2" />
                      View on GitHub
                    </Button>
                  </div>
                </Card>
                
                {/* Option 2: Docker */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Container className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          Method 2: Docker Deployment
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          One-command deployment with Docker
                        </p>
                      </div>
                    </div>
                    
                    {/* Docker Pull Command */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Option A: Using Docker Compose (Recommended)
                      </label>
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-100 overflow-x-auto">
                        <pre className="whitespace-pre">
{`# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  customgpt-ui:
    image: ghcr.io/poll-the-people/customgpt-ui:latest
    ports:
      - "3000:3000"
    environment:
      - CUSTOMGPT_API_KEY=your_api_key_here
      - OPENAI_API_KEY=your_openai_key_here
      - NODE_ENV=production
    restart: unless-stopped
EOF

# Start the container
docker-compose up -d`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Option B: Using Docker Run
                      </label>
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-100 overflow-x-auto">
                        <pre className="whitespace-pre">
{`# Pull and run the Docker image
docker run -d \\
  --name customgpt-ui \\
  -p 3000:3000 \\
  -e CUSTOMGPT_API_KEY=your_api_key_here \\
  -e OPENAI_API_KEY=your_openai_key_here \\
  -e NODE_ENV=production \\
  --restart unless-stopped \\
  ghcr.io/poll-the-people/customgpt-ui:latest`}
                        </pre>
                      </div>
                    </div>
                    
                    {/* Docker Features */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Docker Deployment Benefits:
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                          <Rocket className="h-4 w-4 mt-0.5 text-gray-500" />
                          <span>Pre-configured production environment</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Container className="h-4 w-4 mt-0.5 text-gray-500" />
                          <span>Isolated container with all dependencies</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="h-4 w-4 mt-0.5 text-gray-500" />
                          <span>Automatic health checks and restarts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Key className="h-4 w-4 mt-0.5 text-gray-500" />
                          <span>Environment variables for secure API key management</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Advanced Docker Config */}
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                        Advanced Docker Configuration ▼
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-100 overflow-x-auto">
                          <pre className="whitespace-pre">
{`# Custom docker-compose.yml with all options
version: '3.8'
services:
  customgpt-ui:
    image: ghcr.io/poll-the-people/customgpt-ui:latest
    ports:
      - "3000:3000"
    environment:
      # Required
      - CUSTOMGPT_API_KEY=your_api_key_here
      # Optional
      - OPENAI_API_KEY=your_openai_key_here
      - CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
      - ALLOWED_ORIGINS=https://yourdomain.com
      - RATE_LIMIT_PER_MINUTE=60
      - NODE_ENV=production
    volumes:
      # Persist widget builds (optional)
      - ./widget-dist:/app/dist/widget
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3`}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                </Card>
                
                {/* Deployment Features */}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p className="font-medium">Features when you deploy:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Secure server-side API key management</li>
                    <li>No session limits or restrictions</li>
                    <li>Full customization and branding</li>
                    <li>Deploy to Vercel, Netlify, or any Node.js host</li>
                    <li>Widget mode for embedding in other sites</li>
                  </ul>
                </div>
                
                {/* Get API Key CTA */}
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                  <div className="text-center space-y-3">
                    <Key className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Need an API Key?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Get your CustomGPT.ai API key to start deploying
                      </p>
                    </div>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => window.open('https://app.customgpt.ai/', '_blank')}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Get Your API Key
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}