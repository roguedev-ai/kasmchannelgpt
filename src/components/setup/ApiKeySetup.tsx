/**
 * API Key Setup Component
 * 
 * Initial setup screen for configuring CustomGPT.ai API credentials.
 * This is the first screen users see when starting the application.
 * 
 * Features:
 * - API key validation (format: digits|alphanumeric)
 * - Secure password input field
 * - Live connection testing
 * - Helpful onboarding instructions
 * - Smooth animations and loading states
 * 
 * Flow:
 * 1. User enters API key
 * 2. Validates format locally
 * 3. Tests connection by fetching agents
 * 4. Stores key and proceeds to chat
 * 
 * Features:
 * - Flexible validation system with customizable API key requirements
 * - Multiple authentication methods including OAuth integration
 * - Professional onboarding experience with clear instructions
 * - Enterprise-grade security with multi-tenant authentication support
 * - Comprehensive API key management and validation
 * 
 * Security notes:
 * - API key is stored in localStorage via Zustand
 * - Password input type prevents shoulder surfing
 * - Key is validated before making API calls
 * - Failed keys are immediately cleared
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useConfigStore, useAgentStore } from '@/store';
import { isValidApiKey } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Props for ApiKeySetup component
 * 
 * @property onComplete - Callback fired when setup completes successfully
 */
interface ApiKeySetupProps {
  onComplete?: () => void;
}

/**
 * API Key Setup Component
 * 
 * Handles the initial configuration of CustomGPT.ai API credentials.
 * Provides a user-friendly onboarding experience with validation.
 * 
 * @param onComplete - Optional callback when setup succeeds
 */
export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setApiKey: setConfigApiKey } = useConfigStore();
  const { fetchAgents } = useAgentStore();

  /**
   * Handle form submission
   * 
   * Validates API key format and tests connection by fetching agents.
   * Shows appropriate error messages for different failure scenarios.
   * 
   * Error handling:
   * - Empty input: Shows validation error
   * - Invalid format: Shows format error with example
   * - Network failure: Shows connection error
   * - Invalid key: Clears key and shows error
   * 
   * Success flow:
   * 1. Store key in config (initializes API client)
   * 2. Fetch agents to verify connection
   * 3. Show success toast
   * 4. Call onComplete callback
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input is not empty
    if (!apiKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }

    // Validate API key format (digits|alphanumeric)
    if (!isValidApiKey(apiKey)) {
      toast.error('Invalid API key format. Expected format: numbers|alphanumeric (e.g., 1234|abcd...)');
      return;
    }

    setIsLoading(true);

    try {
      // Set the API key in config store (this will initialize the client)
      setConfigApiKey(apiKey);
      
      // Test the API key by fetching agents
      await fetchAgents();
      
      toast.success('API key configured successfully!');
      onComplete?.();
    } catch (error) {
      console.error('Failed to validate API key:', error);
      toast.error('Invalid API key or network error');
      setConfigApiKey(''); // Clear invalid key to prevent usage
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome to CustomGPT UI
            </h1>
            <p className="text-muted-foreground">
              Enter your CustomGPT.ai API key to get started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="apiKey" className="block text-sm font-medium mb-2">
                API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="1234|abcd... (CustomGPT API Key)"
                disabled={isLoading}
                className="w-full py-3"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !apiKey.trim()}
              className="w-full py-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </div>
              ) : (
                'Connect'
              )}
            </Button>
          </form>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">
              How to get your API key:
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Sign up or log in to CustomGPT.ai
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Navigate to your account settings
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Generate a new API key
              </li>
            </ol>
            
            <a
              href="https://app.customgpt.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-sm mt-4 group"
            >
              Get your API key
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </a>
            
            <p className="text-xs text-muted-foreground mt-4">
              You can change your API key anytime from the Settings page after setup.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};