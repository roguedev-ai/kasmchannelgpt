/**
 * Free Trial Indicator Component
 * 
 * Displays free trial usage statistics and remaining time for demo mode users.
 * Shows a floating indicator with expandable details including:
 * - Time remaining in the current session
 * - Projects created/remaining
 * - Conversations created/remaining
 * - Messages sent/remaining
 * 
 * Features:
 * - Real-time countdown timer
 * - Usage stats refresh every 30 seconds
 * - Expandable details view
 * - Visual warnings when approaching limits
 * - Auto-updates on resource creation
 * 
 * @component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDemoModeContext } from '@/contexts/DemoModeContext';
import { proxyClient } from '@/lib/api/proxy-client';

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

  // Fetch usage stats
  const fetchUsageStats = useCallback(async () => {
    if (!isFreeTrialMode) return;
    
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
  }, [isFreeTrialMode]);

  // Update time remaining
  const updateTimeRemaining = useCallback(() => {
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
  }, [session]);

  // Initial fetch and setup intervals
  useEffect(() => {
    if (!isFreeTrialMode) return;
    
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
  }, [isFreeTrialMode, fetchUsageStats, session]);

  // Update time display
  useEffect(() => {
    if (!isFreeTrialMode) return;
    updateTimeRemaining();
  }, [session, isFreeTrialMode, updateTimeRemaining]);

  // Listen for usage update events
  useEffect(() => {
    if (!isFreeTrialMode) return;
    
    const handleUsageUpdate = () => {
      fetchUsageStats();
    };
    
    // Custom events that can be dispatched when resources are created
    window.addEventListener('demoUsageUpdate', handleUsageUpdate);
    
    return () => {
      window.removeEventListener('demoUsageUpdate', handleUsageUpdate);
    };
  }, [isFreeTrialMode, fetchUsageStats]);

  // Determine if any limits are close to being reached
  const isNearLimit = () => {
    if (!usage) return false;
    return (
      usage.projects.remaining <= 0 ||
      usage.conversations.remaining <= 1 ||
      (session && session.remainingTime < 5 * 60 * 1000) // Less than 5 minutes
    );
  };

  // Don't render if not in free trial mode
  if (!isFreeTrialMode) {
    return null;
  }

  if (isLoading && !usage) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="bg-background/95 backdrop-blur-sm border shadow-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !usage || !session) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={cn(
        "bg-background/95 backdrop-blur-sm border shadow-lg transition-all duration-200",
        isNearLimit() && "border-orange-500/50"
      )}>
        {/* Main indicator */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-3 p-3 w-full text-left hover:bg-accent/50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2 flex-1">
            <Clock className={cn(
              "w-4 h-4",
              isNearLimit() ? "text-orange-500" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium",
              isNearLimit() ? "text-orange-500" : "text-foreground"
            )}>
              Free Trial: {timeRemaining}
            </span>
          </div>
          {showDetails ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Expanded details */}
        {showDetails && (
          <div className="px-3 pb-3 space-y-2 border-t pt-2">
            <div className="space-y-1">
              <UsageItem
                label="Projects"
                used={usage.projects.used}
                limit={usage.projects.limit}
                remaining={usage.projects.remaining}
              />
              <UsageItem
                label="Conversations"
                used={usage.conversations.used}
                limit={usage.conversations.limit}
                remaining={usage.conversations.remaining}
              />
              <UsageItem
                label="Messages"
                used={usage.messages.total}
                limit={usage.messages.limitPerConversation * 10} // Estimate total limit
                remaining={Math.max(0, (usage.messages.limitPerConversation * 10) - usage.messages.total)}
              />
            </div>
            
            {isNearLimit() && (
              <div className="flex items-start gap-2 pt-2 border-t">
                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                <p className="text-xs text-orange-500">
                  You&apos;re approaching your free trial limits. 
                  Sign up for a full account to continue.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function UsageItem({ 
  label, 
  used, 
  limit, 
  remaining 
}: { 
  label: string; 
  used: number; 
  limit: number; 
  remaining: number;
}) {
  const percentUsed = (used / limit) * 100;
  const isLow = remaining <= 1;
  const isEmpty = remaining === 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-medium",
          isEmpty ? "text-red-500" : isLow ? "text-orange-500" : "text-foreground"
        )}>
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300",
            isEmpty ? "bg-red-500" : isLow ? "bg-orange-500" : "bg-brand-500"
          )}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
    </div>
  );
}