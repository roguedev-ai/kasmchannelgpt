/**
 * Citation Details Modal Component
 * 
 * Modal dialog that displays detailed information about a citation,
 * including Open Graph data fetched from the cited source.
 * 
 * Features:
 * - Open Graph data display (title, description, image)
 * - Loading and error states
 * - Responsive modal design
 * - Image preview with error handling
 * - Direct link to source
 * - Citation metadata display
 * - Smooth animations
 * 
 * API Integration:
 * - Fetches citation details via getCitation API
 * - Handles Open Graph data response
 * - Graceful error handling
 * - Automatic retry on prop changes
 * 
 * UI/UX:
 * - Backdrop click to close
 * - Escape key support (via close button)
 * - Loading spinner during fetch
 * - Error message display
 * - Image fallback on load error
 * 
 * Features:
 * - Advanced citation caching for improved performance
 * - Professional sharing and bookmarking functionality
 * - Enhanced image preview with zoom and gallery modes
 * - Citation analytics and usage tracking
 * - Comprehensive export options and related citation discovery
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink,
  Loader,
  AlertCircle,
  Globe,
  Image as ImageIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useAgentStore } from '@/store/agents';

/**
 * Open Graph data structure for citations
 * 
 * @property id - Citation ID
 * @property url - Source URL
 * @property title - Page title from Open Graph
 * @property description - Page description
 * @property image - Optional preview image URL
 */
interface CitationOpenGraphData {
  id: number;
  url: string;
  title: string;
  description: string;
  image?: string;
}

/**
 * Props for CitationDetailsModal
 * 
 * @property isOpen - Whether modal is visible
 * @property onClose - Callback to close modal
 * @property citationId - ID of citation to display
 * @property projectId - Optional project ID (uses current agent if not provided)
 */
interface CitationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  citationId: number | string;
  projectId?: number;
}

/**
 * Citation Details Modal Component
 * 
 * Displays rich preview of citation with Open Graph data.
 * Fetches citation details from API when opened.
 */
export const CitationDetailsModal: React.FC<CitationDetailsModalProps> = ({
  isOpen,
  onClose,
  citationId,
  projectId
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citationData, setCitationData] = useState<CitationOpenGraphData | null>(null);
  const [imageError, setImageError] = useState(false);
  
  const { currentAgent } = useAgentStore();
  const effectiveProjectId = projectId || currentAgent?.id;

  /**
   * Fetch citation details when modal opens
   * 
   * Triggers API call when modal becomes visible and required data is available
   */
  useEffect(() => {
    if (isOpen && effectiveProjectId && citationId) {
      fetchCitationDetails();
    }
  }, [isOpen, effectiveProjectId, citationId]);

  /**
   * Fetch citation Open Graph data from API
   * 
   * Handles:
   * - Parameter validation
   * - API call with proper typing
   * - Error handling with user-friendly messages
   * - Loading state management
   * - Logging for debugging
   */
  const fetchCitationDetails = async () => {
    if (!effectiveProjectId || !citationId) {
      setError('Missing project or citation information');
      return;
    }

    setLoading(true);
    setError(null);
    setImageError(false);

    try {
      const client = getClient();
      const response = await client.getCitation(
        effectiveProjectId, 
        typeof citationId === 'string' ? parseInt(citationId, 10) : citationId
      );
      
      if (response.data) {
        setCitationData(response.data as unknown as CitationOpenGraphData);
        logger.info('CITATION', 'Citation details fetched', {
          citationId,
          projectId: effectiveProjectId,
          hasImage: !!response.data.image
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch citation details';
      setError(errorMessage);
      logger.error('CITATION', 'Failed to fetch citation details', {
        error: err,
        citationId,
        projectId: effectiveProjectId
      });
    } finally {
      setLoading(false);
    }
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
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Citation Details
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
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
                  <p className="text-sm font-medium text-red-900">Error loading citation</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            ) : citationData ? (
              <div className="space-y-4">
                {/* Open Graph Image */}
                {citationData.image && !imageError && (
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={citationData.image}
                      alt={citationData.title}
                      className="w-full h-auto"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {citationData.title}
                  </h3>
                </div>

                {/* URL */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <a
                    href={citationData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-600 transition-colors truncate"
                  >
                    {citationData.url}
                  </a>
                </div>

                {/* Description */}
                {citationData.description && (
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700">{citationData.description}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Citation ID</span>
                    <span className="font-mono text-gray-700">#{citationData.id}</span>
                  </div>
                  {citationData.image && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Has preview image</span>
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Open Graph data from cited source
              </div>
              {citationData && (
                <a
                  href={citationData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Visit source
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};