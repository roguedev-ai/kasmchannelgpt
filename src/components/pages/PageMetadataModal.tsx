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

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getClient, isClientInitialized } from '@/lib/api/client';
import type { PageMetadata } from '@/types/pages.types';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Page Metadata</h2>
            <p className="text-sm text-gray-600 mt-1">
              View and edit metadata for page #{pageId}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error loading metadata</span>
              </div>
              <p className="text-red-700 mt-1 text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Page ID (Read-only) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4" />
                  Page ID
                </label>
                <input
                  type="text"
                  value={metadata?.id || pageId}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Type className="w-4 h-4" />
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Page title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Page description"
                  rows={4}
                />
              </div>

              {/* URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4" />
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="https://example.com"
                />
              </div>

              {/* Image */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Image className="w-4 h-4" />
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="https://example.com/image.png"
                />
                
                {/* Image Preview */}
                {formData.image && (
                  <div className="mt-3">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-full max-w-xs rounded-lg border"
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
          <div className="p-6 border-t flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};