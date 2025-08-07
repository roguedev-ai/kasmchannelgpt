import React from 'react';
import { X, Calendar, User, Hash, Clock, AlertCircle, Copy, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Conversation } from '@/types';
import { Button } from '@/components/ui/button';
import { formatTimestamp } from '@/lib/utils';

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-0 top-[10%] mx-auto max-w-2xl bg-white rounded-lg shadow-xl z-50 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Conversation Details</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Basic Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Conversation Name</span>
                    </div>
                    <span className="text-sm text-gray-900 font-medium">{conversation.name}</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Conversation ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 font-mono">{conversation.id}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(conversation.id.toString(), 'Conversation ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Session ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 font-mono truncate max-w-[300px]" title={conversation.session_id}>
                        {conversation.session_id}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(conversation.session_id, 'Session ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Project ID</span>
                    </div>
                    <span className="text-sm text-gray-900">{conversation.project_id}</span>
                  </div>

                  {conversation.message_count !== undefined && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Message Count</span>
                      </div>
                      <span className="text-sm text-gray-900">{conversation.message_count} messages</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Timeline
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Created At</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-900 block">{formatFullTimestamp(conversation.created_at)}</span>
                      <span className="text-xs text-gray-500">({formatTimestamp(conversation.created_at)})</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Last Updated</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-900 block">{formatFullTimestamp(conversation.updated_at)}</span>
                      <span className="text-xs text-gray-500">({formatTimestamp(conversation.updated_at)})</span>
                    </div>
                  </div>

                  {conversation.deleted_at && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-medium text-red-700">Deleted At</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-red-900 block">{formatFullTimestamp(conversation.deleted_at)}</span>
                        <span className="text-xs text-red-500">({formatTimestamp(conversation.deleted_at)})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Information */}
              {conversation.created_by && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    User Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Created By</span>
                      </div>
                      <span className="text-sm text-gray-900">User ID: {conversation.created_by}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Actions
                </h3>
                <div className="flex gap-3">
                  {onExport && (
                    <Button
                      variant="outline"
                      onClick={() => onExport(conversation)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Conversation
                    </Button>
                  )}
                  {onShare && (
                    <Button
                      variant="outline"
                      onClick={() => onShare(conversation)}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share Conversation
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};