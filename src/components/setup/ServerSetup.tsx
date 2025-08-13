/**
 * Server Setup Component
 * 
 * Displays instructions for server-side API key configuration.
 * This replaces the client-side API key setup for improved security.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServerSetupProps {
  onComplete?: () => void;
}

export const ServerSetup: React.FC<ServerSetupProps> = ({ onComplete }) => {
  const handleContinue = () => {
    // In production, you would verify server configuration here
    // For now, we'll just proceed
    onComplete?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-background dark:from-brand-950 dark:to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-background rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Secure Server Configuration Required
            </h1>
            <p className="text-muted-foreground">
              For security, API keys must be configured on the server
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-green-700 dark:text-green-400 mb-1">Enhanced Security</h3>
                <p className="text-green-700 dark:text-green-400 text-sm">
                  API keys are now stored securely on the server and never exposed to the browser.
                  This protects your CustomGPT account from unauthorized access.
                </p>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="space-y-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Server Configuration Steps:
              </h3>
              <ol className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-xs font-semibold">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Create environment file
                    </p>
                    <p>Copy <code className="bg-muted px-1 py-0.5 rounded">.env.example</code> to <code className="bg-muted px-1 py-0.5 rounded">.env.local</code></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-xs font-semibold">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Add your API key
                    </p>
                    <p>Set <code className="bg-muted px-1 py-0.5 rounded">CUSTOMGPT_API_KEY=your_api_key_here</code></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-xs font-semibold">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Restart the server
                    </p>
                    <p>Run <code className="bg-muted px-1 py-0.5 rounded">npm run dev</code> to apply changes</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Get API Key Link */}
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Need an API key?
              </h4>
              <a
                href="https://app.customgpt.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-sm group"
              >
                Get your API key from CustomGPT
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-700 dark:text-amber-400 mb-1">Important</h3>
                <p className="text-amber-700 dark:text-amber-400 text-sm">
                  Never commit your <code className="bg-amber-500/20 px-1 py-0.5 rounded">.env.local</code> file to version control.
                  It should be listed in your <code className="bg-amber-500/20 px-1 py-0.5 rounded">.gitignore</code> file.
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full py-3"
          >
            I&apos;ve configured the server
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Development mode: Configuration check bypassed
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};