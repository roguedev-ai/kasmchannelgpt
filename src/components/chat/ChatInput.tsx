/**
 * ChatInput Component
 * 
 * Rich input field for sending messages and uploading files.
 * 
 * Features:
 * - Auto-expanding textarea (up to 200px height)
 * - File upload with drag-and-drop support
 * - Speech-to-text transcription using OpenAI Whisper
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

import React, { useState, useRef, useCallback, KeyboardEvent, FormEvent, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  X,
  Upload,
  AlertCircle,
  ChevronDown,
  Settings,
  Sparkles,
  Brain,
  Zap,
  MessageSquare,
  User,
  Bot,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

import type { InputProps, FileUpload, AgentSettings } from '@/types';
import { useDemoModeContext } from '@/contexts/DemoModeContext';
import { cn, formatFileSize, getFileIcon, isFileTypeAllowed, generateId, CONSTANTS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { SpeechToTextButton } from '@/components/voice/SpeechToTextButton';
import { AnimatedVoiceIcon } from '@/components/voice/AnimatedVoiceIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAgentStore } from '@/store/agents';
import { useChatSettingsStore } from '@/store/chat-settings';
import { getClient } from '@/lib/api/client';

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


/**
 * FileUploadButton Component
 * 
 * Hidden file input with visible button trigger.
 * Accepts multiple files based on ACCEPTED_FILE_TYPES.
 */
interface FileUploadButtonProps {
  /** Handler called when files are selected */
  onUpload: (files: File[]) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Mobile optimization mode */
  isMobile?: boolean;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onUpload, disabled, isMobile = false }) => {
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
        className={cn(
          "text-muted-foreground hover:text-foreground relative z-10",
          isMobile ? "h-10 w-10 min-w-[40px]" : "h-9 w-9"
        )}
        title="Upload files"
      >
        <Paperclip className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
      </Button>
    </>
  );
};

// Configuration options
const RESPONSE_SOURCES = [
  { value: 'own_content', label: 'Content', description: 'Uses only your uploaded content', icon: MessageSquare },
  { value: 'openai_content', label: 'AI + Content', description: 'Combines AI knowledge with your content', icon: Brain },
  { value: 'default', label: 'Default', description: 'Uses the default agent setting', icon: Settings },
] as const;

const CHATBOT_MODELS = [
  { value: 'gpt-4-o', label: 'GPT-4', description: 'Most capable model', icon: Brain, capabilities: ['optimal-choice', 'advanced-reasoning', 'complex-tasks'] },
  { value: 'gpt-4-1', label: 'GPT-4.1', description: 'Latest GPT-4 version', icon: Sparkles, capabilities: ['optimal-choice', 'advanced-reasoning', 'complex-tasks'] },
  { value: 'gpt-4o-mini', label: 'GPT-4 Mini', description: 'Faster, good for most tasks', icon: Zap, capabilities: ['fastest-responses', 'optimal-choice'] },
  { value: 'gpt-4-1-mini', label: 'GPT-4.1 Mini', description: 'Fast and efficient', icon: Zap, capabilities: ['fastest-responses', 'optimal-choice'] },
  { value: 'claude-3-sonnet', label: 'Claude 3', description: 'Balanced performance', icon: Brain, capabilities: ['optimal-choice', 'advanced-reasoning'] },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5', description: 'Advanced reasoning', icon: Sparkles, capabilities: ['optimal-choice', 'advanced-reasoning', 'complex-tasks'] },
] as const;

const COMMON_PERSONAS = [
  { value: 'professional', label: 'Professional', description: 'Formal responses', icon: Bot },
  { value: 'friendly', label: 'Friendly', description: 'Conversational tone', icon: User },
  { value: 'technical', label: 'Technical', description: 'Technical explanations', icon: Brain },
  { value: 'creative', label: 'Creative', description: 'Imaginative responses', icon: Sparkles },
  { value: 'educator', label: 'Teacher', description: 'Step-by-step guidance', icon: Bot },
  { value: 'custom', label: 'Custom', description: 'Your own instructions', icon: Settings },
] as const;

