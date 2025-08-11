/**
 * Demo Configuration Modal
 * 
 * Modal dialog for managing API keys in demo mode.
 * Allows users to view, update, or add API keys after initial setup.
 */

'use client';

import React, { useState } from 'react';
import { AlertTriangle, Key, Settings, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useDemoStore } from '@/store/demo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DemoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoConfigModal({ isOpen, onClose }: DemoConfigModalProps) {
  const { apiKey, openAIApiKey, setApiKey, setOpenAIApiKey, error, setError } = useDemoStore();
  
  // Form state
  const [customGPTKey, setCustomGPTKey] = useState(apiKey || '');
  const [openAIKey, setOpenAIKey] = useState(openAIApiKey || '');
  const [showCustomGPTKey, setShowCustomGPTKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Track which fields have been modified
  const [customGPTModified, setCustomGPTModified] = useState(false);
  const [openAIModified, setOpenAIModified] = useState(false);
  
  const handleUpdateKeys = async () => {
    setIsUpdating(true);
    setError(null);
    
    try {
      // Update CustomGPT key if modified
      if (customGPTModified && customGPTKey !== apiKey) {
        if (!customGPTKey.trim()) {
          setError('CustomGPT.ai API key cannot be empty');
          setIsUpdating(false);
          return;
        }
        
        setApiKey(customGPTKey);
        
        // Check if there was an error
        const state = useDemoStore.getState();
        if (state.error) {
          setIsUpdating(false);
          return;
        }
      }
      
      // Update OpenAI key if modified (can be empty to remove)
      if (openAIModified) {
        setOpenAIApiKey(openAIKey);
        
        // Check if there was an error
        const state = useDemoStore.getState();
        if (state.error) {
          setIsUpdating(false);
          return;
        }
      }
      
      // Success
      toast.success('API keys updated successfully');
      onClose();
    } catch (err) {
      setError('Failed to update API keys');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const maskKey = (key: string): string => {
    if (!key || key.length < 8) return key;
    const visibleChars = 6;
    const start = key.substring(0, visibleChars);
    const masked = '*'.repeat(Math.max(0, key.length - visibleChars));
    return `${start}${masked}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Demo Configuration
          </DialogTitle>
          <DialogDescription>
            Manage your API keys for demo mode. Keys are encrypted and stored in your browser session only.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* CustomGPT.ai API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              CustomGPT.ai API Key
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showCustomGPTKey ? "text" : "password"}
                value={customGPTKey}
                onChange={(e) => {
                  setCustomGPTKey(e.target.value);
                  setCustomGPTModified(true);
                  setError(null);
                }}
                placeholder={apiKey ? "Enter new key to update" : "7840|8TPfOoyByw..."}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCustomGPTKey(!showCustomGPTKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
              >
                {showCustomGPTKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {apiKey && !customGPTModified && (
              <p className="text-xs text-muted-foreground">
                Current: {maskKey(apiKey)}
              </p>
            )}
          </div>
          
          {/* OpenAI API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              OpenAI API Key
              <span className="text-muted-foreground text-xs">(Optional - for voice features)</span>
            </label>
            <div className="relative">
              <Input
                type={showOpenAIKey ? "text" : "password"}
                value={openAIKey}
                onChange={(e) => {
                  setOpenAIKey(e.target.value);
                  setOpenAIModified(true);
                  setError(null);
                }}
                placeholder={openAIApiKey ? "Enter new key to update" : "sk-..."}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
              >
                {showOpenAIKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {openAIApiKey && !openAIModified && (
              <p className="text-xs text-muted-foreground">
                Current: {maskKey(openAIApiKey)}
              </p>
            )}
            {!openAIApiKey && (
              <p className="text-xs text-muted-foreground">
                Add an OpenAI API key to enable voice chat features
              </p>
            )}
          </div>
          
          {/* Security Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Security Notice
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  • Keys are encrypted and stored in browser session only
                  <br />• Keys are never sent to our servers
                  <br />• Session expires after 2 hours of inactivity
                  <br />• Keys are cleared when you close the browser tab
                </p>
              </div>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateKeys}
            disabled={isUpdating || (!customGPTModified && !openAIModified)}
            className="min-w-[100px]"
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Update Keys
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}