import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface DeleteConversationDialogProps {
  isOpen: boolean;
  conversationName: string;
  messageCount?: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeleteConversationDialog: React.FC<DeleteConversationDialogProps> = ({
  isOpen,
  conversationName,
  messageCount,
  onConfirm,
  onCancel,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useBreakpoint();

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm();
    } catch (err: any) {
      console.error('Delete failed:', err);
      
      // Parse error message based on status code
      let errorMessage = 'Failed to delete conversation';
      
      if (err.status === 400) {
        errorMessage = 'Invalid request. Please try again.';
      } else if (err.status === 401) {
        errorMessage = 'Authentication failed. Please refresh the page and try again.';
      } else if (err.status === 404) {
        errorMessage = 'Conversation not found. It may have already been deleted.';
      } else if (err.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={!isDeleting ? onCancel : undefined}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
            className={cn(
              "relative bg-background shadow-xl",
              isMobile 
                ? "fixed inset-x-0 bottom-0 rounded-t-xl safe-area-pb" 
                : "w-full max-w-md rounded-lg"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(
              isMobile ? "p-4 pb-6" : "p-6"
            )}>
              {/* Header */}
              <div className={cn(
                "flex items-start",
                isMobile ? "gap-3" : "gap-4"
              )}>
                <div className={cn(
                  "bg-red-100 rounded-full flex-shrink-0",
                  isMobile ? "p-2.5" : "p-3"
                )}>
                  <AlertTriangle className={cn(
                    "text-red-600",
                    isMobile ? "w-5 h-5" : "w-6 h-6"
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    Delete Conversation
                  </h3>
                  <p className={cn(
                    "mt-2 text-muted-foreground",
                    isMobile ? "text-sm" : "text-sm"
                  )}>
                    Are you sure you want to delete <strong>&ldquo;{conversationName}&rdquo;</strong>?
                  </p>
                  
                  {messageCount !== undefined && messageCount > 0 && (
                    <p className={cn(
                      "mt-2 text-muted-foreground",
                      isMobile ? "text-sm" : "text-sm"
                    )}>
                      This conversation contains {messageCount} message{messageCount !== 1 ? 's' : ''}.
                    </p>
                  )}
                  
                  <div className={cn(
                    "mt-3 bg-red-50 rounded-lg",
                    isMobile ? "p-3" : "p-3"
                  )}>
                    <p className={cn(
                      "text-red-800 font-medium",
                      isMobile ? "text-sm" : "text-sm"
                    )}>
                      ⚠️ This action cannot be undone
                    </p>
                    <p className={cn(
                      "text-red-700 mt-1",
                      isMobile ? "text-xs" : "text-xs"
                    )}>
                      All messages and data associated with this conversation will be permanently deleted.
                    </p>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className={cn(
                      "mt-3 bg-red-100 border border-red-200 rounded-lg",
                      isMobile ? "p-3" : "p-3"
                    )}>
                      <p className={cn(
                        "text-red-900 font-medium",
                        isMobile ? "text-sm" : "text-sm"
                      )}>
                        Error: {error}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={cn(
                "flex items-center gap-3",
                isMobile ? "mt-6 flex-col-reverse" : "mt-6 justify-end"
              )}>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isDeleting}
                  className={cn(
                    isMobile && "w-full h-11 touch-target"
                  )}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className={cn(
                    "min-w-[100px]",
                    isMobile && "w-full h-11 touch-target"
                  )}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className={cn(
                        "mr-2",
                        isMobile ? "w-4 h-4" : "w-4 h-4"
                      )} />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};