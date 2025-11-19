'use client';

import { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/session/partner-session';
import { useRouter } from 'next/navigation';
import { CollectionCard } from '@/components/partner/CollectionCard';
import { CreateCollectionModal } from '@/components/partner/CreateCollectionModal';

interface Collection {
  id: string;
  partnerId: string;
  name: string;
  description?: string;
  qdrantCollection: string;
  useRagByDefault: boolean;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    // Check if partner is authenticated
    if (!sessionManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    fetchCollections();
  }, [router]);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/partner/collections');
      
      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const data = await response.json();
      setCollections(data.collections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = async (data: {
    name: string;
    description?: string;
    useRagByDefault: boolean;
  }) => {
    try {
      const response = await fetch('/api/partner/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create collection');
      }

      // Refresh collections list
      await fetchCollections();
      setIsCreateModalOpen(false);
    } catch (err) {
      throw err; // Let modal handle the error
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      const response = await fetch(`/api/partner/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete collection');
      }

      // Refresh collections list
      await fetchCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading collections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Collections</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + New Collection
        </button>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Collections Yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first collection to organize your documents
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            Create Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onDelete={handleDeleteCollection}
              onRefresh={fetchCollections}
            />
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCollection}
      />
    </div>
  );
}
