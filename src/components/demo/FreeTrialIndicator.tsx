/**
 * Free Trial Indicator Component
 * 
 * Shows usage limits and remaining time for free trial sessions.
 * Updates in real-time and displays warnings when approaching limits.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  FolderOpen, 
  MessageSquare, 
  AlertTriangle,
  X,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { proxyClient } from '@/lib/api/proxy-client';
import { useDemoModeContext } from '@/contexts/DemoModeContext';
import { FREE_TRIAL_LIMITS } from '@/lib/constants/demo-limits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UsageStats {
  projects: { used: number; limit: number; remaining: number };
  conversations: { used: number; limit: number; remaining: number };
  messages: { total: number; limitPerConversation: number; byConversation: Record<string, number> };
}

interface SessionInfo {
  sessionId: string;
  startTime: number;
  expiresAt: number;
  remainingTime: number;
}

export function FreeTrialIndicator() {
  const { isFreeTrialMode } = useDemoModeContext();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Don't render if not in free trial mode
  if (!isFreeTrialMode) {
    return null;
  }

  // Fetch usage stats
  const fetchUsageStats = async () => {
    try {
      const response = await proxyClient.getDemoUsageStats();
      if (response.status === 'success') {
        setUsage(response.data.usage);
        setSession(response.data.session);
        setError(null);
      }
    } catch (err) {
      console.error('[FreeTrialIndicator] Failed to fetch usage stats:', err);
      setError('Failed to load usage stats');
    } finally {
      setIsLoading(false);
    }
  };

  // Update time remaining
  const updateTimeRemaining = () => {
    if (!session) return;
    
    const remaining = session.remainingTime;
    if (remaining <= 0) {
      setTimeRemaining('Session expired');
      return;
    }
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      setTimeRemaining(`${minutes}m ${seconds}s`);
    } else {
      setTimeRemaining(`${seconds}s`);
    }
  };

  // Initial fetch and setup intervals
  useEffect(() => {
    fetchUsageStats();
    
    // Refresh usage stats every 30 seconds
    const statsInterval = setInterval(fetchUsageStats, 30000);
    
    // Update time every second
    const timeInterval = setInterval(() => {
      if (session) {
        const newRemaining = Math.max(0, session.expiresAt - Date.now());
        setSession(prev => prev ? { ...prev, remainingTime: newRemaining } : null);
      }
    }, 1000);
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Update time display
  useEffect(() => {
    updateTimeRemaining();
  }, [session]);

  // Listen for usage update events
  useEffect(() => {
    const handleUsageUpdate = () => {
      fetchUsageStats();
    };
    
    // Custom events that can be dispatched when resources are created
    window.addEventListener('demoUsageUpdate', handleUsageUpdate);
    
    return () => {
      window.removeEventListener('demoUsageUpdate', handleUsageUpdate);
    };
  }, []);

  // Determine if any limits are close to being reached
  const isNearLimit = () => {
    if (!usage) return false;
    return (
      usage.projects.remaining <= 0 ||
      usage.conversations.remaining <= 1 ||
      (session && session.remainingTime < 5 * 60 * 1000) // Less than 5 minutes
    );
  };

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (error || !usage || !session) {
    return null; // Don't show if there's an error
  }

  return (
    <>
      {/* Compact indicator bar */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-gradient-to-r py-2 px-4 text-white text-sm",
        isNearLimit() 
          ? "from-orange-500 to-red-500" 
          : "from-blue-500 to-purple-500"
      )}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium">Free Trial Mode</span>
            
            {/* Quick stats */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                <span>{usage.projects.used}/{usage.projects.limit}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{usage.conversations.used}/{usage.conversations.limit}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeRemaining}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-white hover:bg-white/20 h-7 text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </div>
      
      {/* Detailed view modal/dropdown */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowDetails(false)}
          />
          
          <Card className="relative z-10 w-full max-w-md p-6 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Free Trial Usage</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetails(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Projects</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {usage.projects.used} / {usage.projects.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      usage.projects.remaining === 0 
                        ? "bg-red-500" 
                        : "bg-blue-500"
                    )}
                    style={{ 
                      width: `${(usage.projects.used / usage.projects.limit) * 100}%` 
                    }}
                  />
                </div>
                {usage.projects.remaining === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Project limit reached
                  </p>
                )}
              </div>
              
              {/* Conversations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Conversations</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {usage.conversations.used} / {usage.conversations.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      usage.conversations.remaining === 0 
                        ? "bg-red-500" 
                        : usage.conversations.remaining === 1
                        ? "bg-orange-500"
                        : "bg-blue-500"
                    )}
                    style={{ 
                      width: `${(usage.conversations.used / usage.conversations.limit) * 100}%` 
                    }}
                  />
                </div>
                {usage.conversations.remaining === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Conversation limit reached
                  </p>
                )}
              </div>
              
              {/* Messages */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Messages per chat</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {usage.messages.limitPerConversation} max
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Total messages sent: {usage.messages.total}
                </p>
              </div>
              
              {/* Time remaining */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Time remaining</span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    session.remainingTime < 5 * 60 * 1000 
                      ? "text-red-600" 
                      : "text-gray-600"
                  )}>
                    {timeRemaining}
                  </span>
                </div>
                {session.remainingTime < 5 * 60 * 1000 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Session will expire soon
                  </p>
                )}
              </div>
              
              {/* Info */}
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Free trial sessions are limited to help prevent abuse. 
                  To unlock unlimited usage, use your own API key.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}