/**
 * Partner File Upload Component
 * 
 * Enhanced file upload component with:
 * - Partner context integration
 * - Mock API upload simulation
 * - Progress tracking
 * - Partner-specific file list
 */

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, 
  X,
  Upload,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileIcon
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { mockClient } from '@/lib/api/mock-client';
import { sessionManager } from '@/lib/session/partner-session';
import { cn, formatFileSize, generateId, CONSTANTS } from '@/lib/utils';

type AcceptedFileType = typeof CONSTANTS.ACCEPTED_FILE_TYPES[number];

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: AcceptedFileType;
  uploadedAt: number;
  partnerId: string;
}

interface FileUploadProps {
  onUploadComplete?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export function PartnerFileUpload({ 
  onUploadComplete,
  disabled = false,
  className 
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, UploadingFile>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current partner ID
  const { partnerId } = sessionManager.useSession();

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (!partnerId) {
      toast.error('Not authenticated');
      return;
    }

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > CONSTANTS.MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large (max ${formatFileSize(CONSTANTS.MAX_FILE_SIZE)})`);
        return false;
      }
      
      if (!CONSTANTS.ACCEPTED_FILE_TYPES.includes(file.type as AcceptedFileType)) {
        toast.error(`File type "${file.type}" not supported`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Add files to uploading state
    const newUploadingFiles = { ...uploadingFiles };
    validFiles.forEach(file => {
      const id = generateId();
      newUploadingFiles[id] = {
        file,
        progress: 0,
        status: 'uploading'
      };
    });
    setUploadingFiles(newUploadingFiles);

    // Upload each file
    for (const file of validFiles) {
      const uploadId = generateId();
      
      try {
        // Start upload with mock API
        const response = await mockClient.mockUploadFile(file, partnerId);
        
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Upload failed');
        }

        // Add to uploaded files
        const uploadedFile: UploadedFile = {
          id: response.data.fileId,
          name: file.name,
          size: file.size,
          type: file.type as AcceptedFileType,
          uploadedAt: Date.now(),
          partnerId
        };
        setUploadedFiles(prev => [...prev, uploadedFile]);

        // Update status
        setUploadingFiles(prev => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            status: 'completed',
            progress: 100
          }
        }));

        // Notify parent
        onUploadComplete?.([file]);

        toast.success(`Uploaded ${file.name}`);

      } catch (error) {
        console.error('Upload failed:', error);
        setUploadingFiles(prev => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            status: 'error',
            progress: 0
          }
        }));
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [partnerId, uploadingFiles, onUploadComplete]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileSelect,
    disabled,
    accept: CONSTANTS.ACCEPTED_FILE_TYPES.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<AcceptedFileType, string[]>),
    maxSize: CONSTANTS.MAX_FILE_SIZE,
    noClick: true // Use custom button instead
  });

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div 
      {...getRootProps()}
      className={cn(
        'relative rounded-lg border border-dashed p-4',
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20',
        className
      )}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleFileSelect(files);
          e.target.value = ''; // Reset input
        }}
        {...getInputProps()}
      />

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/5 rounded-lg flex items-center justify-center"
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-primary font-medium">Drop files to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button and info */}
      <div className="flex flex-col items-center gap-2 text-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled}
          className="gap-2"
        >
          <Paperclip className="w-4 h-4" />
          Select Files
        </Button>
        <p className="text-sm text-muted-foreground">
          or drag and drop files here
        </p>
      </div>

      {/* Uploading files */}
      <AnimatePresence>
        {Object.entries(uploadingFiles).map(([id, { file, progress, status }]) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="flex items-center gap-3 bg-muted p-3 rounded-lg">
              <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  {status === 'uploading' && <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />}
                  {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {status === 'error' && <AlertCircle className="w-4 h-4 text-destructive" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(file.size)}</span>
                  {status === 'uploading' && (
                    <>
                      <span>•</span>
                      <span>{progress}%</span>
                    </>
                  )}
                </div>
                {status === 'uploading' && (
                  <div className="mt-2 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map(file => (
              <div 
                key={file.id}
                className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg"
              >
                <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{new Date(file.uploadedAt).toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
