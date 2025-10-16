import { useState, useCallback, ChangeEvent } from 'react';
import { toast } from 'sonner';
import { sessionManager } from '@/lib/session/partner-session';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  onUpload: (text: string, metadata: any) => Promise<any>;
  isLoading: boolean;
  isUploading: boolean;
}

export function ChatInput({
  onSend,
  onUpload,
  isLoading,
  isUploading,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  
  const handleSubmit = useCallback(async () => {
    if (!message.trim() || isLoading) return;
    
    await onSend(message.trim());
    setMessage('');
  }, [message, isLoading, onSend]);
  
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );
  
  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    
    try {
      // Create FormData with the actual file
      const formData = new FormData();
      formData.append('file', file);
      
      // Get auth token
      const token = sessionManager.getToken();
      
      // Upload using FormData
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const result = await response.json();
      toast.success(`Uploaded ${file.name}`);
      
      if (onUpload) {
        onUpload(result.filename, {
          filename: file.name,
          type: file.type,
          size: file.size
        });
      }
      
    } catch (error) {
      console.error('[Chat] Upload error:', error);
      toast.error('Upload failed: ' + (error as Error).message);
    }
  }, [onUpload]);
  
  return (
    <div className="border-t p-4">
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer p-2 rounded hover:bg-gray-100 ${
            isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          📎
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
          className={`p-2 rounded bg-blue-500 text-white hover:bg-blue-600 ${
            isLoading || !message.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
