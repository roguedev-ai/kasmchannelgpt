import { ChatMessage } from '@/hooks/useChat';

interface ChatMessagesProps {
  messages: ChatMessage[];
}

function MessageSources({ sources }: { sources: ChatMessage['sources'] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2">
      <details className="text-sm">
        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
          📚 Sources ({sources.length})
        </summary>
        <div className="mt-2 space-y-2">
          {sources.map((source, idx) => (
            <div key={idx} className="rounded bg-gray-50 p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{source.source}</span>
                <span className="text-sm text-gray-500">
                  {(source.score * 100).toFixed(0)}% relevance
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700">{source.content}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <div>{message.content}</div>
            {message.role === 'assistant' && message.usedRag && (
              <MessageSources sources={message.sources} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
