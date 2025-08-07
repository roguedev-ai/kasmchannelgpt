// Sources store - provides state management for source data
// Currently uses direct API calls in components

import { create } from 'zustand';
import { getClient } from '@/lib/api/client';
import { toast } from 'sonner';

export interface Source {
  id: string;
  project_id: number;
  name: string;
  type: 'file' | 'url' | 'text' | 'api';
  status: 'active' | 'inactive' | 'processing' | 'error';
  size?: number;
  file_type?: string;
  url?: string;
  content?: string;
  metadata?: {
    description?: string;
    tags?: string[];
    author?: string;
    lastIndexed?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  indexed_at?: string;
  error_message?: string;
}

interface SourcesState {
  sources: Source[];
  currentSource: Source | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filter: {
    status?: 'active' | 'inactive' | 'processing' | 'error' | 'all';
    type?: 'file' | 'url' | 'text' | 'api' | 'all';
    sortBy?: 'name' | 'created_at' | 'updated_at' | 'size';
    sortOrder?: 'asc' | 'desc';
  };
  syncStatus: {
    syncing: boolean;
    lastSync?: string;
    progress?: number;
  };
  
  // Actions
  fetchSources: (projectId: number) => Promise<void>;
  fetchSource: (projectId: number, sourceId: string) => Promise<void>;
  uploadSources: (projectId: number, files: File[]) => Promise<void>;
  updateSource: (projectId: number, sourceId: string, updates: Partial<Source>) => Promise<void>;
  deleteSource: (projectId: number, sourceId: string) => Promise<void>;
  bulkDelete: (projectId: number, sourceIds: string[]) => Promise<void>;
  syncSources: (projectId: number) => Promise<void>;
  
  // UI State
  setSearchQuery: (query: string) => void;
  setFilter: (filter: Partial<SourcesState['filter']>) => void;
  selectSource: (source: Source | null) => void;
  reset: () => void;
}

// Store implementation for source management
export const useSourceStore = create<SourcesState>((set, get) => ({
  sources: [],
  currentSource: null,
  loading: false,
  error: null,
  searchQuery: '',
  filter: {
    status: 'all',
    type: 'all',
    sortBy: 'updated_at',
    sortOrder: 'desc',
  },
  syncStatus: {
    syncing: false,
  },

  fetchSources: async (projectId: number) => {
    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      const response = await client.getSources(projectId);
      
      // Extract all sources from sitemaps and uploads
      const allSources: Source[] = [];
      
      if (response.data.sitemaps) {
        // Map API source structure to store's Source interface
        response.data.sitemaps.forEach((apiSource: any) => {
          allSources.push({
            id: apiSource.id.toString(),
            project_id: projectId,
            name: apiSource.settings.sitemap_path || `Source ${apiSource.id}`,
            type: 'url', // Map 'sitemap' to 'url'
            status: 'active',
            metadata: {
              ...apiSource.settings,
              pages: apiSource.pages,
            },
            created_at: apiSource.created_at,
            updated_at: apiSource.updated_at,
          });
        });
      }
      
      if (response.data.uploads) {
        const uploads = Array.isArray(response.data.uploads) 
          ? response.data.uploads 
          : [response.data.uploads];
          
        uploads.forEach((apiSource: any) => {
          allSources.push({
            id: apiSource.id.toString(),
            project_id: projectId,
            name: `Upload ${apiSource.id}`,
            type: 'file',
            status: 'active',
            metadata: {
              ...apiSource.settings,
              pages: apiSource.pages,
            },
            created_at: apiSource.created_at,
            updated_at: apiSource.updated_at,
          });
        });
      }
      
      set({ sources: allSources, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch sources',
        loading: false,
      });
      toast.error('Failed to load sources');
    }
  },

  fetchSource: async (projectId: number, sourceId: string) => {
    set({ loading: true, error: null });
    
    try {
      // const client = getClient();
      // const response = await client.getSource(projectId, sourceId);
      
      // const source = response.data;
      // set({ currentSource: source, loading: false });
      throw new Error('getSource API method not available');
      
      // Update in the list as well
      // set(state => ({
      //   sources: state.sources.map(s => s.id === sourceId ? source : s),
      // }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch source',
        loading: false,
      });
      toast.error('Failed to load source details');
    }
  },

