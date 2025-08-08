'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  User,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Hash,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

import { MessageDetails } from '@/components/messages/MessageDetails';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getClient } from '@/lib/api/client';
import type { ChatMessage } from '@/types';

interface ConversationMessagesProps {
  projectId: number;
  conversationId: number;
  sessionId: string;
}

interface MessageItemProps {
  message: ChatMessage;
  onSelect: () => void;
  isSelected: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onSelect, isSelected }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getFeedbackIcon = () => {
    if (!message.feedback) return null;
    
    switch (message.feedback) {
      case 'like':
        return <ThumbsUp className="h-3 w-3 text-green-600" />;
      case 'dislike':
        return <ThumbsDown className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer',
        isSelected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white'
      )}
      onClick={onSelect}
    >
      {/* Message Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {message.role === 'user' ? (
            <User className="h-4 w-4 text-blue-500" />
          ) : (
            <Bot className="h-4 w-4 text-brand-500" />
          )}
          <span className="text-sm font-medium text-gray-900 capitalize">{message.role}</span>
          {getFeedbackIcon()}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          {new Date(message.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Message Content */}
      <div className="mb-3">
        <p className="text-sm text-gray-600">
          {expanded ? message.content : truncateText(message.content)}
        </p>
      </div>

      {/* Metadata Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {message.citations && message.citations.length > 0 && (
            <div className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <span>{message.citations.length} citations</span>
            </div>
          )}
          {message.status && (
            <span className="capitalize">Status: {message.status}</span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="h-6 px-2 text-xs"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              More
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export const ConversationMessages: React.FC<ConversationMessagesProps> = ({
  projectId,
  conversationId,
  sessionId,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeedback, setFilterFeedback] = useState<'all' | 'like' | 'dislike' | 'none'>('all');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [projectId, sessionId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getClient();
      const response = await client.getMessages(projectId, sessionId);
      
      // The API returns data in the format: { conversation: {...}, messages: { data: [...] } }
      let apiMessages: any[] = [];
      
      if (response.data && typeof response.data === 'object' && 'messages' in response.data) {
        // Extract messages from the nested structure
        const responseData = response.data as any;
        apiMessages = responseData.messages?.data || [];
      } else if (Array.isArray(response.data)) {
        // Fallback: flat array structure
        apiMessages = response.data;
      } else {
        console.warn('Unexpected response structure:', response);
        apiMessages = [];
      }
      
      // Map API messages to ChatMessage format
      const formattedMessages: ChatMessage[] = apiMessages.map((msg: any) => {
        // Determine role based on message structure
        const isUserMessage = msg.user_query ? true : false;
        
        return {
          id: msg.id?.toString() || '',
          role: isUserMessage ? 'user' : 'assistant',
          content: isUserMessage ? msg.user_query : msg.openai_response,
          timestamp: msg.created_at || new Date().toISOString(),
          citations: msg.citations || [],
          feedback: msg.response_feedback?.reaction === 'liked' ? 'like' : 
                   msg.response_feedback?.reaction === 'disliked' ? 'dislike' : 
                   undefined,
          status: 'sent',
          details: {
            user_id: msg.user_id,
            conversation_id: msg.conversation_id,
            updated_at: msg.updated_at,
            metadata: msg.metadata
          }
        };
      });
      
      // If API returns both user_query and openai_response in same object, split them
      const splitMessages: ChatMessage[] = [];
      apiMessages.forEach((msg: any) => {
        if (msg.user_query) {
          splitMessages.push({
            id: `${msg.id}-user`,
            role: 'user',
            content: msg.user_query,
            timestamp: msg.created_at || new Date().toISOString(),
            status: 'sent'
          });
        }
        if (msg.openai_response) {
          splitMessages.push({
            id: `${msg.id}-assistant`,
            role: 'assistant',
            content: msg.openai_response,
            timestamp: msg.created_at || new Date().toISOString(),
            citations: msg.citations || [],
            feedback: msg.response_feedback?.reaction === 'liked' ? 'like' : 
                     msg.response_feedback?.reaction === 'disliked' ? 'dislike' : 
                     undefined,
            status: 'sent',
            details: {
              user_id: msg.user_id,
              conversation_id: msg.conversation_id,
              updated_at: msg.updated_at,
              metadata: msg.metadata
            }
          });
        }
      });
      
      console.log('Messages response:', response);
      console.log('Formatted messages:', splitMessages);
      
      setMessages(splitMessages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages');
      toast.error('Failed to load conversation messages');
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = (Array.isArray(messages) ? messages : []).filter(message => {
    // Search filter
    if (searchQuery && !message.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Feedback filter
    if (filterFeedback !== 'all') {
      if (!message.feedback && filterFeedback === 'none') return true;
      if (!message.feedback && filterFeedback !== 'none') return false;
      if (message.feedback && message.feedback !== filterFeedback) return false;
    }
    
    return true;
  });

  return (
    <div className="h-full flex overflow-hidden">
      {/* Messages List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Sticky */}
        <div className="px-6 pt-6 pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversation Messages</h2>
              <p className="text-muted-foreground">
                View and manage messages for conversation #{conversationId}
              </p>
            </div>

            {/* Filters */}
            <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterFeedback}
                  onChange={(e) => setFilterFeedback(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Feedback</option>
                  <option value="like">Liked</option>
                  <option value="dislike">Disliked</option>
                  <option value="none">No Feedback</option>
                </select>
              </div>
              
              <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </Card>
          </div>
        </div>
        
        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
            {loading ? (
              // Loading state
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </Card>
              ))
            ) : error ? (
              // Error state
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load messages</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchMessages} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </Card>
            ) : filteredMessages.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No messages found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || filterFeedback !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'This conversation has no messages yet'}
                </p>
              </Card>
            ) : (
              filteredMessages.map(message => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onSelect={() => setSelectedMessage(message.id)}
                  isSelected={selectedMessage === message.id}
                />
              ))
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Message Details Panel */}
      {selectedMessage && (
        <div className="w-[500px] border-l border-gray-200 bg-gray-50 overflow-y-auto">
          <MessageDetails
            projectId={projectId}
            sessionId={sessionId}
            messageId={parseInt(selectedMessage)}
            onClose={() => setSelectedMessage(null)}
          />
        </div>
      )}
    </div>
  );
};