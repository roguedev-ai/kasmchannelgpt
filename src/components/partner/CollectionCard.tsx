'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CollectionSettingsModal } from './CollectionSettingsModal';

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

interface CollectionCardProps {
  collection: Collection;
  onDelete: (collectionId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function CollectionCard({ collection, onDelete, onRefresh }: CollectionCardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(collection.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isDefaultCollection = collection.name.toLowerCase() === 'general';

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        {/* Collection Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">📁</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {collection.description}
                </p>
              )}
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-gray-400 hover:text-gray-600"
            title="Collection Settings"
          >
            ⚙️
          </button>
        </div>

        {/* Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Documents:</span>
            <span className="font-medium text-gray-900">
              {collection.documentsCount}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">RAG Enabled:</span>
            <span className={`font-medium ${collection.useRagByDefault ? 'text-green-600' : 'text-gray-400'}`}>
              {collection.useRagByDefault ? '✅ Yes' : '❌ No'}
            </span>
          </div>

          {isDefaultCollection && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Type:</span>
              <span className="text-blue-600 font-medium">
                Default
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200">
          <Link
            href={`/partner/collections/${collection.id}/documents`}
            className="block w-full text-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            View Documents
          </Link>
        </div>

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Created: {new Date(collection.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      <CollectionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        collection={collection}
        onUpdate={onRefresh}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Collection?
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Are you sure you want to delete <strong>{collection.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This will permanently delete all {collection.documentsCount} documents in this collection.
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
