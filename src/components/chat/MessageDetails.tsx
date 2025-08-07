/**
 * Message Details Component
 * 
 * Displays additional metadata and information about a message
 * that's not shown in the main UI. Includes user ID, conversation ID,
 * metadata, and timestamps.
 * 
 * Features:
 * - Collapsible details section
 * - Formatted metadata display
 * - Copy functionality for technical details
 * - Responsive layout
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, copyToClipboard } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { MessageDetails as MessageDetailsType } from '@/types';

interface MessageDetailsProps {
  /** The message details to display */
  details?: MessageDetailsType;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format a key name to be more readable
 */
const formatKey = (key: string): string => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format a value for display
 */
const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

export const MessageDetails: React.FC<MessageDetailsProps> = ({ details, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!details) {
    return null;
  }

  const handleCopyAll = async () => {
    const detailsText = JSON.stringify(details, null, 2);
    const success = await copyToClipboard(detailsText);
    if (success) {
      toast.success('Details copied to clipboard');
    }
  };

  const handleCopyValue = async (value: string) => {
    const success = await copyToClipboard(value);
    if (success) {
      toast.success('Value copied to clipboard');
    }
  };

  return (
    <div className={cn('mt-2', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Info className="w-3 h-3" />
        <span>More Details</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700">Message Details</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyAll}
                  className="h-6 px-2 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy All
                </Button>
              </div>

              <div className="space-y-2">
                {/* Basic Details */}
                {details.user_id !== undefined && (
                  <DetailRow
                    label="User ID"
                    value={String(details.user_id)}
                    onCopy={handleCopyValue}
                  />
                )}
                
                {details.conversation_id !== undefined && (
                  <DetailRow
                    label="Conversation ID"
                    value={String(details.conversation_id)}
                    onCopy={handleCopyValue}
                  />
                )}
                
                {details.updated_at && (
                  <DetailRow
                    label="Updated At"
                    value={new Date(details.updated_at).toLocaleString()}
                    onCopy={handleCopyValue}
                  />
                )}

                {/* Metadata Section */}
                {details.metadata && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Metadata</h5>
                    
                    {details.metadata.user_ip && (
                      <DetailRow
                        label="User IP"
                        value={details.metadata.user_ip}
                        onCopy={handleCopyValue}
                      />
                    )}
                    
                    {details.metadata.user_agent && (
                      <DetailRow
                        label="User Agent"
                        value={details.metadata.user_agent}
                        onCopy={handleCopyValue}
                        truncate
                      />
                    )}
                    
                    {details.metadata.external_id && (
                      <DetailRow
                        label="External ID"
                        value={details.metadata.external_id}
                        onCopy={handleCopyValue}
                      />
                    )}
                    
                    {details.metadata.request_source && (
                      <DetailRow
                        label="Request Source"
                        value={details.metadata.request_source}
                        onCopy={handleCopyValue}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  onCopy: (value: string) => void;
  truncate?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, onCopy, truncate }) => {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-gray-600 font-medium whitespace-nowrap">{label}:</span>
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span 
          className={cn(
            "text-gray-800 break-all",
            truncate && "truncate"
          )}
          title={truncate ? value : undefined}
        >
          {value}
        </span>
        <button
          onClick={() => onCopy(value)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          title="Copy value"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};