import { useState, useEffect } from 'react';
import { getClient, isClientInitialized } from '@/lib/api/client';
import { UserLimits } from '@/types';
import { toast } from 'sonner';

interface UseLimitsReturn {
  limits: UserLimits | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLimits(): UseLimitsReturn {
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLimits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if client is initialized
      if (!isClientInitialized()) {
        console.warn('API client not initialized yet');
        return;
      }
      
      const client = getClient();
      const response = await client.getUserLimits();
      setLimits(response.data);
    } catch (err: any) {
      setError(err);
      
      // Handle specific error codes
      if (err.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (err.message?.includes('not initialized')) {
        // Don't show error toast for initialization issues
        console.warn('API client not initialized');
      } else {
        toast.error('Failed to fetch usage limits');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  return {
    limits,
    isLoading,
    error,
    refetch: fetchLimits,
  };
}