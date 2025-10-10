/**
 * Partner Chat Layout
 * 
 * Modified version of ChatLayout that includes:
 * - Partner session information
 * - Logout functionality
 * - Integration with mock API
 * - Message history from partner store
 */

import React, { useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PartnerChatContainer } from './PartnerChatContainer';
import { sessionManager } from '@/lib/session/partner-session';
import { usePartnerMessageStore } from '@/store/partner-messages';
import { cn } from '@/lib/utils';

interface PartnerChatLayoutProps {
  className?: string;
  onLogout?: () => void;
}

export function PartnerChatLayout({ 
  className,
  onLogout 
}: PartnerChatLayoutProps) {
  // Get partner session
  const { partnerId } = sessionManager.useSession();
  
  // Get message store
  const { 
    messages,
    streamingMessage,
    isStreaming,
    sendMessage,
    getMessages,
    clearMessages
  } = usePartnerMessageStore();

  // Load messages on mount and when partner changes
  useEffect(() => {
    if (partnerId) {
      getMessages(partnerId);
    }
  }, [partnerId, getMessages]);

  const handleLogout = () => {
    // Clear messages first
    clearMessages();
    
    // Clear session
    sessionManager.clearSession();
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Notify parent
    onLogout?.();
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      className
    )}>
      {/* Partner Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-medium">Partner Session</h2>
            <p className="text-xs text-muted-foreground">
              {partnerId || 'Not authenticated'}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        <PartnerChatContainer
          className="h-full"
          messages={partnerId ? messages.get(partnerId) || [] : []}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
          onMessage={async (content: string, files?: File[]) => {
            if (!partnerId) {
              toast.error('Not authenticated');
              return;
            }
            try {
              await sendMessage(content, files);
            } catch (error) {
              console.error('Failed to send message:', error);
              toast.error('Failed to send message');
            }
          }}
        />
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * function App() {
 *   return (
 *     <PartnerGuard>
 *       <PartnerChatLayout 
 *         onLogout={() => {
 *           console.log('User logged out');
 *         }}
 *       />
 *     </PartnerGuard>
 *   );
 * }
 */
