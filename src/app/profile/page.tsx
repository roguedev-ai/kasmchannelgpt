/**
 * Profile Management Page
 * 
 * User profile viewing and editing interface for CustomGPT platform.
 * Allows users to update their display name and profile photo.
 * 
 * Features:
 * - Profile photo upload with preview
 * - Name editing with validation
 * - File type and size validation
 * - Optimistic UI updates
 * - Error handling and recovery
 * - Loading states
 * - Refresh functionality
 * - Account information display
 * - API endpoint documentation
 * 
 * Profile Information:
 * - Display name (editable)
 * - Profile photo (editable)
 * - Email address (read-only)
 * - User ID (read-only)
 * - Team ID (read-only)
 * - Account creation date
 * - Last update timestamp
 * 
 * File Upload:
 * - Image files only (validated)
 * - 5MB max file size
 * - Preview before save
 * - Object URL cleanup
 * 
 * State Management:
 * - Uses profileStore for data
 * - Local state for edit mode
 * - File and preview management
 * 
 * API Integration:
 * - GET /user - Fetch profile
 * - POST /user - Update profile
 * - Multipart form data for photos
 * 
 * Error States:
 * - Network errors
 * - Validation errors
 * - Empty profile data
 * - File upload errors
 * 
 * Features:
 * - Comprehensive profile management with photo upload
 * - Real-time validation and error handling
 * - Secure file upload with size and type restrictions
 * - Professional interface with loading states and feedback
 * - Account information display with read-only system data
 */

'use client';

import React, { useEffect, useState } from 'react';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Camera, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  Mail,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

import { useProfileStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn, formatTimestamp } from '@/lib/utils';

/**
 * Profile Page Component
 * 
 * Main profile management interface allowing users to view and
 * edit their account information within CustomGPT platform limits.
 */
