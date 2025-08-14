'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTimestamp, formatFileSize } from '@/lib/utils';
import type { Source } from '@/types/sources.types';
import type { Page } from '@/types/pages.types';
import { getClient, isClientInitialized } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';
import {
  CheckCircle,
  Clock,
  XCircle,
  File,
  Link,
  RefreshCw,
  Database,
  Calendar,
  HardDrive,
  Hash,
  FileText
} from 'lucide-react';

interface SourcePageDetailsProps {
  source: Source;
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SourcePageDetails: React.FC<SourcePageDetailsProps> = ({
  source,
  projectId,
  open,
  onOpenChange
}) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [displayedPages, setDisplayedPages] = useState<Page[]>([]);
  const [totalPageCount, setTotalPageCount] = useState<number | string>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadFullList, setLoadFullList] = useState(false);
  const pageSize = 50;

  useEffect(() => {
    if (open) {
      // Reset state when opening
      setPages([]);
      setDisplayedPages([]);
      setTotalPageCount(0);
      setLoadFullList(false);
      
      // Use pages from source if available
      if (source.pages && source.pages.length > 0) {
        setPages(source.pages);
        setDisplayedPages(source.pages.slice(0, pageSize));
        setTotalPageCount(source.pages.length);
      } else if (source.pageCount !== undefined) {
        // Use pageCount if available but no pages loaded
        setTotalPageCount(source.pageCount);
      } else {
        // No data available - user needs to load them
        setTotalPageCount(0);
      }
    }
  }, [open, source]);

  // Load full page list only when requested
  const loadAllPages = async () => {
    if (!isClientInitialized()) {
      setError('API client not initialized');
      return;
    }
    
    setLoading(true);
    setError(null);
    setLoadFullList(true);
    
    try {
      const client = getClient();
      let allSourcePages: Page[] = [];
      let page = 1;
      const maxPages = 5; // Limit to 5 pages (500 items) for performance
      
      // First, let's check if there are any pages at all
      const firstCheck = await client.getPages(projectId, { 
        limit: 1, 
        page: 1 
      });
      
      console.log('Total pages in project:', firstCheck.data.pages.total);
      
      if (firstCheck.data.pages.total === 0) {
        setError('No pages found in this project. The sitemap may not have been crawled yet.');
        setLoading(false);
        return;
      }
      
      // Fetch pages in smaller batches
      while (page <= maxPages) {
        const response = await client.getPages(projectId, { 
          limit: 100, 
          page: page 
        });
        
        const batch = response.data.pages.data;
        
        // Filter pages that belong to this source
        const sourcePagesInBatch = batch.filter((p: any) => {
          if (source.type === 'sitemap' && source.settings.sitemap_path) {
            try {
              const sitemapDomain = new URL(source.settings.sitemap_path).hostname;
              const pageDomain = new URL(p.page_url).hostname;
              
              // More lenient matching - check if domains match OR if the page URL contains the sitemap domain
              const exactMatch = pageDomain === sitemapDomain;
              const containsMatch = p.page_url.includes(sitemapDomain);
              const matches = exactMatch || containsMatch;
              
              // Debug logging for first few pages
              if (allSourcePages.length < 5) {
                console.log('Sitemap page check:', {
                  sitemapUrl: source.settings.sitemap_path,
                  sitemapDomain,
                  pageUrl: p.page_url,
                  pageDomain,
                  exactMatch,
                  containsMatch,
                  matches,
                  pageIsFile: p.is_file,
                  crawlStatus: p.crawl_status,
                  indexStatus: p.index_status
                });
              }
              
              return matches;
            } catch (e) {
              console.error('Error parsing URL:', p.page_url, e);
              return false;
            }
          }
          
          if (source.type === 'upload') {
            return p.is_file === true;
          }
          
          return false;
        });
        
        allSourcePages = [...allSourcePages, ...sourcePagesInBatch];
        
        console.log(`Page ${page}: Found ${sourcePagesInBatch.length} matching pages out of ${batch.length} total`);
        
        // Update display progressively
        setPages(allSourcePages);
        setDisplayedPages(allSourcePages.slice(0, Math.min(displayedPages.length + pageSize, allSourcePages.length)));
        setTotalPageCount(allSourcePages.length);
        
        // Check if we've fetched all pages
        if (!response.data.pages.next_page_url || batch.length === 0) {
          break;
        }
        
        page++;
      }
      
      if (page > maxPages) {
        setTotalPageCount(`${allSourcePages.length}+`);
      }
      
    } catch (err) {
      console.error('Failed to fetch pages:', err);
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };


  const handleShowMore = () => {
    // Show more from already loaded pages
    const newLength = Math.min(displayedPages.length + pageSize, pages.length);
    setDisplayedPages(pages.slice(0, newLength));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'indexed':
      case 'crawled':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'indexing':
      case 'crawling':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'indexed':
      case 'crawled':
        return 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400';
      case 'indexing':
      case 'crawling':
        return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      case 'failed':
        return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Source Details</DialogTitle>
          <DialogDescription>
            Detailed information about pages in this source
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source Summary */}
          <div className="bg-secondary p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Source Type:</span>
              <span>{source.type}</span>
            </div>
            {source.settings.sitemap_path && (
              <div className="flex items-center gap-2 min-w-0">
                <Link className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium flex-shrink-0">URL:</span>
                <span className="text-sm truncate flex-1 min-w-0">{source.settings.sitemap_path}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Total Pages:</span>
              <span>{totalPageCount}</span>
              {(totalPageCount === 0 || (typeof totalPageCount === 'number' && totalPageCount > 0 && pages.length === 0)) && !loadFullList && (
                <button
                  onClick={loadAllPages}
                  className="ml-2 text-sm text-primary hover:text-primary/90 underline"
                >
                  Load pages
                </button>
              )}
            </div>
          </div>

          {/* Pages List */}
          <div>
            <h3 className="font-medium mb-2">
              Pages ({totalPageCount})
              {displayedPages.length < pages.length && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (showing {displayedPages.length})
                </span>
              )}
            </h3>
            <ScrollArea className="h-[400px] border rounded-lg">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading pages...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-600">{error}</div>
              ) : pages.length === 0 && !loadFullList ? (
                <div className="p-4 text-center space-y-4">
                  <p className="text-muted-foreground">Page details not loaded</p>
                  <button
                    onClick={loadAllPages}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Load All Pages
                  </button>
                </div>
              ) : pages.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No pages found for this source</div>
              ) : (
                <div>
                  <div className="divide-y">
                    {displayedPages.map((page, index) => (
                  <div key={page.id} className="p-4 hover:bg-accent overflow-hidden">
                    <div className="space-y-2">
                      {/* Page URL/Filename */}
                      <div className="flex items-start gap-2 min-w-0">
                        {page.is_file ? (
                          <File className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Link className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-medium text-sm truncate" title={page.filename || page.page_url}>
                            {page.filename || page.page_url}
                          </p>
                          {page.is_file && page.page_url && (
                            <p className="text-xs text-muted-foreground truncate" title={page.page_url}>{page.page_url}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className={getStatusColor(page.crawl_status)}>
                          {getStatusIcon(page.crawl_status)}
                          <span className="ml-1">Crawl: {page.crawl_status}</span>
                        </Badge>
                        <Badge variant="secondary" className={getStatusColor(page.index_status)}>
                          {getStatusIcon(page.index_status)}
                          <span className="ml-1">Index: {page.index_status}</span>
                        </Badge>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {page.filesize && (
                          <div className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            <span>Size: {formatFileSize(page.filesize)}</span>
                          </div>
                        )}
                        {page.s3_path && (
                          <div className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            <span>Storage: S3</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          <span>Refreshable: {page.is_refreshable ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          <span>File Kept: {page.is_file_kept ? 'Yes' : 'No'}</span>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Created: {formatTimestamp(page.created_at)}</span>
                        </div>
                        {page.updated_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Updated: {formatTimestamp(page.updated_at)}</span>
                          </div>
                        )}
                        {page.deleted_at && (
                          <div className="flex items-center gap-1 text-red-600">
                            <Calendar className="w-3 h-3" />
                            <span>Deleted: {formatTimestamp(page.deleted_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Page Hash */}
                      {page.page_url_hash && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground/70 min-w-0">
                          <Hash className="w-3 h-3 flex-shrink-0" />
                          <span className="font-mono truncate" title={page.page_url_hash}>{page.page_url_hash}</span>
                        </div>
                      )}
                    </div>
                  </div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {displayedPages.length < pages.length && (
                    <div className="p-4 text-center border-t">
                      <button
                        onClick={handleShowMore}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Show More
                        <span className="ml-1 text-muted-foreground">
                          ({pages.length - displayedPages.length} more)
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};