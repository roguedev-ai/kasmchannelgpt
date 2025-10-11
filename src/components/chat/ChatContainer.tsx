import React from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';
import { ChatHeader } from './ChatHeader';

export interface ChatContainerProps {
  partnerId: string;
  agentFunction?: 'sales' | 'support' | 'technical' | 'general';
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  partnerId,
  agentFunction,
}) => {
  const {
    messages,
    isLoading,
    sendMessage,
    uploadFile,
    isUploading,
  } = useChat(partnerId, agentFunction);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessages 
          messages={messages}
          isLoading={isLoading}
        />
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <ChatInput
          onSendMessage={sendMessage}
          onUploadFile={uploadFile}
          isLoading={isLoading}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
};
