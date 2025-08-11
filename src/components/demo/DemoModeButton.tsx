/**
 * Demo Mode Button Component
 * 
 * Navbar button for demo mode with dropdown menu containing all demo options.
 * Replaces the persistent banner with a more subtle navbar integration.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Key, Settings, LogOut, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useDemoStore } from '@/store/demo';
import { DemoConfigModal } from './DemoConfigModal';
import { useRouter } from 'next/navigation';

interface DemoModeButtonProps {
  className?: string;
}

export function DemoModeButton({ className }: DemoModeButtonProps) {
  const router = useRouter();
  const { sessionStartTime, sessionTimeout, clearApiKey, apiKey, openAIApiKey } = useDemoStore();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  useEffect(() => {
    if (!sessionStartTime) return;
    
    const updateTimer = () => {
      const elapsed = Date.now() - sessionStartTime;
      const remaining = sessionTimeout - elapsed;
      
      if (remaining <= 0) {
        setTimeRemaining('Session expired');
        return;
      }
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [sessionStartTime, sessionTimeout]);
  
  const handleEndSession = () => {
    clearApiKey();
    router.push('/');
  };
  
  const maskKey = (key: string): string => {
    if (!key || key.length < 8) return key;
    const visibleChars = 4;
    const start = key.substring(0, visibleChars);
    const masked = '*'.repeat(Math.max(0, key.length - visibleChars - 4));
    const end = key.substring(key.length - 4);
    return `${start}${masked}${end}`;
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center gap-2 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50",
              className
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Demo Mode</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          {/* Session Timer */}
          <div className="px-3 py-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Session Time
              </span>
              <span className="font-mono text-xs">{timeRemaining}</span>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* API Keys Status */}
          <div className="px-3 py-2 space-y-1.5">
            <div className="text-xs text-muted-foreground">API Keys</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">CustomGPT.ai:</span>
                <span className="font-mono text-green-600 dark:text-green-400">
                  {maskKey(apiKey || '')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">OpenAI:</span>
                <span className={cn(
                  "font-mono",
                  openAIApiKey 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-muted-foreground"
                )}>
                  {openAIApiKey ? maskKey(openAIApiKey) : 'Not configured'}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Actions */}
          <DropdownMenuItem onClick={() => setIsConfigOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configure API Keys
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleEndSession} className="text-red-600 dark:text-red-400">
            <LogOut className="mr-2 h-4 w-4" />
            End Session
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Security Notice */}
          <div className="px-3 py-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Security Notice</p>
              <p>• Keys stored in browser only</p>
              <p>• Session expires after 2 hours</p>
              <p>• Keys cleared on tab close</p>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Configuration Modal */}
      <DemoConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
      />
    </>
  );
}