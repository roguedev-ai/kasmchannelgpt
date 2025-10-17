import { useState } from 'react';
import { toast } from 'sonner';
import { generatePassword } from '@/lib/auth/password';

interface CreatePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PartnerRole = 'admin' | 'partner';

interface FormData {
  id: string;
  email: string;
  password: string;
  role: PartnerRole;
}

export function CreatePartnerModal({ isOpen, onClose, onSuccess }: CreatePartnerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    id: '',
    email: '',
    password: '',
    role: 'partner',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id) {
      newErrors.id = 'Partner ID is required';
    } else if (!/^[a-zA-Z0-9-_]+$/.test(formData.id)) {
      newErrors.id = 'Partner ID can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create partner');
      }

      toast.success('Partner created successfully');
      onSuccess();
      onClose();
      setFormData({
        id: '',
        email: '',
        password: '',
        role: 'partner',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create partner');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const password = generatePassword();
    setFormData(prev => ({ ...prev, password }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Partner</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Partner ID
              <input
                type="text"
                value={formData.id}
                onChange={e => setFormData(prev => ({ ...prev, id: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="partner-123"
              />
            </label>
            {errors.id && <p className="mt-1 text-sm text-red-600">{errors.id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="partner@example.com"
              />
            </label>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <div className="mt-1 flex space-x-2">
                <input
                  type="text"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Generate
                </button>
              </div>
            </label>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
              <select
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as PartnerRole }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="partner">Partner</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
