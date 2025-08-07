import { create } from 'zustand';
import { getClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { AgentLicense } from '@/types';

interface LicenseStore {
  licenses: AgentLicense[];
  loading: boolean;
  error: string | null;
  
  fetchLicenses: (projectId: number) => Promise<void>;
  createLicense: (projectId: number, name: string) => Promise<AgentLicense>;
  updateLicense: (projectId: number, licenseId: string, name: string) => Promise<void>;
  deleteLicense: (projectId: number, licenseId: string) => Promise<void>;
  clearError: () => void;
}

export const useLicenseStore = create<LicenseStore>((set, get) => ({
  licenses: [],
  loading: false,
  error: null,

  fetchLicenses: async (projectId: number) => {
    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      const response = await client.getLicenses(projectId);
      
      logger.info('LICENSES', 'API Response', {
        projectId,
        status: 'success',
        responseType: typeof response,
        hasData: !!response?.data,
        dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 0,
        fullResponse: response
      });
      
      // Handle response format based on API documentation
      const licenses = Array.isArray(response.data) ? response.data : [];
      
      logger.info('LICENSES', 'Processed licenses', {
        count: licenses.length,
        licenses: licenses.map((l: any) => ({ 
          name: l.name, 
          key: l.key?.substring(0, 8) + '...', 
          project_id: l.project_id 
        }))
      });
      
      set({ 
        licenses,
        loading: false 
      });
    } catch (error: any) {
      logger.error('LICENSES', 'Failed to fetch licenses', {
        projectId,
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorStatus: error?.status,
        errorCode: error?.code,
        fullError: error
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch licenses';
      set({ 
        error: errorMessage,
        loading: false,
        licenses: []
      });
    }
  },

  createLicense: async (projectId: number, name: string) => {
    set({ loading: true, error: null });
    
    logger.info('LICENSES', 'Creating license', {
      projectId,
      name
    });
    
    try {
      const client = getClient();
      const response = await client.createLicense(projectId, { name });
      
      logger.info('LICENSES', 'Create license API response', {
        projectId,
        name,
        status: 'success',
        responseType: typeof response,
        hasData: !!response?.data,
        dataStructure: response?.data ? Object.keys(response.data) : [],
        licenseKey: response.data?.licenseKey?.substring(0, 8) + '...',
        fullResponse: response
      });
      
      // Handle response format based on API documentation
      // Response contains { license: {...}, licenseKey: "..." }
      const newLicense = response.data?.license || response.data;
      
      if (newLicense) {
        logger.info('LICENSES', 'New license created', {
          licenseName: newLicense.name,
          licenseKey: newLicense.key?.substring(0, 8) + '...',
          project_id: newLicense.project_id
        });
        
        set(state => ({
          licenses: [...state.licenses, newLicense],
          loading: false
        }));
      }
      
      return newLicense;
    } catch (error: any) {
      logger.error('LICENSES', 'Failed to create license', {
        projectId,
        name,
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorStatus: error?.status,
        errorCode: error?.code,
        fullError: error
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create license';
      set({ 
        error: errorMessage,
        loading: false 
      });
      
      throw error;
    }
  },

  updateLicense: async (projectId: number, licenseId: string, name: string) => {
    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      const response = await client.updateLicense(projectId, licenseId, { name });
      
      logger.info('LICENSES', 'Updated license', {
        projectId,
        licenseId,
        name
      });
      
      // Handle response format based on API documentation
      const updatedLicense = (response as any).license || response.data;
      
      if (updatedLicense) {
        set(state => ({
          licenses: state.licenses.map(license => 
            license.key === licenseId ? { ...license, name, updated_at: new Date().toISOString() } : license
          ),
          loading: false
        }));
      }
    } catch (error) {
      logger.error('LICENSES', 'Failed to update license', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update license';
      set({ 
        error: errorMessage,
        loading: false 
      });
      
      throw error;
    }
  },

  deleteLicense: async (projectId: number, licenseId: string) => {
    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      await client.deleteLicense(projectId, licenseId);
      
      logger.info('LICENSES', 'Deleted license', {
        projectId,
        licenseId
      });
      
      set(state => ({
        licenses: state.licenses.filter(license => license.key !== licenseId),
        loading: false
      }));
    } catch (error) {
      logger.error('LICENSES', 'Failed to delete license', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete license';
      set({ 
        error: errorMessage,
        loading: false 
      });
      
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));