import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PartnerWithStats } from '@/lib/database';

interface PartnerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
}

export function PartnerDetailsModal({ isOpen, onClose, partnerId }: PartnerDetailsModalProps) {
  const { data: partner, isLoading, error } = useQuery<PartnerWithStats>({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/partners/${partnerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch partner details');
      }
      return response.json();
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load partner details');
    return null;
  }

  if (!partner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold">Partner Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Partner ID</h3>
            <p className="mt-1 text-sm text-gray-900">{partner.id}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1 text-sm text-gray-900">{partner.email}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Role</h3>
            <p className="mt-1 text-sm text-gray-900 capitalize">{partner.role}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className={`mt-1 text-sm capitalize ${
              partner.status === 'active' ? 'text-green-600' : 'text-red-600'
            }`}>
              {partner.status}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Statistics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{partner.collectionsCount}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Documents</p>
                <p className="text-2xl font-semibold text-gray-900">{partner.documentsCount}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Dates</h3>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm text-gray-900">
                  {new Date(partner.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900">
                  {new Date(partner.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
