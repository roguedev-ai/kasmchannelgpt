'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    useRagByDefault: boolean;
  }) => Promise<void>;
}

export function CreateCollectionModal({ isOpen, onClose, onCreate }: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [useRagByDefault, setUseRagByDefault] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        useRagByDefault,
      });
      
      // Reset form
      setName('');
      setDescription('');
      setUseRagByDefault(true);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      setUseRagByDefault(true);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
            Create New Collection
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Collection Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Collection Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., RFP Templates, Product Docs"
                required
                maxLength={100}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                A descriptive name for your collection (1-100 characters)
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What kind of documents will this collection contain?"
                rows={3}
                maxLength={500}
                disabled={isSubmitting}
              />
            </div>

            {/* RAG Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useRagByDefault"
                checked={useRagByDefault}
                onChange={(e) => setUseRagByDefault(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="useRagByDefault" className="text-sm text-gray-700">
                Enable RAG (Retrieval Augmented Generation) by default
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              When enabled, documents in this collection will be used to enhance AI responses
            </p>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
