import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getClient } from '@/lib/api/client';
import { toast } from 'sonner';
import type { UserProfileStore, UserProfile } from '@/types';

// CustomGPT.ai API Response format
interface CustomGPTResponse<T> {
  status: 'success' | 'error';
  data: T;
}

export const useProfileStore = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      // Initial State
      profile: null,
      loading: false,
      error: null,

      // Profile Management - GET /api/v1/user
      fetchProfile: async () => {
        set({ loading: true, error: null });
        
        try {
          const client = getClient();
          const response = await client.getUserProfile();
          
          if (response.status === 'success') {
            set({ 
              profile: response.data,
              loading: false 
            });
          } else {
            throw new Error('Failed to fetch profile');
          }
        } catch (error: any) {
          console.error('Failed to fetch profile:', error);
          
          let errorMessage = 'Failed to fetch profile';
          
          if (error.status === 401) {
            const deploymentMode = typeof window !== 'undefined' ? localStorage.getItem('customgpt.deploymentMode') : null;
            const isDemoMode = deploymentMode === 'demo';
            if (isDemoMode) {
              errorMessage = 'API key authentication failed. Please check your API key.';
              toast.error('Authentication failed. Please check your API key in demo settings.');
            } else {
              errorMessage = 'Authentication required. Please check your API key configuration.';
              toast.error('Authentication failed. Please check your API key configuration.');
            }
          } else if (error.status === 500) {
            errorMessage = 'Server error occurred. Please try again later.';
            toast.error('Server error. Please try again later.');
          } else {
            toast.error('Failed to load profile');
          }
          
          set({ 
            error: errorMessage,
            loading: false 
          });
        }
      },

      // Profile Update - POST /api/v1/user (multipart/form-data)
      updateProfile: async (name: string, profilePhoto?: File) => {
        set({ loading: true, error: null });
        
        try {
          const client = getClient();
          
          // Create FormData for multipart request
          const formData = new FormData();
          formData.append('name', name);
          
          if (profilePhoto) {
            formData.append('profile_photo', profilePhoto);
          }
          
          const response = await client.updateUserProfile(formData);
          
          if (response.status === 'success') {
            set({ 
              profile: response.data,
              loading: false 
            });
            toast.success('Profile updated successfully');
          } else {
            throw new Error('Failed to update profile');
          }
        } catch (error: any) {
          console.error('Failed to update profile:', error);
          
          let errorMessage = 'Failed to update profile';
          
          if (error.status === 401) {
            const deploymentMode = typeof window !== 'undefined' ? localStorage.getItem('customgpt.deploymentMode') : null;
            const isDemoMode = deploymentMode === 'demo';
            if (isDemoMode) {
              errorMessage = 'API key authentication failed. Please check your API key.';
              toast.error('Authentication failed. Please check your API key in demo settings.');
            } else {
              errorMessage = 'Authentication required. Please check your API key configuration.';
              toast.error('Authentication failed. Please check your API key configuration.');
            }
          } else if (error.status === 500) {
            errorMessage = 'Server error occurred. Please try again later.';
            toast.error('Server error. Please try again later.');
          } else {
            toast.error('Failed to update profile');
          }
          
          set({ 
            error: errorMessage,
            loading: false 
          });
        }
      },

      // Utility
      reset: () => {
        set({
          profile: null,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: 'profile-store',
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);