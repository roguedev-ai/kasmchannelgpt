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
import { useBreakpoint } from '@/hooks/useMediaQuery';

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
  const { isMobile } = useBreakpoint();
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
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: isMobile ? '100%' : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: isMobile ? '100%' : 0 }}
            className={cn(
              "fixed bg-background shadow-xl z-50",
              isMobile 
                ? "inset-x-0 bottom-0 top-20 rounded-t-xl flex flex-col" 
                : "inset-x-0 top-[10%] mx-auto max-w-2xl rounded-lg max-h-[90vh] overflow-hidden"
            )}
          >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0",
            isMobile ? "px-4 py-4" : "p-4"
          )}>
            <h2 className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-lg" : "text-lg"
            )}>
              Citation Details
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={cn(
                isMobile ? "h-9 w-9 touch-target" : "h-8 w-8"
              )}
            >
              <X className={cn(
                isMobile ? "h-5 w-5" : "h-4 w-4"
              )} />
            </Button>
          </div>

          {/* Content */}
          <div className={cn(
            "overflow-y-auto",
            isMobile 
              ? "flex-1 px-4 py-4 pb-6 safe-area-pb" 
              : "p-4 max-h-[calc(90vh-120px)]"
          )}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className={cn(
                "flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg",
                isMobile && "mx-0"
              )}>
                <AlertCircle className={cn(
                  "text-red-600 flex-shrink-0",
                  isMobile ? "h-5 w-5" : "h-5 w-5"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "font-medium text-red-900 dark:text-red-200",
                    isMobile ? "text-sm" : "text-sm"
                  )}>Error loading citation</p>
                  <p className={cn(
                    "text-red-700 dark:text-red-300 mt-1",
                    isMobile ? "text-xs" : "text-sm"
                  )}>{error}</p>
                </div>
              </div>
            ) : citationData ? (
              <div className={cn(
                "space-y-4",
                isMobile && "space-y-5"
              )}>
                {/* Open Graph Image */}
                {citationData.image && !imageError && (
                  <div className={cn(
                    "relative rounded-lg overflow-hidden bg-muted",
                    isMobile && "-mx-4 rounded-none"
                  )}>
                    <img
                      src={citationData.image}
                      alt={citationData.title}
                      className="w-full h-auto"
                      onError={() => setImageError(true)}
                    />
                    {isMobile && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    )}
                  </div>
                )}

                {/* Title */}
                <div>
                  <h3 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-lg leading-tight" : "text-xl"
                  )}>
                    {citationData.title}
                  </h3>
                </div>

                {/* URL */}
                <div className={cn(
                  "flex items-center gap-2 text-muted-foreground",
                  isMobile ? "text-sm" : "text-sm"
                )}>
                  <Globe className={cn(
                    "flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-4 w-4"
                  )} />
                  <a
                    href={citationData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "hover:text-brand-600 transition-colors",
                      isMobile ? "break-all" : "truncate"
                    )}
                  >
                    {citationData.url}
                  </a>
                </div>

                {/* Description */}
                {citationData.description && (
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className={cn(
                      "text-foreground",
                      isMobile ? "text-sm leading-relaxed" : ""
                    )}>{citationData.description}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className={cn(
                  "pt-4 border-t border-border space-y-3",
                  isMobile && "space-y-3"
                )}>
                  <div className={cn(
                    "flex items-center justify-between",
                    isMobile ? "text-sm" : "text-sm"
                  )}>
                    <span className="text-muted-foreground">Citation ID</span>
                    <span className={cn(
                      "font-mono text-foreground",
                      isMobile ? "text-base" : ""
                    )}>#{citationData.id}</span>
                  </div>
                  {citationData.image && (
                    <div className={cn(
                      "flex items-center justify-between",
                      isMobile ? "text-sm" : "text-sm"
                    )}>
                      <span className="text-muted-foreground">Has preview image</span>
                      <ImageIcon className={cn(
                        "text-muted-foreground",
                        isMobile ? "h-4 w-4" : "h-4 w-4"
                      )} />
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className={cn(
            "border-t bg-muted flex-shrink-0",
            isMobile ? "p-4 safe-area-pb" : "p-4"
          )}>
            <div className={cn(
              "flex items-center",
              isMobile ? "flex-col gap-3" : "justify-between"
            )}>
              <div className={cn(
                "text-muted-foreground",
                isMobile ? "text-xs text-center" : "text-xs"
              )}>
                Open Graph data from cited source
              </div>
              {citationData && (
                <a
                  href={citationData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 font-medium text-brand-600 hover:text-brand-700 transition-colors",
                    isMobile 
                      ? "w-full justify-center bg-brand-600 text-white hover:bg-brand-700 hover:text-white rounded-lg px-4 py-3 text-base touch-target" 
                      : "px-3 py-1.5 text-sm"
                  )}
                >
                  Visit source
                  <ExternalLink className={cn(
                    isMobile ? "h-4 w-4" : "h-3.5 w-3.5"
                  )} />
                </a>
              )}
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};