import { useChat } from '@/hooks/useChat';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';

interface ChatContainerProps {
  partnerId: string;
}

export function ChatContainer({ partnerId }: ChatContainerProps) {
  const {
    messages,
    isLoading,
    isUploading,
    sendMessage,
    uploadFile,
    clearMessages,
  } = useChat({ partnerId });
  
  return (
    <div className="flex flex-col h-full">
      <ChatMessages messages={messages} />
      <ChatInput
        onSend={sendMessage}
        onUpload={uploadFile}
        isLoading={isLoading}
        isUploading={isUploading}
      />
    </div>
  );
}
