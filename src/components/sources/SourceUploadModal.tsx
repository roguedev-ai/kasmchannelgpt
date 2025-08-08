import React, { useState, useCallback } from 'react';
import { X, Upload, File, Link, Type, Plus, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface SourceUploadModalProps {
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

interface UploadItem {
  id: string;
  type: 'file' | 'url' | 'text';
  file?: File;
  url?: string;
  text?: string;
  name: string;
}

export const SourceUploadModal: React.FC<SourceUploadModalProps> = ({
  onClose,
  onUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'text'>('file');
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>(['']);
  const [textSources, setTextSources] = useState<Array<{name: string, content: string}>>([
    { name: '', content: '' }
  ]);
  const [uploading, setUploading] = useState(false);
  const { isMobile } = useBreakpoint();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    setUrls([...urls, '']);
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const addTextSource = () => {
    setTextSources([...textSources, { name: '', content: '' }]);
  };

  const updateTextSource = (index: number, field: 'name' | 'content', value: string) => {
    const newSources = [...textSources];
    newSources[index][field] = value;
    setTextSources(newSources);
  };

  const removeTextSource = (index: number) => {
    if (textSources.length > 1) {
      setTextSources(textSources.filter((_, i) => i !== index));
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    
    try {
      const allFiles: File[] = [];
      
      // Handle file uploads
      if (activeTab === 'file') {
        allFiles.push(...files);
      }
      
      // Handle URL uploads (convert to files)
      if (activeTab === 'url') {
        const validUrls = urls.filter(url => url.trim());
        // For URLs, we'll need to create File objects or handle them differently
        // For now, let's skip URL handling in the demo
        if (validUrls.length > 0) {
          toast.info('URL upload not implemented in demo');
        }
      }
      
      // Handle text uploads (convert to files)
      if (activeTab === 'text') {
        const validTextSources = textSources.filter(source => 
          source.name.trim() && source.content.trim()
        );
        
        for (const source of validTextSources) {
          const blob = new Blob([source.content], { type: 'text/plain' });
          // Create a File-like object from the blob
          const file = Object.assign(blob, {
            name: source.name + '.txt',
            lastModified: Date.now(),
          }) as File;
          allFiles.push(file);
        }
      }
      
      if (allFiles.length === 0) {
        toast.error('Please add at least one source');
        setUploading(false);
        return;
      }
      
      await onUpload(allFiles);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const canUpload = () => {
    if (activeTab === 'file') {
      return files.length > 0;
    }
    if (activeTab === 'url') {
      return urls.some(url => url.trim());
    }
    if (activeTab === 'text') {
      return textSources.some(source => source.name.trim() && source.content.trim());
    }
    return false;
  };

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
          className={cn(
            "fixed bg-background shadow-xl z-50 flex flex-col",
            isMobile 
              ? "inset-x-0 bottom-0 top-20 rounded-t-xl" 
              : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] rounded-lg"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between border-b flex-shrink-0",
            isMobile ? "p-4" : "p-4"
          )}>
            <h2 className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-lg" : "text-lg"
            )}>
              Add Data Sources
            </h2>
            
            <Button
              variant="ghost"
              size={isMobile ? "icon" : "sm"}
              onClick={onClose}
              className={cn(
                isMobile && "h-9 w-9 touch-target"
              )}
            >
              <X className={cn(
                isMobile ? "w-5 h-5" : "w-4 h-4"
              )} />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b flex-shrink-0">
            <button
              onClick={() => setActiveTab('file')}
              className={cn(
                'flex-1 font-medium text-center touch-target',
                isMobile ? 'px-3 py-3 text-sm' : 'px-4 py-3 text-sm',
                activeTab === 'file'
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <File className={cn(
                "inline mr-2",
                isMobile ? "w-4 h-4" : "w-4 h-4"
              )} />
              Files
            </button>
            
            <button
              onClick={() => setActiveTab('url')}
              className={cn(
                'flex-1 font-medium text-center touch-target',
                isMobile ? 'px-3 py-3 text-sm' : 'px-4 py-3 text-sm',
                activeTab === 'url'
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Link className={cn(
                "inline mr-2",
                isMobile ? "w-4 h-4" : "w-4 h-4"
              )} />
              URLs
            </button>
            
            <button
              onClick={() => setActiveTab('text')}
              className={cn(
                'flex-1 font-medium text-center touch-target',
                isMobile ? 'px-3 py-3 text-sm' : 'px-4 py-3 text-sm',
                activeTab === 'text'
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Type className={cn(
                "inline mr-2",
                isMobile ? "w-4 h-4" : "w-4 h-4"
              )} />
              Text
            </button>
          </div>

          {/* Content */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            isMobile ? "p-4 pb-6" : "p-4"
          )}>
          {activeTab === 'file' && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors',
                  isMobile ? 'p-6' : 'p-8',
                  isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300'
                )}
              >
                <input {...getInputProps()} />
                <Upload className={cn(
                  "text-muted-foreground mx-auto mb-4",
                  isMobile ? "w-6 h-6" : "w-8 h-8"
                )} />
                <p className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-sm" : "text-sm"
                )}>
                  {isDragActive
                    ? 'Drop files here...'
                    : isMobile 
                      ? 'Tap to select files'
                      : 'Drag and drop files here, or click to select files'
                  }
                </p>
                <p className={cn(
                  "text-muted-foreground mt-2",
                  isMobile ? "text-xs" : "text-xs"
                )}>
                  Supports: PDF, DOC, TXT, CSV, JSON, etc.
                </p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Selected Files ({files.length})
                  </h4>
                  {files.map((file, index) => (
                    <div key={index} className={cn(
                      "flex items-center justify-between bg-muted rounded",
                      isMobile ? "p-3" : "p-2"
                    )}>
                      <div className="flex items-center gap-2 min-w-0">
                        <File className={cn(
                          "text-muted-foreground flex-shrink-0",
                          isMobile ? "w-4 h-4" : "w-4 h-4"
                        )} />
                        <div className="min-w-0">
                          <span className={cn(
                            "text-foreground block truncate",
                            isMobile ? "text-sm" : "text-sm"
                          )}>{file.name}</span>
                          <span className={cn(
                            "text-muted-foreground",
                            isMobile ? "text-xs" : "text-xs"
                          )}>
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size={isMobile ? "icon" : "sm"}
                        onClick={() => removeFile(index)}
                        className={cn(
                          "text-red-600 hover:text-red-700 flex-shrink-0",
                          isMobile && "h-8 w-8"
                        )}
                      >
                        <Trash2 className={cn(
                          isMobile ? "w-4 h-4" : "w-4 h-4"
                        )} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {urls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder="https://example.com"
                      className={cn(
                        "flex-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500",
                        isMobile ? "px-3 py-3 text-base touch-target" : "px-3 py-2"
                      )}
                    />
                    {urls.length > 1 && (
                      <Button
                        variant="ghost"
                        size={isMobile ? "icon" : "sm"}
                        onClick={() => removeUrl(index)}
                        className={cn(
                          "text-red-600 hover:text-red-700",
                          isMobile && "h-11 w-11 touch-target"
                        )}
                      >
                        <Trash2 className={cn(
                          isMobile ? "w-4 h-4" : "w-4 h-4"
                        )} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addUrl}
                className={cn(
                  "w-full",
                  isMobile && "h-11 touch-target"
                )}
              >
                <Plus className={cn(
                  "mr-2",
                  isMobile ? "w-4 h-4" : "w-4 h-4"
                )} />
                Add Another URL
              </Button>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="space-y-4">
                {textSources.map((source, index) => (
                  <div key={index} className={cn(
                    "border border-gray-200 rounded-lg",
                    isMobile ? "p-3" : "p-4"
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={cn(
                        "font-medium text-foreground",
                        isMobile ? "text-sm" : "text-sm"
                      )}>
                        Text Source {index + 1}
                      </h4>
                      {textSources.length > 1 && (
                        <Button
                          variant="ghost"
                          size={isMobile ? "icon" : "sm"}
                          onClick={() => removeTextSource(index)}
                          className={cn(
                            "text-red-600 hover:text-red-700",
                            isMobile && "h-8 w-8"
                          )}
                        >
                          <Trash2 className={cn(
                            isMobile ? "w-4 h-4" : "w-4 h-4"
                          )} />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={source.name}
                        onChange={(e) => updateTextSource(index, 'name', e.target.value)}
                        placeholder="Source name..."
                        className={cn(
                          "w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500",
                          isMobile ? "px-3 py-3 text-base touch-target" : "px-3 py-2"
                        )}
                      />
                      
                      <textarea
                        value={source.content}
                        onChange={(e) => updateTextSource(index, 'content', e.target.value)}
                        placeholder="Paste your text content here..."
                        rows={isMobile ? 3 : 4}
                        className={cn(
                          "w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none",
                          isMobile ? "px-3 py-3 text-base" : "px-3 py-2"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addTextSource}
                className={cn(
                  "w-full",
                  isMobile && "h-11 touch-target"
                )}
              >
                <Plus className={cn(
                  "mr-2",
                  isMobile ? "w-4 h-4" : "w-4 h-4"
                )} />
                Add Another Text Source
              </Button>
            </div>
          )}
          </div>

          {/* Footer */}
          <div className={cn(
            "flex gap-2 border-t flex-shrink-0",
            isMobile 
              ? "p-4 flex-col-reverse safe-area-pb" 
              : "p-4 justify-end"
          )}>
            <Button
              variant="ghost"
              onClick={onClose}
              className={cn(
                isMobile && "w-full h-11 touch-target"
              )}
            >
              Cancel
            </Button>
            
            <Button
              variant="default"
              onClick={handleUpload}
              disabled={!canUpload() || uploading}
              className={cn(
                isMobile && "w-full h-11 touch-target"
              )}
            >
              {uploading ? 'Uploading...' : 'Upload Sources'}
            </Button>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};