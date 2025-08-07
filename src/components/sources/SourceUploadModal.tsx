import React, { useState, useCallback } from 'react';
import { X, Upload, File, Link, Type, Plus, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">
            Add Data Sources
          </h2>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('file')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium text-center',
              activeTab === 'file'
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <File className="w-4 h-4 inline mr-2" />
            Files
          </button>
          
          <button
            onClick={() => setActiveTab('url')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium text-center',
              activeTab === 'url'
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Link className="w-4 h-4 inline mr-2" />
            URLs
          </button>
          
          <button
            onClick={() => setActiveTab('text')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium text-center',
              activeTab === 'text'
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Type className="w-4 h-4 inline mr-2" />
            Text
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'file' && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop files here...'
                    : 'Drag and drop files here, or click to select files'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-2">
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
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
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
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {urls.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUrl(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addUrl}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another URL
              </Button>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="space-y-4">
                {textSources.map((source, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-foreground">
                        Text Source {index + 1}
                      </h4>
                      {textSources.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTextSource(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={source.name}
                        onChange={(e) => updateTextSource(index, 'name', e.target.value)}
                        placeholder="Source name..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      
                      <textarea
                        value={source.content}
                        onChange={(e) => updateTextSource(index, 'content', e.target.value)}
                        placeholder="Paste your text content here..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addTextSource}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Text Source
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          
          <Button
            variant="default"
            onClick={handleUpload}
            disabled={!canUpload() || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Sources'}
          </Button>
        </div>
      </div>
    </div>
  );
};