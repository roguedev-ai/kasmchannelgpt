/**
 * API Key Setup Modal Component
 * 
 * Modal that checks for required API keys and guides users through setup
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { validateAllKeys, getSetupInstructions } from '@/lib/api/key-validation';

interface ApiKeySetupModalProps {
  onComplete: () => void;
  isDemoMode?: boolean;
}

interface KeyStatus {
  customgpt: {
    isValid: boolean;
    error?: string;
    keyType: 'customgpt';
  };
  openai: {
    isValid: boolean;
    error?: string;
    keyType: 'openai';
  };
}

export const ApiKeySetupModal: React.FC<ApiKeySetupModalProps> = ({ 
  onComplete,
  isDemoMode = false 
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkApiKeys = async () => {
    setIsChecking(true);
    try {
      const validation = await validateAllKeys();
      
      setKeyStatus({
        customgpt: {
          isValid: validation.customgpt.isValid,
          error: validation.customgpt.error,
          keyType: 'customgpt' as const
        },
        openai: {
          isValid: validation.openai.isValid,
          error: validation.openai.error,
          keyType: 'openai' as const
        }
      });
      
      // If all critical keys are valid, proceed
      if (validation.allValid) {
        setShowModal(false);
        onComplete();
      } else {
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to validate API keys:', error);
      setKeyStatus({
        customgpt: { isValid: false, error: 'Failed to check API key status', keyType: 'customgpt' as const },
        openai: { isValid: true, keyType: 'openai' as const } // OpenAI is optional
      });
      setShowModal(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Skip validation in demo mode
    if (isDemoMode) {
      onComplete();
      return;
    }
    
    checkApiKeys();
  }, [isDemoMode]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await checkApiKeys();
    setIsRetrying(false);
  };

  const getStatusIcon = (isValid: boolean) => {
    if (isValid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-muted-foreground">Checking API configuration...</p>
        </div>
      </div>
    );
  }

  if (!showModal || !keyStatus) {
    return null;
  }

  const instructions = getSetupInstructions(keyStatus);
  const hasInstructions = instructions.length > 0;

  return (
    <AnimatePresence>
      {showModal && (
        <DialogPrimitive.Root open={showModal} onOpenChange={() => {}}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300" />
            <DialogPrimitive.Content
              className={cn(
                "fixed left-[50%] top-[50%] z-50",
                "w-full max-w-2xl",
                "translate-x-[-50%] translate-y-[-50%]",
                "bg-background",
                "border border-border",
                "rounded-xl shadow-2xl",
                "duration-300",
                "animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]",
                "overflow-hidden"
              )}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-brand-50 to-brand-100/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Shield className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <DialogPrimitive.Title className="text-xl font-semibold">
                    API Configuration Required
                  </DialogPrimitive.Title>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure your API keys to start using the application
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Key Status */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(keyStatus.customgpt.isValid)}
                      <span className="font-medium">CustomGPT API Key</span>
                      <span className="text-xs text-muted-foreground">(Required)</span>
                    </div>
                  </div>
                  {keyStatus.customgpt.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 ml-7">
                      {keyStatus.customgpt.error}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(keyStatus.openai.isValid)}
                      <span className="font-medium">OpenAI API Key</span>
                      <span className="text-xs text-muted-foreground">(Optional - for voice features)</span>
                    </div>
                  </div>
                  {keyStatus.openai.error && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 ml-7">
                      {keyStatus.openai.error}
                    </p>
                  )}
                </div>
              </div>

              {/* Setup Instructions */}
              {hasInstructions && (
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Setup Instructions
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <ol className="space-y-2 text-sm">
                      {instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start gap-2">
                          {instruction.startsWith('For voice') ? (
                            <span className="text-amber-600 dark:text-amber-400">{instruction}</span>
                          ) : (
                            <>
                              <span className="text-amber-600 dark:text-amber-400 font-mono">
                                {instruction}
                              </span>
                            </>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Links to get API keys */}
                  <div className="flex flex-col gap-2 pt-2">
                    {!keyStatus.customgpt.isValid && (
                      <a
                        href="https://app.customgpt.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-sm group"
                      >
                        Get your CustomGPT API key
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    )}
                    {!keyStatus.openai.isValid && (
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-sm group"
                      >
                        Get your OpenAI API key (optional)
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Security Note */}
              <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">
                      Secure Configuration
                    </h4>
                    <p className="text-green-700 dark:text-green-400 text-sm">
                      API keys are stored securely on the server and never exposed to the browser.
                      Never commit your .env.local file to version control.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-end">
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center gap-2"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Retry Configuration Check
                    </>
                  )}
                </Button>
              </div>
            </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
};