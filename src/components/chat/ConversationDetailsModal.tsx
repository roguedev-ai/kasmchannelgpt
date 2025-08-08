import React from 'react';
import { X, Calendar, User, Hash, Clock, AlertCircle, Copy, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Conversation } from '@/types';
import { Button } from '@/components/ui/button';
import { formatTimestamp, cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface ConversationDetailsModalProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
  onExport?: (conversation: Conversation) => void;
  onShare?: (conversation: Conversation) => void;
}

export const ConversationDetailsModal: React.FC<ConversationDetailsModalProps> = ({
  conversation,
  isOpen,
  onClose,
  onExport,
  onShare,
}) => {
  const { isMobile } = useBreakpoint();
  
  if (!isOpen || !conversation) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatFullTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

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
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: isMobile ? '100%' : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: isMobile ? '100%' : 0 }}
            className={cn(
              "fixed bg-background shadow-xl z-50",
              isMobile 
                ? "inset-x-0 bottom-0 top-20 rounded-t-xl flex flex-col" 
                : "inset-x-0 top-[10%] mx-auto max-w-2xl rounded-lg max-h-[80vh] overflow-hidden"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={cn(
              "flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0",
              isMobile ? "px-4 py-4" : "p-6"
            )}>
              <h2 className={cn(
                "font-semibold text-foreground",
                isMobile ? "text-base" : "text-xl"
              )}>Conversation Details</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className={cn(
                  isMobile ? "h-9 w-9 touch-target" : "h-8 w-8"
                )}
              >
                <X className={cn(
                  isMobile ? "h-5 w-5" : "h-4 w-4"
                )} />
              </Button>
            </div>

            {/* Content */}
            <div className={cn(
              "overflow-y-auto",
              isMobile 
                ? "flex-1 px-4 py-4 pb-6 safe-area-pb space-y-6" 
                : "p-6 space-y-6 max-h-[calc(80vh-200px)]"
            )}>
              {/* Basic Information */}
              <div>
                <h3 className={cn(
                  "font-medium text-muted-foreground uppercase tracking-wider mb-4",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Basic Information
                </h3>
                <div className={cn(
                  "bg-muted rounded-lg space-y-4",
                  isMobile ? "p-4" : "p-4 space-y-3"
                )}>
                  {/* Conversation Name */}
                  <div className={cn(
                    isMobile ? "space-y-2" : "flex items-start justify-between"
                  )}>
                    <div className="flex items-center gap-2">
                      <Hash className={cn(
                        "text-muted-foreground",
                        isMobile ? "h-4 w-4" : "h-4 w-4"
                      )} />
                      <span className={cn(
                        "font-medium text-foreground",
                        isMobile ? "text-sm" : "text-sm"
                      )}>Conversation Name</span>
                    </div>
                    <span className={cn(
                      "text-foreground font-medium break-words",
                      isMobile ? "text-sm ml-6 block" : "text-sm"
                    )}>{conversation.name}</span>
                  </div>

                  {/* Conversation ID */}
                  <div className={cn(
                    isMobile ? "space-y-2" : "flex items-start justify-between"
                  )}>
                    <div className="flex items-center gap-2">
                      <Hash className={cn(
                        "text-muted-foreground",
                        isMobile ? "h-4 w-4" : "h-4 w-4"
                      )} />
                      <span className={cn(
                        "font-medium text-foreground",
                        isMobile ? "text-sm" : "text-sm"
                      )}>Conversation ID</span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2",
                      isMobile ? "ml-6" : ""
                    )}>
                      <span className={cn(
                        "text-foreground font-mono",
                        isMobile ? "text-xs" : "text-sm"
                      )}>{conversation.id}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          isMobile ? "h-8 w-8 touch-target" : "h-6 w-6"
                        )}
                        onClick={() => copyToClipboard(conversation.id.toString(), 'Conversation ID')}
                      >
                        <Copy className={cn(
                          isMobile ? "h-4 w-4" : "h-3 w-3"
                        )} />
                      </Button>
                    </div>
                  </div>

                  {/* Session ID */}
                  <div className={cn(
                    isMobile ? "space-y-2" : "flex items-start justify-between"
                  )}>
                    <div className="flex items-center gap-2">
                      <Hash className={cn(
                        "text-muted-foreground",
                        isMobile ? "h-4 w-4" : "h-4 w-4"
                      )} />
                      <span className={cn(
                        "font-medium text-foreground",
                        isMobile ? "text-sm" : "text-sm"
                      )}>Session ID</span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2",
                      isMobile ? "ml-6" : ""
                    )}>
                      <span 
                        className={cn(
                          "text-foreground font-mono break-all",
                          isMobile ? "text-sm" : "text-sm truncate max-w-[300px]"
                        )} 
                        title={conversation.session_id}
                      >
                        {conversation.session_id}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          isMobile ? "h-8 w-8 touch-target flex-shrink-0" : "h-6 w-6"
                        )}
                        onClick={() => copyToClipboard(conversation.session_id, 'Session ID')}
                      >
                        <Copy className={cn(
                          isMobile ? "h-4 w-4" : "h-3 w-3"
                        )} />
                      </Button>
                    </div>
                  </div>

                  {/* Project ID */}
                  <div className={cn(
                    isMobile ? "space-y-2" : "flex items-start justify-between"
                  )}>
                    <div className="flex items-center gap-2">
                      <Hash className={cn(
                        "text-muted-foreground",
                        isMobile ? "h-4 w-4" : "h-4 w-4"
                      )} />
                      <span className={cn(
                        "font-medium text-foreground",
                        isMobile ? "text-sm" : "text-sm"
                      )}>Project ID</span>
                    </div>
                    <span className={cn(
                      "text-foreground",
                      isMobile ? "text-sm ml-6 block" : "text-sm"
                    )}>{conversation.project_id}</span>
                  </div>

                  {/* Message Count */}
                  {conversation.message_count !== undefined && (
                    <div className={cn(
                      isMobile ? "space-y-2" : "flex items-start justify-between"
                    )}>
                      <div className="flex items-center gap-2">
                        <Hash className={cn(
                          "text-muted-foreground",
                          isMobile ? "h-4 w-4" : "h-4 w-4"
                        )} />
                        <span className={cn(
                          "font-medium text-foreground",
                          isMobile ? "text-sm" : "text-sm"
                        )}>Message Count</span>
                      </div>
                      <span className={cn(
                        "text-foreground",
                        isMobile ? "text-sm ml-6 block" : "text-sm"
                      )}>{conversation.message_count} messages</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className={cn(
                  "font-medium text-muted-foreground uppercase tracking-wider mb-4",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Timeline
                </h3>
                <div className={cn(
                  "bg-muted rounded-lg space-y-4",
                  isMobile ? "p-4" : "p-4 space-y-3"
                )}>
                  {/* Created At */}
                  <div className={cn(
                    isMobile ? "space-y-2" : "flex items-start justify-between"
                  )}>
                    <div className="flex items-center gap-2">
                      <Calendar className={cn(
                        "text-muted-foreground",
                        isMobile ? "h-4 w-4" : "h-4 w-4"
                      )} />
                      <span className={cn(
                        "font-medium text-foreground",
                        isMobile ? "text-sm" : "text-sm"
                      )}>Created At</span>
                    </div>
                    <div className={cn(
                      isMobile ? "ml-6 space-y-1" : "text-right"
                    )}>
                      <span className={cn(
                        "text-foreground block",
                        isMobile ? "text-sm" : "text-sm"
                      )}>{formatFullTimestamp(conversation.created_at)}</span>
                      <span className={cn(
                        "text-muted-foreground",
                        isMobile ? "text-xs" : "text-xs"
                      )}>({formatTimestamp(conversation.created_at)})</span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className={cn(
                    isMobile ? "space-y-2" : "flex items-start justify-between"
                  )}>
                    <div className="flex items-center gap-2">
                      <Clock className={cn(
                        "text-muted-foreground",
                        isMobile ? "h-4 w-4" : "h-4 w-4"
                      )} />
                      <span className={cn(
                        "font-medium text-foreground",
                        isMobile ? "text-sm" : "text-sm"
                      )}>Last Updated</span>
                    </div>
                    <div className={cn(
                      isMobile ? "ml-6 space-y-1" : "text-right"
                    )}>
                      <span className={cn(
                        "text-foreground block",
                        isMobile ? "text-sm" : "text-sm"
                      )}>{formatFullTimestamp(conversation.updated_at)}</span>
                      <span className={cn(
                        "text-muted-foreground",
                        isMobile ? "text-xs" : "text-xs"
                      )}>({formatTimestamp(conversation.updated_at)})</span>
                    </div>
                  </div>

                  {/* Deleted At */}
                  {conversation.deleted_at && (
                    <div className={cn(
                      isMobile ? "space-y-2" : "flex items-start justify-between"
                    )}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className={cn(
                          "text-red-400",
                          isMobile ? "h-4 w-4" : "h-4 w-4"
                        )} />
                        <span className={cn(
                          "font-medium text-red-700",
                          isMobile ? "text-sm" : "text-sm"
                        )}>Deleted At</span>
                      </div>
                      <div className={cn(
                        isMobile ? "ml-6 space-y-1" : "text-right"
                      )}>
                        <span className={cn(
                          "text-red-900 block",
                          isMobile ? "text-sm" : "text-sm"
                        )}>{formatFullTimestamp(conversation.deleted_at)}</span>
                        <span className={cn(
                          "text-red-500",
                          isMobile ? "text-xs" : "text-xs"
                        )}>({formatTimestamp(conversation.deleted_at)})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Information */}
              {conversation.created_by && (
                <div>
                  <h3 className={cn(
                    "font-medium text-muted-foreground uppercase tracking-wider mb-4",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    User Information
                  </h3>
                  <div className={cn(
                    "bg-accent rounded-lg",
                    isMobile ? "p-4" : "p-4"
                  )}>
                    <div className={cn(
                      isMobile ? "space-y-2" : "flex items-start justify-between"
                    )}>
                      <div className="flex items-center gap-2">
                        <User className={cn(
                          "text-muted-foreground",
                          isMobile ? "h-4 w-4" : "h-4 w-4"
                        )} />
                        <span className={cn(
                          "font-medium text-foreground",
                          isMobile ? "text-sm" : "text-sm"
                        )}>Created By</span>
                      </div>
                      <span className={cn(
                        "text-foreground",
                        isMobile ? "text-sm ml-6 block" : "text-sm"
                      )}>User ID: {conversation.created_by}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div>
                <h3 className={cn(
                  "font-medium text-muted-foreground uppercase tracking-wider mb-4",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Actions
                </h3>
                <div className={cn(
                  "flex gap-3",
                  isMobile ? "flex-col space-y-3" : "flex-row"
                )}>
                  {onExport && (
                    <Button
                      variant="outline"
                      onClick={() => onExport(conversation)}
                      className={cn(
                        "flex items-center gap-2",
                        isMobile ? "w-full h-11 touch-target justify-center" : ""
                      )}
                    >
                      <Download className={cn(
                        isMobile ? "h-5 w-5" : "h-4 w-4"
                      )} />
                      <span className={cn(
                        isMobile ? "text-sm" : ""
                      )}>Export Conversation</span>
                    </Button>
                  )}
                  {onShare && (
                    <Button
                      variant="outline"
                      onClick={() => onShare(conversation)}
                      className={cn(
                        "flex items-center gap-2",
                        isMobile ? "w-full h-11 touch-target justify-center" : ""
                      )}
                    >
                      <Share2 className={cn(
                        isMobile ? "h-5 w-5" : "h-4 w-4"
                      )} />
                      <span className={cn(
                        isMobile ? "text-sm" : ""
                      )}>Share Conversation</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            {!isMobile && (
              <div className="p-6 border-t border-border bg-accent">
                <div className="flex justify-end">
                  <Button onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};