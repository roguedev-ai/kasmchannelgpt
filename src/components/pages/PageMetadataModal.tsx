'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  FileText, 
  Image, 
  Type,
  AlertCircle,
  Loader2,
  Save,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getClient, isClientInitialized } from '@/lib/api/client';
import type { PageMetadata } from '@/types/pages.types';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface PageMetadataModalProps {
  projectId: number;
  pageId: number;
  onClose: () => void;
  onUpdate?: () => void;
}

export const PageMetadataModal: React.FC<PageMetadataModalProps> = ({ 
  projectId, 
  pageId,
  onClose,
  onUpdate
}) => {
  const [metadata, setMetadata] = useState<PageMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useBreakpoint();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    image: ''
  });

  useEffect(() => {
    loadMetadata();
  }, [projectId, pageId]);

  const loadMetadata = async () => {
    if (!isClientInitialized()) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = getClient();
      const response = await client.getPageMetadata(projectId, pageId);
      
      setMetadata(response.data);
      setFormData({
        title: response.data.title || '',
        description: response.data.description || '',
        url: response.data.url || '',
        image: response.data.image || ''
      });
    } catch (err: any) {
      console.error('Failed to load page metadata:', {
        error: err,
        status: err.status,
        message: err.message,
        data: err.data,
        projectId,
        pageId
      });
      
      if (err.status === 400) {
        setError('Invalid request. Please check the page ID.');
      } else if (err.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.status === 404) {
        setError(`Page #${pageId} not found. This page may have been deleted.`);
      } else if (err.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        // Try to extract error message from response
        const errorMessage = err.message || err.data?.message || 'Failed to load page metadata.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isClientInitialized()) {
      toast.error('API client not initialized');
      return;
    }

    setSaving(true);
    
    try {
      const client = getClient();
      await client.updatePageMetadata(projectId, pageId, formData);
      
      toast.success('Metadata updated successfully');
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to update metadata:', err);
      
      if (err.status === 400) {
        toast.error('Invalid request. Please check your input.');
      } else if (err.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (err.status === 404) {
        toast.error('Page not found.');
      } else if (err.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to update metadata.');
      }
    } finally {
      setSaving(false);
    }
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
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
        />

        {/* Modal */}
        <div
          className={cn(
            "fixed bg-background shadow-xl z-50 flex flex-col overflow-hidden",
            isMobile 
              ? "inset-x-0 bottom-0 top-20 rounded-t-xl" 
              : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] rounded-lg"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
            className="w-full h-full flex flex-col"
          >
          {/* Header */}
          <div className={cn(
            "border-b border-border flex items-center justify-between flex-shrink-0",
            isMobile ? "p-4" : "p-6"
          )}>
            <div>
              <h2 className={cn(
                "font-semibold text-foreground",
                isMobile ? "text-lg" : "text-xl"
              )}>Page Metadata</h2>
              <p className={cn(
                "text-muted-foreground mt-1",
                isMobile ? "text-sm" : "text-sm"
              )}>
                View and edit metadata for page #{pageId}
              </p>
            </div>
            <Button
              variant="ghost"
              size={isMobile ? "icon" : "sm"}
              onClick={onClose}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                isMobile && "h-9 w-9 touch-target"
              )}
            >
              <X className={cn(
                isMobile ? "w-5 h-5" : "w-5 h-5"
              )} />
            </Button>
          </div>

          {/* Content */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            isMobile ? "p-4 pb-6 safe-area-pb" : "p-6"
          )}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={cn(
                  "animate-spin text-brand-600",
                  isMobile ? "w-7 h-7" : "w-8 h-8"
                )} />
              </div>
            ) : error ? (
              <div className={cn(
                "bg-red-500/10 border border-red-500/20 rounded-lg",
                isMobile ? "p-3" : "p-4"
              )}>
                <div className={cn(
                  "flex items-center gap-2 text-red-700 dark:text-red-400",
                  isMobile && "gap-2"
                )}>
                  <AlertCircle className={cn(
                    "flex-shrink-0",
                    isMobile ? "w-4 h-4" : "w-5 h-5"
                  )} />
                  <span className={cn(
                    "font-medium",
                    isMobile ? "text-sm" : "text-base"
                  )}>Error loading metadata</span>
                </div>
                <p className={cn(
                  "text-red-600 dark:text-red-400 mt-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>{error}</p>
              </div>
            ) : (
              <div className={cn(
                "space-y-6",
                isMobile && "space-y-5"
              )}>
                {/* Page ID (Read-only) */}
                <div>
                  <label className={cn(
                    "flex items-center gap-2 font-medium text-foreground mb-2",
                    isMobile ? "text-sm" : "text-sm"
                  )}>
                    <Hash className={cn(
                      isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                    )} />
                    Page ID
                  </label>
                  <input
                    type="text"
                    value={metadata?.id || pageId}
                    readOnly
                    className={cn(
                      "w-full border border-border rounded-lg bg-muted text-foreground",
                      isMobile ? "px-3 py-3 text-base touch-target" : "px-3 py-2"
                    )}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className={cn(
                    "flex items-center gap-2 font-medium text-foreground mb-2",
                    isMobile ? "text-sm" : "text-sm"
                  )}>
                    <Type className={cn(
                      isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                    )} />
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={cn(
                      "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                      isMobile ? "px-3 py-3 text-base touch-target" : "px-3 py-2"
                    )}
                    placeholder="Page title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={cn(
                    "flex items-center gap-2 font-medium text-foreground mb-2",
                    isMobile ? "text-sm" : "text-sm"
                  )}>
                    <FileText className={cn(
                      isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                    )} />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={cn(
                      "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                      isMobile ? "px-3 py-3 text-base" : "px-3 py-2"
                    )}
                    placeholder="Page description"
                    rows={isMobile ? 3 : 4}
                  />
                </div>

                {/* URL */}
                <div>
                  <label className={cn(
                    "flex items-center gap-2 font-medium text-foreground mb-2",
                    isMobile ? "text-sm" : "text-sm"
                  )}>
                    <Globe className={cn(
                      isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                    )} />
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className={cn(
                      "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                      isMobile ? "px-3 py-3 text-base touch-target" : "px-3 py-2"
                    )}
                    placeholder="https://example.com"
                  />
                </div>

                {/* Image */}
                <div>
                  <label className={cn(
                    "flex items-center gap-2 font-medium text-foreground mb-2",
                    isMobile ? "text-sm" : "text-sm"
                  )}>
                    <Image className={cn(
                      isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                    )} />
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className={cn(
                      "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                      isMobile ? "px-3 py-3 text-base touch-target" : "px-3 py-2"
                    )}
                    placeholder="https://example.com/image.png"
                  />
                  
                  {/* Image Preview */}
                  {formData.image && (
                    <div className="mt-3">
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        className={cn(
                          "rounded-lg border border-border",
                          isMobile ? "w-full" : "w-full max-w-xs"
                        )}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !error && (
            <div className={cn(
              "border-t flex items-center gap-3 flex-shrink-0",
              isMobile 
                ? "p-4 flex-col-reverse safe-area-pb" 
                : "p-6 justify-end"
            )}>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className={cn(
                  isMobile && "w-full h-11 touch-target"
                )}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  isMobile && "w-full h-11 touch-target"
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className={cn(
                      "mr-2 animate-spin",
                      isMobile ? "w-4 h-4" : "w-4 h-4"
                    )} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className={cn(
                      "mr-2",
                      isMobile ? "w-4 h-4" : "w-4 h-4"
                    )} />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
};