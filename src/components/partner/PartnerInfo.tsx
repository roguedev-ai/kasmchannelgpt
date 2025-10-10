/**
 * Partner Info Component
 * 
 * Displays current partner session information and status
 * in a collapsible widget.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  LogOut, 
  User,
  Files,
  Clock,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { sessionManager } from '@/lib/session/partner-session';
import { mockClient } from '@/lib/api/mock-client';
import { cn } from '@/lib/utils';

interface PartnerInfoProps {
  onLogout?: () => void;
  className?: string;
}

export function PartnerInfo({ 
  onLogout,
  className 
}: PartnerInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { partnerId } = sessionManager.useSession();
  const [uploadCount, setUploadCount] = useState(0);
  const [sessionStartTime] = useState(Date.now());

  // Get session duration in minutes
  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 60000);

  // Fetch upload count on mount and when expanded
  React.useEffect(() => {
    if (partnerId && isExpanded) {
      // In a real app, this would be a separate API call
      // For mock data, we'll simulate some uploads
      setUploadCount(Math.floor(Math.random() * 5) + 1);
    }
  }, [partnerId, isExpanded]);

  const handleLogout = () => {
    sessionManager.clearSession();
    toast.success('Logged out successfully');
    onLogout?.();
  };

  if (!partnerId) return null;

  // Extract email from partner ID (mock data)
  const partnerEmail = `${partnerId}@example.com`;

  return (
    <div className={cn("relative", className)}>
      {/* Collapsed View */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 justify-between",
          "hover:bg-accent/50 transition-colors",
          isExpanded && "bg-accent/30"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <User className="w-4 h-4 text-muted-foreground" />
            {/* Active status indicator */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
          </div>
          <span className="text-sm font-medium">{partnerId}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          isExpanded && "rotate-180"
        )} />
      </Button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-accent/20 rounded-b-lg border-t">
              {/* Partner Stats */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{partnerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Files className="w-4 h-4" />
                  <span>{uploadCount} files uploaded</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Session: {sessionDuration}m</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