  uploadSources: async (projectId: number, files: File[]) => {
    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      
      // Upload files one by one for better progress tracking
      const uploadPromises = files.map(file => 
        Promise.reject(new Error('uploadFile API method not available'))
      );
      
      const responses = await Promise.all(uploadPromises);
      
      // Refresh sources list
      await get().fetchSources(projectId);
      
      toast.success(`Successfully uploaded ${files.length} file(s)`);
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to upload sources',
        loading: false,
      });
      toast.error('Failed to upload files');
      throw error;
    }
  },

  updateSource: async (projectId: number, sourceId: string, updates: Partial<Source>) => {
    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      // await client.updateSource(projectId, sourceId, {
      throw new Error('updateSource API method not available');
      /*
        name: updates.name,
        metadata: updates.metadata,
        status: updates.status,
      }); */
      
      set(state => ({
        sources: state.sources.map(source => 
          source.id === sourceId 
            ? { ...source, ...updates, updated_at: new Date().toISOString() } 
            : source
        ),
        currentSource: state.currentSource?.id === sourceId 
          ? { ...state.currentSource, ...updates, updated_at: new Date().toISOString() }
          : state.currentSource,
        loading: false,
      }));
      
      toast.success('Source updated successfully');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update source',
        loading: false,
      });
      toast.error('Failed to update source');
      throw error;
    }
  },

  deleteSource: async (projectId: number, sourceId: string) => {
    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      await client.deleteSource(projectId, parseInt(sourceId));
      
      set(state => ({
        sources: state.sources.filter(source => source.id !== sourceId),
        currentSource: state.currentSource?.id === sourceId ? null : state.currentSource,
        loading: false,
      }));
      
      toast.success('Source deleted successfully');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete source',
        loading: false,
      });
      toast.error('Failed to delete source');
      throw error;
    }
  },

  bulkDelete: async (projectId: number, sourceIds: string[]) => {
    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      
      // Delete sources in parallel
      await Promise.all(
        sourceIds.map(sourceId => client.deleteSource(projectId, parseInt(sourceId)))
      );
      
      set(state => ({
        sources: state.sources.filter(source => !sourceIds.includes(source.id)),
        currentSource: sourceIds.includes(state.currentSource?.id || '') 
          ? null 
          : state.currentSource,
        loading: false,
      }));
      
      toast.success(`Successfully deleted ${sourceIds.length} source(s)`);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete sources',
        loading: false,
      });
      toast.error('Failed to delete sources');
      throw error;
    }
  },

  syncSources: async (projectId: number) => {
    set(state => ({
      syncStatus: { ...state.syncStatus, syncing: true, progress: 0 }
    }));
    
    try {
      const client = getClient();
      // await client.syncSources(projectId);
      throw new Error('syncSources API method not available');
      
      // Refresh sources after sync
      await get().fetchSources(projectId);
      
      set(state => ({
        syncStatus: {
          syncing: false,
          lastSync: new Date().toISOString(),
          progress: 100,
        }
      }));
      
      toast.success('Sources synchronized successfully');
    } catch (error) {
      set(state => ({
        syncStatus: { ...state.syncStatus, syncing: false },
        error: error instanceof Error ? error.message : 'Failed to sync sources',
      }));
      toast.error('Failed to sync sources');
      throw error;
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilter: (filter: Partial<SourcesState['filter']>) => {
    set(state => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  selectSource: (source: Source | null) => {
    set({ currentSource: source });
  },

  reset: () => {
    set({
      sources: [],
      currentSource: null,
      loading: false,
      error: null,
      searchQuery: '',
      filter: {
        status: 'all',
        type: 'all',
        sortBy: 'updated_at',
        sortOrder: 'desc',
      },
      syncStatus: {
        syncing: false,
      },
    });
  },
}));