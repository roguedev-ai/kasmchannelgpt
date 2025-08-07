import { create } from 'zustand';
import { getClient, isClientInitialized } from '@/lib/api/client';
import { toast } from 'sonner';
import type { Page, PagesQueryParams } from '@/types/pages.types';

interface PagesState {
  pages: Page[];
  loading: boolean;
  error: string | null;
  paginationInfo: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
  queryParams: PagesQueryParams;
  
  // Actions
  fetchPages: (projectId: number) => Promise<void>;
  deletePage: (projectId: number, pageId: number) => Promise<void>;
  reindexPage: (projectId: number, pageId: number) => Promise<void>;
  
  // UI State
  setQueryParams: (params: Partial<PagesQueryParams>) => void;
  reset: () => void;
}

export const usePageStore = create<PagesState>((set, get) => ({
  pages: [],
  loading: false,
  error: null,
  paginationInfo: {
    current_page: 1,
    total: 0,
    per_page: 20,
    last_page: 1
  },
  queryParams: {
    page: 1,
    limit: 20,
    order: 'desc',
    crawl_status: 'all',
    index_status: 'all'
  },

  fetchPages: async (projectId: number) => {
    if (!isClientInitialized()) {
      set({ error: 'API client not initialized' });
      return;
    }

    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      const { queryParams } = get();
      const response = await client.getPages(projectId, queryParams);
      
      set({ 
        pages: response.data.pages.data,
        paginationInfo: {
          current_page: response.data.pages.current_page,
          total: response.data.pages.total,
          per_page: response.data.pages.per_page,
          last_page: response.data.pages.last_page
        },
        loading: false 
      });
    } catch (error: any) {
      console.error('Failed to fetch pages:', error);
      
      let errorMessage = 'Failed to fetch pages';
      if (error.status === 400) {
        errorMessage = 'Invalid request. Please check the project ID.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.status === 404) {
        errorMessage = 'Project not found.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      set({ 
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
    }
  },

  deletePage: async (projectId: number, pageId: number) => {
    if (!isClientInitialized()) {
      toast.error('API client not initialized');
      return;
    }

    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      await client.deletePage(projectId, pageId);
      
      set(state => ({
        pages: state.pages.filter(page => page.id !== pageId),
        loading: false,
      }));
      
      toast.success('Page deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete page:', error);
      
      let errorMessage = 'Failed to delete page';
      if (error.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.status === 404) {
        errorMessage = 'Page not found.';
      }
      
      set({ 
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
    }
  },

  reindexPage: async (projectId: number, pageId: number) => {
    if (!isClientInitialized()) {
      toast.error('API client not initialized');
      return;
    }

    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      await client.reindexPage(projectId, pageId);
      
      // Update local state to show queued status
      set(state => ({
        pages: state.pages.map(page => 
          page.id === pageId 
            ? { ...page, crawl_status: 'queued', index_status: 'queued' }
            : page
        ),
        loading: false,
      }));
      
      toast.success('Page reindexing started');
    } catch (error: any) {
      console.error('Failed to reindex page:', error);
      
      let errorMessage = 'Failed to reindex page';
      if (error.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'The page could not be reindexed.';
      }
      
      set({ 
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
    }
  },

  setQueryParams: (params: Partial<PagesQueryParams>) => {
    set(state => ({
      queryParams: { ...state.queryParams, ...params },
    }));
  },

  reset: () => {
    set({
      pages: [],
      loading: false,
      error: null,
      paginationInfo: {
        current_page: 1,
        total: 0,
        per_page: 20,
        last_page: 1
      },
      queryParams: {
        page: 1,
        limit: 20,
        order: 'desc',
        crawl_status: 'all',
        index_status: 'all'
      },
    });
  },
}));