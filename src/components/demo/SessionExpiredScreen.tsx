/**
 * Session Expired Screen
 * 
 * Displays when a free trial session has expired.
 * Blocks all UI interaction and forces user to restart.
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';

export function SessionExpiredScreen() {
  const handleRestart = () => {
    // Clear all demo-related data
    localStorage.removeItem('customgpt.deploymentMode');
    localStorage.removeItem('customgpt.freeTrialMode');
    sessionStorage.removeItem('customgpt.freeTrialSession');
    
    // Clear any cookies
    document.cookie = 'demo_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Reload the page to start fresh
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Clock className="h-16 w-16 text-muted-foreground" />
            <AlertTriangle className="h-8 w-8 text-amber-500 absolute -bottom-2 -right-2" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Session Expired</h2>
          <p className="text-muted-foreground">
            Your free trial session has ended. Sessions are limited to 30 minutes to ensure fair usage for all users.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={handleRestart}
            size="lg"
            className="w-full"
          >
            Start New Session
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Want unlimited access? Deploy your own instance with the{' '}
            <a 
              href="https://github.com/customgpt/customgpt-ui-starter" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              CustomGPT UI Starter Kit
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}