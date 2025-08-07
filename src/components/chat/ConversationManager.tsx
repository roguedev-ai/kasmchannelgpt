/**
 * Conversation Manager Component
 * 
 * Provides conversation switching UI for widget and floating modes.
 * Shows a list of conversations with ability to create new ones and switch between them.
 * 
 * Features:
 * - Conversation list with titles and timestamps
 * - Create new conversation button
 * - Switch between conversations
 * - Edit conversation titles inline
 * - Delete conversations
 * - Session-based isolation
 */

import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, Edit2, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: any[];
}

interface ConversationManagerProps {
  sessionId: string;
  maxConversations?: number;
  currentConversationId?: string;
  onConversationChange?: (conversation: Conversation) => void;
  onCreateConversation?: () => void;
  className?: string;
  refreshKey?: number; // Add refresh key to force re-render
}

export const ConversationManager: React.FC<ConversationManagerProps> = ({
  sessionId,
  maxConversations,
  currentConversationId,
  onConversationChange,
  onCreateConversation,
  className,
  refreshKey,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Load conversations from localStorage
  useEffect(() => {
    const loadConversations = () => {
      const stored = localStorage.getItem(`customgpt_conversations_${sessionId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setConversations(parsed);
        } catch (e) {
          console.error('Failed to parse conversations:', e);
        }
      }
    };

    loadConversations();
    // Listen for storage changes
    window.addEventListener('storage', loadConversations);
    return () => window.removeEventListener('storage', loadConversations);
  }, [sessionId, refreshKey]); // Add refreshKey as dependency

  const handleCreateConversation = () => {
    if (maxConversations && conversations.length >= maxConversations) {
      toast.error(`You've reached the maximum limit of ${maxConversations} conversations. Please delete an existing conversation to create a new one.`);
      return;
    }
    onCreateConversation?.();
  };

  const handleSelectConversation = (conversation: Conversation) => {
    onConversationChange?.(conversation);
    setIsExpanded(false);
  };

  const handleEditStart = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleEditSave = (conversationId: string) => {
    const updated = conversations.map(c =>
      c.id === conversationId ? { ...c, title: editTitle } : c
    );
    setConversations(updated);
    localStorage.setItem(
      `customgpt_conversations_${sessionId}`,
      JSON.stringify(updated)
    );
    setEditingId(null);
  };

  const handleDelete = (conversationId: string) => {
    if (conversations.length <= 1) {
      toast.error('Cannot delete the last conversation');
      return;
    }
    
    const filtered = conversations.filter(c => c.id !== conversationId);
    setConversations(filtered);
    localStorage.setItem(
      `customgpt_conversations_${sessionId}`,
      JSON.stringify(filtered)
    );
    
    // If deleting current conversation, switch to another
    if (currentConversationId === conversationId && filtered.length > 0) {
      onConversationChange?.(filtered[0]);
    }
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  return (
    <div className={cn('relative', className)}>
      {/* Collapsed View */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="truncate flex-1 text-left">
          {currentConversation?.title || 'Select Conversation'}
        </span>
        <svg
          className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto"
          >
            {/* New Conversation Button */}
            <button
              onClick={handleCreateConversation}
              disabled={maxConversations ? conversations.length >= maxConversations : false}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed border-b"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>

            {/* Conversation List */}
            <div className="py-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    'group flex items-center px-4 py-2 hover:bg-gray-50',
                    currentConversationId === conversation.id && 'bg-brand-50'
                  )}
                >
                  {editingId === conversation.id ? (
                    // Edit Mode
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(conversation.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditSave(conversation.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <button
                        onClick={() => handleSelectConversation(conversation)}
                        className="flex-1 text-left"
                      >
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {conversation.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditStart(conversation)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(conversation.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};