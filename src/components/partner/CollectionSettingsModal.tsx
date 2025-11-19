'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';

interface Collection {
  id: string;
  name: string;
  description?: string;
  useRagByDefault: boolean;
  settings?: {
    semanticThreshold: number;
    maxChunks: number;
    searchStrategy: string;
  };
}

interface CollectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  onUpdate: () => Promise<void>;
  onDelete: () => void;
}

export function CollectionSettingsModal({
  isOpen,
  onClose,
  collection,
  onUpdate,
  onDelete,
}: CollectionSettingsModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [useRagByDefault, setUseRagByDefault] = useState(true);
  const [semanticThreshold, setSemanticThreshold] = useState(0.7);
  const [maxChunks, setMaxChunks] = useState(5);
  const [searchStrategy, setSearchStrategy] = useState('semantic');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize form with collection data
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || '');
      setUseRagByDefault(collection.useRagByDefault);
      setSemanticThreshold(collection.settings?.semanticThreshold || 0.7);
      setMaxChunks(collection.settings?.maxChunks || 5);
      setSearchStrategy(collection.settings?.searchStrategy || 'semantic');
    }
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/partner/collections/${collection.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          useRagByDefault,
          settings: {
            semanticThreshold,
            maxChunks,
            searchStrategy,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update collection');
      }

      await onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDefaultCollection = collection.name.toLowerCase() === 'general';

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
            Collection Settings
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
              
              {/* Collection Name */}
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={100}
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={500}
                  disabled={isSubmitting}
                />
              </div>

              {/* RAG Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-useRagByDefault"
                  checked={useRagByDefault}
                  onChange={(e) => setUseRagByDefault(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isSubmitting}
                />
                <label htmlFor="edit-useRagByDefault" className="text-sm text-gray-700">
                  Enable RAG by default
                </label>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {showAdvanced ? '▼' : '▶'} Advanced RAG Settings
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  {/* Semantic Threshold */}
                  <div>
                    <label htmlFor="semanticThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                      Semantic Threshold: {semanticThreshold.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      id="semanticThreshold"
                      min="0"
                      max="1"
                      step="0.05"
                      value={semanticThreshold}
                      onChange={(e) => setSemanticThreshold(parseFloat(e.target.value))}
                      className="w-full"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher values require closer matches (0.0 - 1.0)
                    </p>
                  </div>

                  {/* Max Chunks */}
                  <div>
                    <label htmlFor="maxChunks" className="block text-sm font-medium text-gray-700 mb-1">
                      Max Chunks: {maxChunks}
                    </label>
                    <input
                      type="range"
                      id="maxChunks"
                      min="1"
                      max="10"
                      step="1"
                      value={maxChunks}
                      onChange={(e) => setMaxChunks(parseInt(e.target.value))}
                      className="w-full"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of document chunks to retrieve (1-10)
                    </p>
                  </div>

                  {/* Search Strategy */}
                  <div>
                    <label htmlFor="searchStrategy" className="block text-sm font-medium text-gray-700 mb-1">
                      Search Strategy
                    </label>
                    <select
                      id="searchStrategy"
                      value={searchStrategy}
                      onChange={(e) => setSearchStrategy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="semantic">Semantic (Meaning-based)</option>
                      <option value="hybrid">Hybrid (Semantic + Keyword)</option>
                      <option value="keyword">Keyword (Exact match)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
              {/* Delete Button (separate from save/cancel) */}
              <button
                type="button"
                onClick={onDelete}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isDefaultCollection
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                }`}
                disabled={isDefaultCollection || isSubmitting}
                title={isDefaultCollection ? 'Cannot delete default collection' : 'Delete collection'}
              >
                Delete Collection
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