const AGENT_CAPABILITIES = [
  { value: 'fastest-responses', label: 'Fastest', description: 'Quick answers', icon: Zap, enterprise: true },
  { value: 'optimal-choice', label: 'Optimal', description: 'Balanced', icon: Settings, enterprise: false },
  { value: 'advanced-reasoning', label: 'Advanced', description: 'Complex tasks', icon: Brain, enterprise: true },
  { value: 'complex-tasks', label: 'Complex Reasoning', description: 'Highest quality', icon: Sparkles, enterprise: true },
] as const;

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
  onVoiceClick,
  isMobile = false,
  mode = 'standalone'
}) => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get free trial mode status
  const { isFreeTrialMode } = useDemoModeContext();
  
  // Get stores
  const { currentAgent } = useAgentStore();
  const { getSettings, updateSettings: updateLocalSettings } = useChatSettingsStore();
  
  // Get settings for current agent
  const settings = currentAgent?.id ? getSettings(currentAgent.id) : {
    response_source: 'own_content',
    chatbot_model: 'gpt-4-o',
    custom_persona: 'professional',
    agent_capability: 'optimal-choice',
  };
  
  const loadAgentSettings = useCallback(async () => {
    if (!currentAgent?.id) return;

    try {
      const client = getClient();
      const response = await client.getAgentSettings(currentAgent.id);
      
      if (response?.data) {
        const loadedSettings = {
          response_source: response.data.response_source || 'own_content',
          chatbot_model: response.data.chatbot_model || 'gpt-4-o',
          custom_persona: response.data.custom_persona || 'professional',
          agent_capability: response.data.agent_capability || 'optimal-choice',
        };
        updateLocalSettings(currentAgent.id, loadedSettings);
      }
    } catch (error) {
      console.error('Failed to load agent settings:', error);
    }
  }, [currentAgent?.id, updateLocalSettings]);

  // Load settings when agent changes
  useEffect(() => {
    if (currentAgent?.id) {
      loadAgentSettings();
    }
  }, [currentAgent?.id, loadAgentSettings]);

  const updateSetting = async (key: keyof AgentSettings, value: string) => {
    if (!currentAgent?.id) return;

    setIsLoadingSettings(true);
    try {
      const client = getClient();
      let updates: Partial<AgentSettings> = { [key]: value };
      
      // If changing capability, check if current model is still valid
      if (key === 'agent_capability') {
        const validModels = CHATBOT_MODELS.filter(m => m.capabilities.includes(value as any));
        const currentModelValid = validModels.some(m => m.value === settings.chatbot_model);
        
        if (!currentModelValid && validModels.length > 0) {
          // Switch to first available model for new capability
          updates.chatbot_model = validModels[0].value;
          toast.info(`Model changed to ${validModels[0].label} for ${AGENT_CAPABILITIES.find(c => c.value === value)?.label} mode`);
        }
      }
      
      await client.updateAgentSettings(currentAgent.id, updates);
      updateLocalSettings(currentAgent.id, updates);
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setIsLoadingSettings(false);
    }
  };
  
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
  });
  
  const canSend = !disabled && (input.trim() || files.some(f => f.status === 'uploaded'));
  
  // Handle speech-to-text transcription
  const handleTranscription = useCallback((text: string) => {
    setInput(prevInput => {
      const newInput = prevInput ? `${prevInput} ${text}` : text;
      return newInput.length <= maxLength ? newInput : prevInput;
    });
    
    // Adjust textarea height after updating text
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);
  }, [maxLength, adjustTextareaHeight]);
  
  // Handle transcription start
  const handleTranscriptionStart = useCallback(() => {
    setIsTranscribing(true);
  }, []);
  
  // Handle transcription end
  const handleTranscriptionEnd = useCallback(() => {
    setIsTranscribing(false);
  }, []);
  
  return (
    <div 
      {...getRootProps()}
      className={cn(
        'relative',
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
            className="px-4 pt-3 pb-2 flex flex-wrap gap-2"
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
      
      {/* Main Input Container */}
      <div className={cn(
        "mx-4 my-3 bg-background border border-border rounded-2xl shadow-sm",
        "focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all"
      )}>
        {/* Text Input Area */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center p-3 pb-1">
            {/* File Upload Button - Hidden in free trial mode and widget/floating modes */}
            {!isFreeTrialMode && mode === 'standalone' && (
              <FileUploadButton
                onUpload={handleFileUpload}
                disabled={disabled}
                isMobile={isMobile}
              />
            )}
            
            {/* Speech to Text Button - Hidden in widget/floating modes */}
            {mode === 'standalone' && (
              <SpeechToTextButton
                onTranscription={handleTranscription}
                onTranscriptionStart={handleTranscriptionStart}
                onTranscriptionEnd={handleTranscriptionEnd}
                disabled={disabled}
                isMobile={isMobile}
                className={cn(
                  "!h-8 !w-8 !min-w-0 mr-2",
                  isMobile && "!h-9 !w-9"
                )}
              />
            )}
            
            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isTranscribing ? '' : placeholder}
                disabled={disabled}
                rows={1}
                className={cn(
                  'w-full resize-none bg-transparent border-0',
                  'focus:outline-none focus:ring-0',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'placeholder:text-muted-foreground text-foreground',
                  isMobile 
                    ? 'text-base min-h-[24px] max-h-[120px] placeholder:text-sm' 
                    : 'text-sm min-h-[20px] max-h-[200px]'
                )}
                style={{
                  height: 'auto',
                  overflowY: input.split('\n').length > 5 ? 'auto' : 'hidden',
                }}
              />
              
              {/* Transcribing Animation */}
              {isTranscribing && !input && (
                <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center pointer-events-none">
                  <span className={cn(
                    "text-muted-foreground animate-pulse",
                    isMobile ? "text-base" : "text-sm"
                  )}>
                    Transcribing
                    <span className="inline-flex">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                  </span>
                </div>
              )}
            </div>
            
            {/* Character Count */}
            {input.length > 0 && (
              <div className={cn(
                "text-xs text-muted-foreground mr-2",
                isMobile ? "text-xs" : "text-xs"
              )}>
                {input.length}/{maxLength}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Voice Button - Hidden in widget/floating modes */}
              {onVoiceClick && mode === 'standalone' && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onVoiceClick}
                  disabled={disabled}
                  className={cn(
                    'relative group transition-all duration-200',
                    'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
                    'hover:from-purple-500/20 hover:to-pink-500/20',
                    'border border-purple-500/20 hover:border-purple-500/40',
                    'shadow-sm hover:shadow-md',
                    isMobile ? 'h-10 w-10' : 'h-9 w-9'
                  )}
                  title="Voice mode"
                >
                  <div className="absolute inset-0 rounded-md bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <AnimatedVoiceIcon 
                    size={isMobile ? 'lg' : 'md'} 
                    isActive={false}
                    className="relative z-10"
                  />
                </Button>
              )}
              
              {/* Send Button */}
              <Button
                type="submit"
                size="icon"
                disabled={!canSend}
                className={cn(
                  'transition-all duration-200 group',
                  'bg-brand-500 hover:bg-brand-600 active:bg-brand-700',
                  'text-white shadow-sm hover:shadow-md',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'disabled:hover:bg-brand-500 disabled:hover:shadow-sm',
                  isMobile ? 'h-10 w-10' : 'h-9 w-9'
                )}
                title={disabled ? 'Sending message...' : 'Send message'}
              >
                {disabled ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <Send className={cn(
                    "transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                    isMobile ? "h-5 w-5" : "h-4 w-4"
                  )} />
                )}
              </Button>
            </div>
          </div>
        </form>
        
        {/* Settings Toggle Button - Hidden in widget/floating modes */}
        {mode === 'standalone' && (
          <div className="border-t border-gray-200/50 dark:border-gray-800/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "flex items-center gap-2 text-xs",
                isMobile ? "w-full justify-center h-9 px-3 py-2" : "w-auto justify-start h-8 px-3 py-1.5",
                "hover:bg-accent/50 transition-all duration-200",
                showSettings && "bg-accent/30"
              )}
              title="Customize chat settings including response source, AI model, and persona"
            >
              <SlidersHorizontal className={cn(
                "transition-colors",
                showSettings ? "text-brand-500" : "text-muted-foreground",
                isMobile ? "h-4 w-4" : "h-3.5 w-3.5"
              )} />
              <span className={cn(
                "font-medium text-muted-foreground",
                showSettings && "text-brand-600"
              )}>Customize Chat</span>
              <ChevronDown className={cn(
                "h-3 w-3 opacity-50 transition-transform duration-200",
                showSettings && "rotate-180"
              )} />
            </Button>
          
          {/* Expandable Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-accent/20"
              >
                <div className={cn(
                  "flex items-center border-t border-gray-200/50 dark:border-gray-800/30",
                  isMobile 
                    ? "justify-between px-2 pb-2 pt-2" 
                    : "gap-2 px-3 pb-2.5 pt-2.5"
                )}>
                  {/* Response Source */}
                  <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs flex items-center justify-center",
                isMobile ? "h-8 flex-1 gap-4 px-1" : "h-7 px-2.5 gap-1.5"
              )}
              disabled={isLoadingSettings}
            >
              <MessageSquare className={cn("text-muted-foreground", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
              <span className="font-medium text-muted-foreground">Source</span>
              {!isMobile && <ChevronDown className="h-3 w-3 opacity-50" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-xs">RESPONSE SOURCE</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {RESPONSE_SOURCES.map((source) => {
              const Icon = source.icon;
              return (
                <DropdownMenuItem
                  key={source.value}
                  onClick={() => updateSetting('response_source', source.value)}
                  className="flex flex-col items-start py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">{source.label}</span>
                    {settings.response_source === source.value && (
                      <span className="text-xs text-brand-600">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground ml-5">{source.description}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Model Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs flex items-center justify-center",
                isMobile ? "h-8 flex-1 gap-2 px-1" : "h-7 px-2.5 gap-1.5"
              )}
              disabled={isLoadingSettings}
            >
              <Brain className={cn("text-muted-foreground", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
              <span className="font-medium text-muted-foreground">Model</span>
              {!isMobile && <ChevronDown className="h-3 w-3 opacity-50" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-72">
            <DropdownMenuLabel className="text-xs">AI MODEL</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CHATBOT_MODELS
              .filter((model) => settings.agent_capability && model.capabilities.includes(settings.agent_capability as any))
              .map((model) => {
                const Icon = model.icon;
                return (
                  <DropdownMenuItem
                    key={model.value}
                    onClick={() => updateSetting('chatbot_model', model.value)}
                    className="flex flex-col items-start py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">{model.label}</span>
                      {settings.chatbot_model === model.value && (
                        <span className="text-xs text-brand-600">✓</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-5">{model.description}</span>
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Persona Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs flex items-center justify-center",
                isMobile ? "h-8 flex-1 gap-2 px-1" : "h-7 px-2.5 gap-1.5"
              )}
              disabled={isLoadingSettings}
            >
              <User className={cn("text-muted-foreground", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
              <span className="font-medium text-muted-foreground">Persona</span>
              {!isMobile && <ChevronDown className="h-3 w-3 opacity-50" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-64">
            <DropdownMenuLabel className="text-xs">ASSISTANT PERSONA</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COMMON_PERSONAS.map((persona) => {
              const Icon = persona.icon;
              return (
                <DropdownMenuItem
                  key={persona.value}
                  onClick={() => updateSetting('custom_persona', persona.value)}
                  className="flex flex-col items-start py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">{persona.label}</span>
                    {settings.custom_persona === persona.value && (
                      <span className="text-xs text-brand-600">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground ml-5">{persona.description}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Agent Capability */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs flex items-center justify-center",
                isMobile ? "h-8 flex-1 gap-2 px-1" : "h-7 px-2.5 gap-1.5"
              )}
              disabled={isLoadingSettings}
            >
              <Settings className={cn("text-muted-foreground", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
              <span className="font-medium text-muted-foreground">Mode</span>
              {!isMobile && <ChevronDown className="h-3 w-3 opacity-50" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs">RESPONSE MODE</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {AGENT_CAPABILITIES.map((capability) => {
              const Icon = capability.icon;
              return (
                <DropdownMenuItem
                  key={capability.value}
                  onClick={() => updateSetting('agent_capability', capability.value)}
                  className="flex flex-col items-start py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">{capability.label}</span>
                    {capability.enterprise && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1 py-0.5 rounded">Enterprise only</span>
                    )}
                    {settings.agent_capability === capability.value && (
                      <span className="text-xs text-brand-600">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground ml-5">{capability.description}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
      </div>
      
      {/* Input Hints - Below configuration options */}
      {!isMobile && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      )}
    </div>
  );
};