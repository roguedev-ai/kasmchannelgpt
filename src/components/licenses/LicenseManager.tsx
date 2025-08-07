'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Check,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  Calendar,
  Hash
} from 'lucide-react';
import { useLicenseStore } from '@/store/licenses';
import { useAgentStore } from '@/store';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface LicenseItemProps {
  license: any;
  onEdit: (license: any) => void;
  onDelete: (licenseKey: string) => void;
}

const LicenseItem: React.FC<LicenseItemProps> = ({ license, onEdit, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(license.key);
      setCopied(true);
      toast.success('License key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy license key');
    }
  };

  const handleDelete = () => {
    onDelete(license.key);
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-semibold text-gray-900">{license.name}</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Hash className="w-4 h-4" />
              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                {license.key}
              </code>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy license key"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Created {format(new Date(license.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onEdit(license)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit license"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete license"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <p className="text-sm text-gray-600 mb-3">
              Are you sure you want to delete this license? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface LicenseFormProps {
  license?: any;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

const LicenseForm: React.FC<LicenseFormProps> = ({ 
  license, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [name, setName] = useState(license?.name || '');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'License name is required';
    } else if (name.length < 3) {
      newErrors.name = 'License name must be at least 3 characters';
    } else if (name.length > 50) {
      newErrors.name = 'License name must be less than 50 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(name.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          License Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors({});
          }}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter license name"
          disabled={loading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {license ? 'Update' : 'Create'} License
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

interface LicenseManagerProps {
  embedded?: boolean;
}

export const LicenseManager: React.FC<LicenseManagerProps> = ({ embedded = false }) => {
  const { currentAgent } = useAgentStore();
  const { licenses, loading, error, fetchLicenses, createLicense, updateLicense, deleteLicense, clearError } = useLicenseStore();
  const [showForm, setShowForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (currentAgent?.id) {
      fetchLicenses(currentAgent.id);
    }
  }, [currentAgent?.id, fetchLicenses]);

  const handleCreateLicense = async (name: string) => {
    if (!currentAgent) return;
    
    setFormLoading(true);
    try {
      const newLicense = await createLicense(currentAgent.id, name);
      toast.success('License created successfully');
      setShowForm(false);
      
      // Show the license key in a special toast
      if (newLicense?.key) {
        toast((t) => (
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-brand-600" />
            <div className="flex-1">
              <p className="font-medium">New License Key</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 block">
                {newLicense.key}
              </code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newLicense.key);
                toast.dismiss(t.id);
                toast.success('License key copied!');
              }}
              className="px-3 py-1 bg-brand-600 text-white text-sm rounded hover:bg-brand-700"
            >
              Copy
            </button>
          </div>
        ), { duration: 10000 });
      }
    } catch (error) {
      // Error is already handled in the store
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateLicense = async (name: string) => {
    if (!currentAgent || !editingLicense) return;
    
    setFormLoading(true);
    try {
      await updateLicense(currentAgent.id, editingLicense.key, name);
      toast.success('License updated successfully');
      setEditingLicense(null);
    } catch (error) {
      // Error is already handled in the store
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLicense = async (licenseKey: string) => {
    if (!currentAgent) return;
    
    try {
      await deleteLicense(currentAgent.id, licenseKey);
      toast.success('License deleted successfully');
    } catch (error) {
      // Error is already handled in the store
    }
  };

  if (!currentAgent) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Select an agent to manage licenses</p>
      </div>
    );
  }

  // Check if licenses are allowed for this agent
  if (currentAgent.are_licenses_allowed === false) {
    return (
      <div className={embedded ? "" : "max-w-4xl mx-auto p-6"}>
        <div className="text-center py-12">
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-8 max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Licenses Not Available
            </h2>
            <p className="text-gray-600 mb-4">
              License management is not enabled for this agent.
            </p>
            <p className="text-sm text-gray-500">
              To enable licenses for this agent, please update the agent settings to allow licenses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "max-w-4xl mx-auto p-6"}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Key className="w-8 h-8 text-brand-600" />
            Agent Licenses
          </h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingLicense(null);
            }}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create License
          </button>
        </div>
        <p className="text-gray-600">
          Manage access licenses for {currentAgent.project_name}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showForm || editingLicense) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingLicense ? 'Edit License' : 'Create New License'}
            </h2>
            <LicenseForm
              license={editingLicense}
              onSubmit={editingLicense ? handleUpdateLicense : handleCreateLicense}
              onCancel={() => {
                setShowForm(false);
                setEditingLicense(null);
              }}
              loading={formLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Licenses List */}
      {loading && licenses.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading licenses...</p>
        </div>
      ) : licenses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No licenses found</p>
          <p className="text-gray-500 text-sm">Create your first license to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {licenses.map((license) => (
              <LicenseItem
                key={license.key}
                license={license}
                onEdit={setEditingLicense}
                onDelete={handleDeleteLicense}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Agent Licenses</p>
            <p>
              Licenses provide secure access to your agent. Each license has a unique key that can be used
              to authenticate API requests or grant access to specific users or applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};