export default function ProfilePage() {
  // Local state for edit mode and form data
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Profile store hooks
  const { 
    profile, 
    loading, 
    error,
    fetchProfile,
    updateProfile
  } = useProfileStore();

  /**
   * Load profile data on component mount
   * 
   * Fetches the current user's profile information from
   * the CustomGPT API when the page loads.
   */
  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * Sync profile name with local edit state
   * 
   * Updates the edit form with the current profile name
   * whenever the profile data changes or edit mode is exited.
   */
  useEffect(() => {
    if (profile && !isEditing) {
      setEditName(profile.name);
    }
  }, [profile, isEditing]);

  /**
   * Enter edit mode
   * 
   * Switches to edit mode and populates the form with
   * current profile data for modification.
   */
  const handleEdit = () => {
    if (profile) {
      setEditName(profile.name);
      setIsEditing(true);
    }
  };

  /**
   * Cancel edit mode
   * 
   * Exits edit mode without saving changes and resets
   * all form state including file selections and previews.
   */
  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    // Clean up preview URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (profile) {
      setEditName(profile.name);
    }
  };

  /**
   * Save profile changes
   * 
   * Validates and submits profile updates to the API.
   * Handles both name changes and photo uploads.
   */
  const handleSave = async () => {
    // Validate name is not empty
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      // Update profile with new name and optional photo
      await updateProfile(editName.trim(), selectedFile || undefined);
      setIsEditing(false);
      setSelectedFile(null);
      // Clean up preview URL after successful save
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Error toast is handled by the store
    }
  };

  /**
   * Handle file selection for profile photo
   * 
   * Validates selected image files and creates preview.
   * Enforces file type and size restrictions.
   * 
   * @param event - File input change event
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - must be an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size - max 5MB for performance
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Clean up previous preview URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // Create new preview URL for immediate feedback
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  /**
   * Get current display avatar URL
   * 
   * Returns the appropriate avatar image URL based on
   * current state (preview, saved photo, or null).
   * 
   * @returns Avatar URL or null
   */
  const getDisplayAvatar = () => {
    // Priority: preview > saved photo > default
    if (previewUrl) return previewUrl;
    if (profile?.profile_photo_url) return profile.profile_photo_url;
    return null;
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>
          
          {/* Refresh button for manual data reload */}
          <Button
            variant="outline"
            onClick={fetchProfile}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Error State Display */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-yellow-700 mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && !profile ? (
          <Card className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-40" />
                </div>
              </div>
            </div>
          </Card>
        ) : profile ? (
          <div className="space-y-6">
            {/* Main Profile Card */}
            <Card className="p-8">
              {/* API Endpoint Indicator */}
              <div className="flex justify-end mb-4">
                <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                  GET /user
                </span>
              </div>
              <div className="flex items-start gap-8">
                {/* Avatar Section with Upload */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                    {getDisplayAvatar() ? (
                      <img
                        src={getDisplayAvatar()!}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // Default avatar with initials
                      <div className="w-full h-full flex items-center justify-center bg-brand-100 text-brand-600 text-3xl font-semibold">
                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Photo upload button - only shown in edit mode */}
                  {isEditing && (
                    <>
                      <button
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 transition-colors shadow-lg"
                        aria-label="Upload profile photo"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      
                      {/* Hidden file input for photo upload */}
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        aria-label="Profile photo file input"
                      />
                    </>
                  )}
                </div>

                {/* Profile Information Section */}
                <div className="flex-1">
                  <div className="space-y-6">
                    {/* Name Field - Editable */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-lg"
                          placeholder="Enter your name"
                          aria-label="Edit full name"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{profile.name}</p>
                      )}
                    </div>

                    {/* Profile Details Grid - Read-only fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        {/* Email - Read-only from CustomGPT */}
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{profile.email}</p>
                          </div>
                        </div>
                        
                        {/* User ID - Unique identifier */}
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">User ID</p>
                            <p className="font-medium text-gray-900 font-mono">{profile.id}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Column */}
                      <div className="space-y-4">
                        {/* Team ID - Current team context */}
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Team ID</p>
                            <p className="font-medium text-gray-900 font-mono">{profile.current_team_id}</p>
                          </div>
                        </div>
                        
                        {/* Member Since - Account age */}
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Member Since</p>
                            <p className="font-medium text-gray-900">{formatTimestamp(profile.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Section */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                      {isEditing ? (
                        <>
                          {/* Cancel edit button */}
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loading}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          
                          {/* Save changes button */}
                          <Button
                            onClick={handleSave}
                            disabled={loading || !editName.trim()}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          
                          {/* API endpoint indicator for update */}
                          <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded ml-2">
                            POST /user
                          </span>
                        </>
                      ) : (
                        // Edit profile button
                        <Button
                          variant="outline"
                          onClick={handleEdit}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Account Details Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
                <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                  GET /user
                </span>
              </div>
              
              {/* Timestamp information grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Created
                  </label>
                  <p className="text-gray-900">{formatTimestamp(profile.created_at)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Updated
                  </label>
                  <p className="text-gray-900">{formatTimestamp(profile.updated_at)}</p>
                </div>
              </div>
            </Card>

            {/* API Information Card */}
            <Card className="p-6 bg-gray-50 border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Available Profile Operations
              </h4>
              
              {/* API endpoint documentation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fetch profile data:</span>
                  <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-700">GET /user</code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Update profile (name & photo):</span>
                  <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-700">POST /user</code>
                </div>
              </div>
              
              {/* Platform limitations notice */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="text-blue-800">
                  <strong>Note:</strong> This profile section only includes features supported by the CustomGPT API. 
                  You can update your name and profile photo. Email and other account settings are managed through the CustomGPT platform.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          // Empty state when no profile data is available
          <Card className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Profile Data
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to load profile information from the CustomGPT API
            </p>
            <Button onClick={fetchProfile} disabled={loading}>
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Try Again
            </Button>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}