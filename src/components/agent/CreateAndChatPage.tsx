import { ChatContainer } from '../chat/ChatContainer';

export function CreateAndChatPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ChatContainer partnerId="demo" />
      </div>
    </div>
  );
}
