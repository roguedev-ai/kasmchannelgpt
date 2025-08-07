/**
 * ChatInput Component
 * 
 * Rich input field for sending messages and uploading files.
 * 
 * Features:
 * - Auto-expanding textarea (up to 200px height)
 * - File upload with drag-and-drop support
 * - File type and size validation
 * - Progress tracking for uploads
 * - Character count display
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Animated file chips and drag overlay
 * 
 * Customization:
 * - Modify CONSTANTS in utils for file limits
 * - Adjust max textarea height (line 144)
 * - Customize accepted file types
 * - Style the drag overlay and file chips
 */

'use client';

import React, { useState, useRef, useCallback, KeyboardEvent, FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Square, 
  Paperclip, 
  X,
  Upload,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

import type { InputProps, FileUpload } from '@/types';
import { cn, formatFileSize, getFileIcon, isFileTypeAllowed, generateId, CONSTANTS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { VoiceButton } from '@/components/voice/VoiceButton';

interface FileChipProps {
  /** File upload object with metadata */
  file: FileUpload;
  /** Handler to remove this file */
  onRemove: () => void;
}

/**
 * FileChip Component
 * 
 * Displays an uploaded or uploading file with:
 * - File icon based on type
 * - Name and size
 * - Upload progress bar
 * - Remove button
 * - Error state indication
 */
const FileChip: React.FC<FileChipProps> = ({ file, onRemove }) => {
  const fileIcon = getFileIcon(file.type);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-accent rounded-lg transition-colors"
    >
      <div className="text-muted-foreground">{fileIcon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {file.name}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{formatFileSize(file.size)}</span>
          {file.status === 'uploading' && (
            <>
              <span>•</span>
              <span>{file.progress}%</span>
            </>
          )}
          {file.status === 'error' && (
            <>
              <span>•</span>
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Error
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      {file.status === 'uploading' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted rounded-b">
          <div 
            className="h-full bg-brand-500 rounded-b transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
      
      <button
        onClick={onRemove}
        className="p-0.5 rounded hover:bg-accent-foreground/20 transition-colors"
        disabled={file.status === 'uploading'}
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
    </motion.div>
  );
};

interface FileUploadButtonProps {
  /** Handler called when files are selected */
  onUpload: (files: File[]) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * FileUploadButton Component
 * 
 * Hidden file input with visible button trigger.
 * Accepts multiple files based on ACCEPTED_FILE_TYPES.
 */
const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onUpload, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
      e.target.value = '';
    }
  };
  
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={CONSTANTS.ACCEPTED_FILE_TYPES.join(',')}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleClick}
        disabled={disabled}
        className="h-10 w-10 text-muted-foreground hover:text-foreground"
        title="Upload files"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
    </>
  );
};

/**
 * ChatInput Component - Main Export
 * 
 * Complete chat input with message composition and file upload.
 * 
 * Props:
 * @param onSend - Handler called with message content and files
 * @param disabled - Disables input during message sending
 * @param placeholder - Placeholder text for the textarea
 * @param maxLength - Maximum message length (default from CONSTANTS)
 * @param className - Additional CSS classes
 * @param onVoiceClick - Handler for voice mode button click
 * 
 * State Management:
 * - input: Current message text
 * - files: Array of uploaded/uploading files
 * - isDragOver: Drag-and-drop state
 * 
 * @example
 * <ChatInput 
 *   onSend={(message, files) => handleSend(message, files)}
 *   disabled={isLoading}
 *   onVoiceClick={() => setVoiceModalOpen(true)}
 * />
 */
export const ChatInput: React.FC<InputProps> = ({ 
  onSend,
  disabled = false,
  placeholder = "Send a message...",
  maxLength = CONSTANTS.MAX_MESSAGE_LENGTH,
  className,
  onVoiceClick
}) => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  /**
   * Auto-resize textarea based on content
   * Grows up to maxHeight (200px) then scrolls
   */
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; // Max height in pixels - customize as needed
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, []);
  
  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setInput(value);
      adjustTextareaHeight();
    }
  };
  
  // Handle key presses
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;
    if (!input.trim() && files.length === 0) return;
    
    // Convert FileUpload objects to File objects
    const fileObjects = files
      .filter(f => f.status === 'uploaded')
      .map(f => f.file); // Use the actual File object
    
    onSend(input.trim(), fileObjects);
    
    // Reset form
    setInput('');
    setFiles([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };
  
  /**
   * Handle file uploads with validation
   * Checks file size and type before accepting
   * Shows toast notifications for validation errors
   */
  const handleFileUpload = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      // Check file size against MAX_FILE_SIZE constant
      if (file.size > CONSTANTS.MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large. Maximum size is ${formatFileSize(CONSTANTS.MAX_FILE_SIZE)}`);
        return false;
      }
      
      // Check file type against ACCEPTED_FILE_TYPES
      if (!isFileTypeAllowed(file.type, CONSTANTS.ACCEPTED_FILE_TYPES)) {
        toast.error(`File type "${file.type}" is not supported`);
        return false;
      }
      
      return true;
    });
    
    const uploadFiles: FileUpload[] = validFiles.map(file => ({
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      file: file, // Store the actual File object
    }));
    
    setFiles(prev => [...prev, ...uploadFiles]);
    
    // Simulate file upload
    uploadFiles.forEach(uploadFile => {
      simulateUpload(uploadFile);
    });
    
  }, []);
  
  /**
   * Simulate file upload progress
   * In production, replace with actual upload logic
   * Updates progress in 100ms intervals
   */
  const simulateUpload = (uploadFile: FileUpload) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Mark file as uploaded
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'uploaded' as const, progress: 100 }
            : f
        ));
      } else {
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress: Math.round(progress) }
            : f
        ));
      }
    }, 100);
  };
  
  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };
  
  /**
   * Dropzone configuration for drag-and-drop
   * - Accepts files based on ACCEPTED_FILE_TYPES
   * - Validates file size
   * - Shows overlay on drag
   * - Disabled click/keyboard to use custom button
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    noClick: true, // Use custom button instead
    noKeyboard: true,
    accept: CONSTANTS.ACCEPTED_FILE_TYPES.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: CONSTANTS.MAX_FILE_SIZE,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
  });
  
  const canSend = !disabled && (input.trim() || files.some(f => f.status === 'uploaded'));
  
  return (
    <div 
      {...getRootProps()}
      className={cn(
        'border-t border-border bg-background px-4 py-3 relative',
        isDragActive && 'bg-brand-50',
        className
      )}
    >
      <input {...getInputProps()} />
      
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-50 border-2 border-dashed border-brand-300 rounded-lg flex items-center justify-center z-10"
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-brand-600 mx-auto mb-2" />
              <p className="text-brand-700 font-medium">Drop files here to upload</p>
              <p className="text-brand-600 text-sm">
                Supports PDF, DOC, TXT, and more
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* File Preview */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex flex-wrap gap-2"
          >
            {files.map((file) => (
              <FileChip
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* File Upload Button */}
        <FileUploadButton
          onUpload={handleFileUpload}
          disabled={disabled}
        />
        
        {/* Voice Button */}
        {onVoiceClick && (
          <VoiceButton
            onClick={onVoiceClick}
            disabled={disabled}
          />
        )}
        
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg border border-input bg-background',
              'px-3 py-2 pr-12',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[44px] max-h-[200px]',
              'placeholder:text-muted-foreground text-foreground'
            )}
            style={{
              height: 'auto',
              overflowY: input.split('\n').length > 5 ? 'auto' : 'hidden',
            }}
          />
          
          {/* Character Count */}
          {input.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
              {input.length}/{maxLength}
            </div>
          )}
        </div>
        
        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          className={cn(
            'h-10 w-10 flex-shrink-0',
            'transition-all duration-200'
          )}
          title={disabled ? 'Sending message...' : 'Send message'}
        >
          {disabled ? (
            <Spinner size="sm" className="text-white" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
      
      {/* Input Hints */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
};