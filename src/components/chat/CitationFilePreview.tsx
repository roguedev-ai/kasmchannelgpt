'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText,
  Download,
  Loader,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface CitationFilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  citationId: string;
  fileName?: string;
}

export const CitationFilePreview: React.FC<CitationFilePreviewProps> = ({
  isOpen,
  onClose,
  citationId,
  fileName = 'Citation File'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>('text/plain');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && citationId) {
      fetchFilePreview();
    }
  }, [isOpen, citationId]);

  const fetchFilePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const client = getClient();
      const response = await client.previewCitationFile(citationId);
      
      // Handle different response formats
      if (typeof response === 'string') {
        setFileContent(response);
        setContentType('text/plain');
      } else if (response.data) {
        setFileContent(response.data.content || response.data);
        setContentType(response.data.content_type || 'text/plain');
      } else {
        setFileContent(JSON.stringify(response, null, 2));
        setContentType('application/json');
      }
      
      logger.info('CITATION_PREVIEW', 'File preview fetched', {
        citationId,
        contentLength: fileContent?.length
      });
    } catch (err: any) {
      logger.error('CITATION_PREVIEW', 'Failed to fetch file preview', {
        error: err,
        citationId
      });
      
      if (err.status === 400) {
        setError('Invalid citation ID.');
      } else if (err.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.status === 403) {
        setError('Access denied. You do not have permission to view this file.');
      } else if (err.status === 404) {
        setError('Citation file not found.');
      } else if (err.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load file preview.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!fileContent) return;
    
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      toast.success('Content copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy content');
    }
  };

  const handleDownload = () => {
    if (!fileContent) return;
    
    const blob = new Blob([fileContent], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('File downloaded');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {fileName}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!fileContent}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!fileContent}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Error loading file</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            ) : fileContent ? (
              <div className="font-mono text-sm bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap break-words">
                  {fileContent}
                </pre>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Citation ID: {citationId}
              </div>
              <div className="text-xs text-gray-500">
                {contentType}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};