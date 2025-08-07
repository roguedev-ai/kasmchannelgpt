import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={!isDeleting ? onCancel : undefined}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background rounded-lg shadow-xl z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    Delete Conversation
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Are you sure you want to delete <strong>"{conversationName}"</strong>?
                  </p>
                  
                  {messageCount !== undefined && messageCount > 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      This conversation contains {messageCount} message{messageCount !== 1 ? 's' : ''}.
                    </p>
                  )}
                  
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ This action cannot be undone
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      All messages and data associated with this conversation will be permanently deleted.
                    </p>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-900 font-medium">
                        Error: {error}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="min-w-[100px]"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};