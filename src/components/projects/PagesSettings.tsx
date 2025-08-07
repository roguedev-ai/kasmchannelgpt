'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Globe,
  Clock,
  AlertCircle,
  Database,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  HardDrive,
  File,
  Hash,
  RotateCw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatTimestamp, formatFileSize } from '@/lib/utils';
import { getClient, isClientInitialized } from '@/lib/api/client';
import type { Agent } from '@/types';
import type { Page, PagesQueryParams } from '@/types/pages.types';
import { PageMetadataModal } from '@/components/pages/PageMetadataModal';

interface PagesSettingsProps {
  project: Agent;
}

export const PagesSettings: React.FC<PagesSettingsProps> = ({ project }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingPageId, setDeletingPageId] = useState<number | null>(null);
  const [reindexingPageId, setReindexingPageId] = useState<number | null>(null);
  const [metadataPageId, setMetadataPageId] = useState<number | null>(null);
  
  const [queryParams, setQueryParams] = useState<PagesQueryParams>({
    page: 1,
    limit: 20,
    order: 'desc',
    crawl_status: 'all',
    index_status: 'all'
  });

  const [paginationInfo, setPaginationInfo] = useState({
    current_page: 1,
    total: 0,
    per_page: 20,
    last_page: 1
  });

  useEffect(() => {
    loadPages();
  }, [project.id, queryParams]);

  const loadPages = async () => {
    if (!isClientInitialized()) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = getClient();
      const response = await client.getPages(project.id, queryParams);
      
      setPages(response.data.pages.data);
      setPaginationInfo({
        current_page: response.data.pages.current_page,
        total: response.data.pages.total,
        per_page: response.data.pages.per_page,
        last_page: response.data.pages.last_page
      });
    } catch (err: any) {
      console.error('Failed to load pages:', err);
      
      if (err.status === 400) {
        setError('Invalid request. Please check the project ID.');
      } else if (err.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.status === 404) {
        setError('Project not found.');
      } else if (err.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load pages.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPages();
  };

  const handleDeletePage = async (pageId: number) => {
    if (!isClientInitialized() || deletingPageId) return;

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingPageId(pageId);
      const client = getClient();
      await client.deletePage(project.id, pageId);
      
      // Remove from local state
      setPages(prev => prev.filter(p => p.id !== pageId));
      toast.success('Page deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete page:', err);
      
      if (err.status === 400) {
        toast.error('Invalid request. Please check the page ID.');
      } else if (err.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (err.status === 404) {
        toast.error('Page not found.');
      } else if (err.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to delete page.');
      }
    } finally {
      setDeletingPageId(null);
    }
  };

  const handleReindexPage = async (pageId: number) => {
    if (!isClientInitialized() || reindexingPageId) return;

    try {
      setReindexingPageId(pageId);
      const client = getClient();
      await client.reindexPage(project.id, pageId);
      
      // Update local state to show queued status
      setPages(prev => prev.map(p => 
        p.id === pageId 
          ? { ...p, crawl_status: 'queued', index_status: 'queued' }
          : p
      ));
      
      toast.success('Page reindexing started');
    } catch (err: any) {
      console.error('Failed to reindex page:', err);
      
      if (err.status === 400) {
        toast.error('Invalid request. Please check the page ID.');
      } else if (err.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (err.status === 403) {
        toast.error('The page could not be reindexed.');
      } else if (err.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to reindex page.');
      }
    } finally {
      setReindexingPageId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    // Scroll to top when changing pages
    const container = document.querySelector('.overflow-y-auto');
    if (container) {
      container.scrollTop = 0;
    }
    setQueryParams(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: keyof PagesQueryParams, value: any) => {
    setQueryParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Filter pages locally based on search query
  const filteredPages = pages.filter(page => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      page.page_url.toLowerCase().includes(query) ||
      (page.filename && page.filename.toLowerCase().includes(query))
    );
  });

  const crawlStatusColors = {
    queued: 'text-yellow-600 bg-yellow-100',
    crawling: 'text-blue-600 bg-blue-100',
    crawled: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
  };

  const indexStatusColors = {
    queued: 'text-yellow-600 bg-yellow-100',
    indexing: 'text-blue-600 bg-blue-100',
    indexed: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Content Pages</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage indexed content for {project.project_name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Error loading pages</span>
          </div>
          <p className="text-red-700 mt-1 text-xs">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={queryParams.crawl_status}
            onChange={(e) => handleFilterChange('crawl_status', e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Crawl</option>
            <option value="queued">Queued</option>
            <option value="crawling">Crawling</option>
            <option value="crawled">Crawled</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={queryParams.index_status}
            onChange={(e) => handleFilterChange('index_status', e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Index</option>
            <option value="queued">Queued</option>
            <option value="indexing">Indexing</option>
            <option value="indexed">Indexed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={queryParams.order}
            onChange={(e) => handleFilterChange('order', e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Card className="p-3">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <p className="text-xs font-medium text-gray-600">Total Pages</p>
              <p className="text-lg font-bold text-gray-900">{loading ? '-' : paginationInfo.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <p className="text-xs font-medium text-gray-600">Indexed</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? '-' : pages.filter(p => p.index_status === 'indexed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <p className="text-xs font-medium text-gray-600">Processing</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? '-' : pages.filter(p => 
                  p.crawl_status === 'crawling' || p.index_status === 'indexing'
                ).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <p className="text-xs font-medium text-gray-600">Failed</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? '-' : pages.filter(p => 
                  p.crawl_status === 'failed' || p.index_status === 'failed'
                ).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pages List */}
      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : filteredPages.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-2">
            {searchQuery ? 'No pages found' : 'No pages indexed yet'}
          </h3>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try adjusting your search criteria'
              : 'Add content sources to start indexing pages'
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPages.map((page) => (
            <Card key={page.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                {/* Page Icon */}
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                  {page.is_file ? (
                    <File className="w-4 h-4 text-brand-600" />
                  ) : (
                    <Globe className="w-4 h-4 text-brand-600" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600">
                          Page #{page.id}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {page.filename || page.page_url}
                      </h3>
                      
                      {page.page_url && (
                        <p className="text-xs text-gray-600 truncate mb-2">
                          {page.page_url}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Crawl:</span>
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium',
                        crawlStatusColors[page.crawl_status]
                      )}>
                        {page.crawl_status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Index:</span>
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium',
                        indexStatusColors[page.index_status]
                      )}>
                        {page.index_status}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                    <span>Created: {formatTimestamp(page.created_at)}</span>
                    <span>Updated: {formatTimestamp(page.updated_at)}</span>
                    {page.filesize && (
                      <span>Size: {formatFileSize(page.filesize)}</span>
                    )}
                  </div>

                  {/* Additional Info */}
                  {page.s3_path && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <HardDrive className="w-3 h-3" />
                      <span className="truncate">Storage: {page.s3_path}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setMetadataPageId(page.id)}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      Metadata
                    </Button>
                    
                    {page.is_refreshable && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleReindexPage(page.id)}
                        disabled={reindexingPageId === page.id}
                      >
                        {reindexingPageId === page.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RotateCw className="w-4 h-4 mr-2" />
                        )}
                        Re-index
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeletePage(page.id)}
                      disabled={deletingPageId === page.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingPageId === page.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {paginationInfo.last_page > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            Showing {((paginationInfo.current_page - 1) * paginationInfo.per_page) + 1} to{' '}
            {Math.min(paginationInfo.current_page * paginationInfo.per_page, paginationInfo.total)} of{' '}
            {paginationInfo.total} pages
          </div>
          
          <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(paginationInfo.current_page - 1)}
              disabled={paginationInfo.current_page === 1}
            >
              Previous
            </Button>
            
            {(() => {
              const currentPage = paginationInfo.current_page;
              const lastPage = paginationInfo.last_page;
              const pages = [];
              
              // Always show first page if not in range
              if (currentPage > 3) {
                pages.push(
                  <Button
                    key={1}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </Button>
                );
                if (currentPage > 4) {
                  pages.push(<span key="ellipsis1" className="px-1 text-xs text-gray-500">...</span>);
                }
              }
              
              // Show pages around current page
              for (let i = Math.max(1, currentPage - 2); i <= Math.min(lastPage, currentPage + 2); i++) {
                pages.push(
                  <Button
                    key={i}
                    variant={i === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(i)}
                  >
                    {i}
                  </Button>
                );
              }
              
              // Always show last page if not in range
              if (currentPage < lastPage - 2) {
                if (currentPage < lastPage - 3) {
                  pages.push(<span key="ellipsis2" className="px-1 text-xs text-gray-500">...</span>);
                }
                pages.push(
                  <Button
                    key={lastPage}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(lastPage)}
                  >
                    {lastPage}
                  </Button>
                );
              }
              
              return pages;
            })()}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(paginationInfo.current_page + 1)}
              disabled={paginationInfo.current_page === paginationInfo.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Metadata Modal */}
      {metadataPageId !== null && (
        <PageMetadataModal
          projectId={project.id}
          pageId={metadataPageId}
          onClose={() => setMetadataPageId(null)}
          onUpdate={() => {
            // Optionally refresh pages after metadata update
            loadPages();
          }}
        />
      )}
    </div>
  );
};