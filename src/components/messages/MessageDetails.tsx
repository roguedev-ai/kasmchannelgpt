'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Hash,
  AlertCircle,
  Info,
  Globe,
  Smartphone,
  ExternalLink
} from 'lucide-react';

import { getClient, isClientInitialized } from '@/lib/api/client';
import type { APIMessage, MessageFeedback } from '@/types/message.types';
import { cn, formatTimestamp } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MessageDetailsProps {
  projectId: number;
  sessionId: string;
  messageId: number;
  onClose?: () => void;
}

export const MessageDetails: React.FC<MessageDetailsProps> = ({
  projectId,
  sessionId,
  messageId,
  onClose,
}) => {
  const [message, setMessage] = useState<APIMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingFeedback, setUpdatingFeedback] = useState(false);

  const fetchMessage = async () => {
    if (!isClientInitialized()) {
      setError('API client not initialized');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const client = getClient();
      const response = await client.getMessageById(projectId, sessionId, messageId);
      setMessage(response.data);
    } catch (err: any) {
      console.error('Failed to fetch message:', err);
      
      if (err.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.status === 404) {
        setError(`Message with ID ${messageId} not found.`);
      } else if (err.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load message details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFeedback = async (reaction: 'liked' | 'disliked') => {
    if (!message || !isClientInitialized()) return;

    try {
      setUpdatingFeedback(true);
      const client = getClient();
      
      // Map the reaction to API feedback format
      const feedbackValue = reaction === 'liked' ? 'thumbs_up' : 'thumbs_down';
      
      await client.updateMessageFeedback(
        projectId,
        sessionId,
        messageId,
        { feedback: feedbackValue }
      );
      
      // Update the local message state with the new feedback
      if (message) {
        setMessage({
          ...message,
          response_feedback: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: 0, // This will be set by the server
            reaction: reaction
          }
        });
      }
      
      toast.success('Feedback updated successfully');
    } catch (err: any) {
      console.error('Failed to update feedback:', err);
      
      if (err.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (err.status === 404) {
        toast.error('Message not found.');
      } else {
        toast.error('Failed to update feedback.');
      }
    } finally {
      setUpdatingFeedback(false);
    }
  };

  useEffect(() => {
    fetchMessage();
  }, [projectId, sessionId, messageId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error Loading Message</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Message Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
            <Hash className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Message #{message.id}</h2>
            <p className="text-sm text-gray-600">
              Conversation #{message.conversation_id}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* User Query */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">User Query</span>
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.created_at)}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{message.user_query}</p>
          </div>
        </div>
      </div>

      {/* AI Response */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">AI Response</span>
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.updated_at)}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">
              {message.openai_response.replace(/<CONTEXT>|<\/CONTEXT>/g, '').trim()}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Response Feedback</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={message.response_feedback?.reaction === 'liked' ? 'default' : 'outline'}
            onClick={() => updateFeedback('liked')}
            disabled={updatingFeedback}
            className={cn(
              message.response_feedback?.reaction === 'liked' && 'bg-green-600 hover:bg-green-700'
            )}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Helpful
          </Button>
          <Button
            size="sm"
            variant={message.response_feedback?.reaction === 'disliked' ? 'default' : 'outline'}
            onClick={() => updateFeedback('disliked')}
            disabled={updatingFeedback}
            className={cn(
              message.response_feedback?.reaction === 'disliked' && 'bg-red-600 hover:bg-red-700'
            )}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            Not Helpful
          </Button>
        </div>
        {message.response_feedback && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {formatTimestamp(message.response_feedback.updated_at)}
          </p>
        )}
      </div>

      {/* Citations */}
      {message.citations && message.citations.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Citations</h3>
          <div className="space-y-1">
            {message.citations.map((citationId) => (
              <div key={citationId} className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3 text-blue-600" />
                <span className="text-sm text-blue-700">Citation #{citationId}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {message.metadata && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Metadata</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">IP:</span>
              <span className="font-mono text-gray-700">{message.metadata.user_ip}</span>
            </div>
            <div className="flex items-start gap-2">
              <Smartphone className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="text-gray-600">User Agent:</span>
              <span className="text-gray-700 text-xs break-all">{message.metadata.user_agent}</span>
            </div>
            {message.metadata.external_id && (
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">External ID:</span>
                <span className="font-mono text-gray-700">{message.metadata.external_id}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Source:</span>
              <span className="text-gray-700">{message.metadata.request_source}</span>
            </div>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="border-t pt-4 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Created: {formatTimestamp(message.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Updated: {formatTimestamp(message.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};