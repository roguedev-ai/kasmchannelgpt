/**
 * Free Trial Limit Modal Component
 * 
 * Modal shown when users hit free trial limitations.
 * Encourages them to add their own API key to continue using the app.
 * Displayed after a toast notification with a 3-second delay.
 */

'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Key, 
  ExternalLink,
  Eye,
  EyeOff,
  X,
  Clock,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDemoStore } from '@/store/demo';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { FREE_TRIAL_LIMITS, DEMO_STORAGE_KEYS } from '@/lib/constants/demo-limits';
import { usageTracker } from '@/lib/analytics/usage-tracker';

interface FreeTrialLimitModalProps {
  onClose?: () => void;
}

export function FreeTrialLimitModal({ onClose }: FreeTrialLimitModalProps) {
  const { setApiKey } = useDemoStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { isMobile } = useBreakpoint();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if API key is empty
    if (!apiKeyInput.trim()) {
      setError('Please provide your API Key');
      return;
    }
    
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
        eventName: 'api_key_added_from_limit_modal',
        metadata: {
          source: 'free_trial_limit_modal'
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
      
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 100);
    } catch (error) {
      console.error('[FreeTrialLimitModal] Error validating API key:', error);
      setError('Failed to validate API key. Please check your connection and try again.');
      setIsValidating(false);
    }
  };
  
  return (
    <div>
      {/* Background Overlay - prevents clicks on background UI */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className={cn(
          "bg-white dark:bg-gray-900 rounded-lg shadow-xl",
          isMobile ? "w-full max-w-md" : "w-full max-w-lg"
        )}>
          {/* Modal Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Free Trial Limit Reached
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    You&apos;ve reached the limits of the free trial
                  </p>
                </div>
              </div>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Modal Content */}
          <div className="p-6">
            {/* Free Trial Limits Info */}
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                Free Trial Limitations:
              </h3>
              <div className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{FREE_TRIAL_LIMITS.MAX_MESSAGES_PER_CONVERSATION} messages per conversation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{FREE_TRIAL_LIMITS.SESSION_DURATION / 60000} minute sessions</span>
                </div>
              </div>
            </div>
            
            {/* API Key Form */}
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Continue with Your API Key
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Add your CustomGPT API key to remove all limitations
                    </p>
                  </div>
                </div>
                
                {/* API Key Input */}
                <div className="space-y-3">
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CustomGPT API Key
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
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Don&apos;t have an API key?{' '}
                    <a 
                      href="https://app.customgpt.ai/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      Get one from CustomGPT.ai
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  size="lg"
                  disabled={isValidating}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isValidating ? 'Validating...' : 'Continue with Full Access'}
                </Button>
              </form>
            </Card>
            
            {/* Benefits of adding API key */}
            <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-1">With your API key you get:</p>
              <ul className="space-y-1">
                <li>✓ Unlimited messages</li>
                <li>✓ All your CustomGPT projects</li>
                <li>✓ No session time limits</li>
                <li>✓ Full feature access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}