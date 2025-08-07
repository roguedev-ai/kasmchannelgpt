'use client';

import React, { useEffect, useState } from 'react';
import { 
  MessageCircle,
  Search,
  Filter,
  RefreshCw,
  Download,
  Share2,
  Trash2,
  Eye,
  Users,
  Clock,
  AlertCircle,
  Calendar,
  BarChart3,
  ExternalLink,
  Archive,
  Star,
  MessageSquare,
  User,
  Globe,
  Lock,
  Settings,
  Plus,
  FileDown,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatTimestamp, handleApiError } from '@/lib/utils';
import { getClient, isClientInitialized } from '@/lib/api/client';
import type { Agent, Conversation, ConversationsResponse } from '@/types';
import { ConversationMessages } from '@/components/projects/ConversationMessages';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConversationsSettingsProps {
  project: Agent;
}

export const ConversationsSettings: React.FC<ConversationsSettingsProps> = ({ project }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showMessagesModal, setShowMessagesModal] = useState(false);


  useEffect(() => {
    loadConversations();
  }, [project.id, currentPage]);

  const loadConversations = async () => {
    if (!isClientInitialized()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = getClient();
      const response = await client.getConversations(project.id, {
        page: currentPage,
        per_page: 10
      });
      
      setConversations(response.data.data);
      setCurrentPage(response.data.current_page);
      setTotalPages(response.data.last_page);
      setTotal(response.data.total);
    } catch (err) {
      const errorData = handleApiError(err);
      setError(errorData.message);
      toast.error('Failed to load conversations', {
        description: errorData.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadConversations();
  };

  const handleDeleteConversation = async (sessionId: string) => {
    if (!isClientInitialized()) {
      return;
    }

    try {
      const client = getClient();
      await client.deleteConversation(project.id, sessionId);
      toast.success('Conversation deleted');
      loadConversations();
    } catch (err) {
      const errorData = handleApiError(err);
      toast.error('Failed to delete conversation', {
        description: errorData.message
      });
    }
  };


  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      (conv.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.session_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });


  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conversations</h2>
          <p className="text-gray-600 mt-1">
            Manage chat history, sharing, and analytics for {project.project_name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          
          <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
            GET /projects/{project.id}/conversations
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading conversations</span>
          </div>
          <p className="text-red-700 mt-1 text-sm">{error}</p>
          {error.includes('403') && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="text-yellow-800">
                <strong>Premium Feature:</strong> Advanced conversation management may require a premium subscription.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Card */}
      <Card className="p-4 mb-6">
        <div className="flex items-center">
          <MessageCircle className="w-8 h-8 text-blue-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Conversations</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations by name or session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      {loading && conversations.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? 'Try adjusting your search or filters'
              : 'Conversations will appear here once users start chatting with your agent'
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => {
            return (
              <Card key={conversation.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-brand-600" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                          {conversation.name || `Conversation ${conversation.id}`}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>Session ID: {conversation.session_id}</span>
                          {conversation.created_by && (
                            <span>User ID: {conversation.created_by}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>Created {formatTimestamp(conversation.created_at)}</span>
                      {conversation.updated_at && (
                        <span>Updated {formatTimestamp(conversation.updated_at)}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedConversation(conversation);
                          setShowMessagesModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Messages
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteConversation(conversation.session_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Messages Modal */}
      <Dialog 
        open={showMessagesModal} 
        onOpenChange={(open) => {
          setShowMessagesModal(open);
          if (!open) {
            setSelectedConversation(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Conversation Messages</DialogTitle>
          </DialogHeader>
          
          {selectedConversation && (
            <div className="flex-1 overflow-hidden">
              <ConversationMessages
                projectId={project.id}
                conversationId={selectedConversation.id}
                sessionId={selectedConversation.session_id}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};