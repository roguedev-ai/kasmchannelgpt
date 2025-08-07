'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Settings,
  Share2,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AgentCreationForm } from './AgentCreationForm';
import { ChatLayout } from '../chat/ChatLayout';
import { useAgentStore } from '@/store/agents';
import { useConversationStore } from '@/store/conversations';
import { useMessageStore } from '@/store/messages';
import { toast } from 'sonner';

interface CreateAndChatPageProps {
  className?: string;
}

type ViewMode = 'create' | 'chat' | 'both';

export const CreateAndChatPage: React.FC<CreateAndChatPageProps> = ({ className }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [createdAgent, setCreatedAgent] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const { selectAgent } = useAgentStore();
  const { ensureConversation } = useConversationStore();
  const { sendMessage, error: messageError } = useMessageStore();

  const handleAgentCreated = async (agent: any) => {
    setCreatedAgent(agent);
    
    // Set the agent as current in the store
    selectAgent(agent);
    
    try {
      // Ensure we have a conversation ready
      const conversation = await ensureConversation(agent.id, 'Hello! I just created you. What can you help me with?');
      
      // Switch to chat view
      setViewMode('chat');
      
      // Send an initial test message to see the agent's response
      setTimeout(() => {
        sendMessage('Hello! I just created you as an AI agent. Please introduce yourself and tell me what you can help me with.');
      }, 1000);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Still switch to chat view even if conversation creation fails
      setViewMode('chat');
    }
  };

  const handleBackToCreate = () => {
    setViewMode('create');
    setCreatedAgent(null);
  };

  const handleShowBothViews = () => {
    setViewMode('both');
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/chat/${createdAgent?.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {viewMode === 'chat' && (
            <Button variant="ghost" size="icon" onClick={handleBackToCreate}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
              {viewMode === 'create' ? (
                <Sparkles className="h-5 w-5 text-white" />
              ) : (
                <Bot className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {viewMode === 'create' ? 'Create New Agent' : createdAgent?.project_name}
              </h1>
              <p className="text-sm text-gray-600">
                {viewMode === 'create' 
                  ? 'Build and chat with your AI agent in minutes'
                  : 'Your agent is ready! Start chatting to test it out.'
                }
              </p>
            </div>
          </div>
        </div>

        {(viewMode === 'chat' || viewMode === 'both') && createdAgent && (
          <div className="flex items-center gap-3">
            {viewMode !== 'both' && (
              <Button variant="outline" onClick={handleShowBothViews}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
            
            {createdAgent.settings?.is_shared && (
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateView = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your AI Agent
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Build a custom AI agent that knows your business and can chat with your customers 24/7
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart & Knowledgeable</h3>
            <p className="text-sm text-gray-600">
              Train your agent with your website, documents, and custom instructions
            </p>
          </div>
          
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Chat</h3>
            <p className="text-sm text-gray-600">
              Start chatting immediately after creation to test and refine your agent
            </p>
          </div>
          
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy to Share</h3>
            <p className="text-sm text-gray-600">
              Embed on your website or share a direct link with customers
            </p>
          </div>
        </div>

        {/* Creation Form */}
        <AgentCreationForm
          onAgentCreated={handleAgentCreated}
        />
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Agent Info Bar */}
      <div className="bg-gradient-to-r from-brand-50 to-brand-100 border-b border-brand-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-brand-900">
                🎉 Agent created successfully!
              </p>
              <p className="text-sm text-brand-700">
                Start chatting to test your agent's knowledge and personality
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Authorization Help */}
      {messageError && (messageError.includes('unauthorized') || messageError.includes('403')) && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900 text-sm">
                API Key Permission Issue
              </p>
              <p className="text-amber-800 text-sm mt-1">
                Your API key doesn't have permission to access this agent's conversations. This can happen with newly created agents. 
                Try refreshing the page or check your API key permissions in your CustomGPT dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <ChatLayout 
          showSidebar={false}
          mode="standalone"
        />
      </div>
    </div>
  );

  const renderBothViews = () => (
    <div className="flex-1 flex min-h-0">
      {/* Settings Panel */}
      <div className="w-96 border-r border-gray-200 bg-gray-50 overflow-auto">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Agent Settings</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Basic Info</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Name</span>
                  <p className="text-sm font-medium">{createdAgent?.project_name}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Status</span>
                  <p className="text-sm font-medium text-green-600">Active</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Model</span>
                  <p className="text-sm font-medium">{createdAgent?.settings?.chatbot_model}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Settings
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
                {createdAgent?.settings?.is_shared && (
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Agent
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <h3 className="font-semibold text-gray-900">Test Your Agent</h3>
          <p className="text-sm text-gray-600">Chat with your agent to see how it responds</p>
        </div>
        <div className="flex-1 min-h-0">
          <ChatLayout 
            showSidebar={false}
            mode="standalone"
          />
        </div>
      </div>
    </div>
  );

  const renderShareDialog = () => (
    <AnimatePresence>
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Agent</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direct Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/chat/${createdAgent?.id}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                  />
                  <Button onClick={handleCopyShareLink} size="sm">
                    {copied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Embed Code
                </label>
                <textarea
                  value={`<iframe src="${window.location.origin}/embed/${createdAgent?.id}" width="100%" height="600" frameborder="0"></iframe>`}
                  readOnly
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn('h-screen flex flex-col bg-gray-50', className)}>
      {renderHeader()}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0"
        >
          {viewMode === 'create' && renderCreateView()}
          {viewMode === 'chat' && renderChatView()}
          {viewMode === 'both' && renderBothViews()}
        </motion.div>
      </AnimatePresence>

      {renderShareDialog()}
    </div>
  );
};