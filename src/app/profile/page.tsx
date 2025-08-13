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
 * - Image files only (JPG/PNG validated)
 * - 1MB max file size
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
  Users,
  Package,
  HardDrive,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { useProfileStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn, formatTimestamp } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { useDemoModeContext } from '@/contexts/DemoModeContext';
import { useLimits } from '@/hooks/useLimits';

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

  // Mobile responsiveness hook
  const { isMobile } = useBreakpoint();
  
  // Get free trial mode status
  const { isFreeTrialMode } = useDemoModeContext();
  
  // Get usage limits
  const { limits, isLoading: limitsLoading } = useLimits();

  /**
   * Load profile data on component mount
   * 
   * Fetches the current user's profile information from
   * the CustomGPT API when the page loads.
   */
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
    if (isFreeTrialMode) {
      toast.error('Profile editing is not available in free trial mode');
      return;
    }
    
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
      // Validate file type - must be JPG or PNG
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Allowed JPG or PNG. Max size of 1MB');
        return;
      }
      
      // Validate file size - max 1MB as per requirement
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Allowed JPG or PNG. Max size of 1MB');
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
   * Adds cache-busting parameter to ensure fresh images.
   * 
   * @returns Avatar URL or null
   */
  const getDisplayAvatar = () => {
    // Priority: preview > saved photo > default
    if (previewUrl) return previewUrl;
    if (profile?.profile_photo_url) {
      // Add cache-busting parameter to force reload after updates
      const url = new URL(profile.profile_photo_url);
      url.searchParams.set('t', Date.now().toString());
      return url.toString();
    }
    return null;
  };

  return (
    <PageLayout showMobileNavigation={isMobile}>
      <div className={cn(
        "max-w-4xl mx-auto min-h-screen",
        isMobile ? "p-3" : "px-4 sm:px-6 lg:px-8 py-8"
      )}>
        {/* Compact Mobile Header */}
        {isMobile ? (
          <div className="flex items-center justify-between py-3 mb-4">
            <h1 className="text-lg font-semibold text-foreground">Profile</h1>
            <Button
              variant="ghost"
              onClick={fetchProfile}
              disabled={loading}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          </div>
        ) : (
          // Desktop Header
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground mt-1">Manage your account information</p>
            </div>
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
        )}

        {/* Error State Display */}
        {error && (
          <div className={cn(
            "mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg",
            isMobile ? "text-sm" : ""
          )}>
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Error</span>
            </div>
            <p className="text-yellow-600 dark:text-yellow-400 mt-1 text-xs">{error}</p>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && !profile ? (
          <Card className="p-4">
            <div className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-20" />
                </div>
              </div>
            </div>
          </Card>
        ) : profile ? (
          <div className="space-y-4">
            {/* Instagram-style Profile Card */}
            <Card className="p-4">
              {!isMobile && (
                <div className="flex justify-end mb-4">
                  <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                    GET /user
                  </span>
                </div>
              )}
              
              {/* Profile Header - Instagram Style */}
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar Section */}
                <div className="relative">
                  <div className={cn(
                    "rounded-full overflow-hidden bg-muted",
                    isMobile ? "w-20 h-20" : "w-24 h-24"
                  )}>
                    {getDisplayAvatar() ? (
                      <img
                        src={getDisplayAvatar()!}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={cn(
                        "w-full h-full flex items-center justify-center bg-brand-100 text-brand-600 font-semibold",
                        isMobile ? "text-lg" : "text-xl"
                      )}>
                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <>
                      <button
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 transition-colors shadow-lg"
                        aria-label="Upload profile photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  {/* Name and Edit */}
                  <div className="flex items-center gap-3 mb-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1 text-lg font-semibold border border-border rounded focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <h2 className={cn(
                        "font-semibold text-foreground truncate",
                        isMobile ? "text-lg" : "text-xl"
                      )}>{profile.name}</h2>
                    )}
                  </div>

                  {/* Email */}
                  <p className={cn(
                    "text-muted-foreground mb-3",
                    isMobile ? "text-sm" : ""
                  )}>{profile.email}</p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          disabled={loading}
                          className="h-8 px-3 text-sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={loading || !editName.trim()}
                          className="h-8 px-3 text-sm"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        disabled={isFreeTrialMode}
                        className="h-8 px-3 text-sm"
                        title={isFreeTrialMode ? 'Profile editing is not available in free trial mode' : 'Edit your profile'}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Stats/Info - Instagram Style */}
              <div className="border-t pt-4">
                <div className={cn(
                  "grid gap-4",
                  isMobile ? "grid-cols-2" : "grid-cols-4"
                )}>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">User ID</div>
                    <div className="text-xs font-mono mt-1 truncate">{profile.id}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Team</div>
                    <div className="text-xs font-mono mt-1 truncate">{profile.current_team_id}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Member Since</div>
                    <div className="text-xs mt-1">{formatTimestamp(profile.created_at)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Updated</div>
                    <div className="text-xs mt-1">{formatTimestamp(profile.updated_at)}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Usage Limits Card */}
            <Card className="p-4">
              {!isMobile && (
                <div className="flex justify-end mb-4">
                  <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                    GET /limits/usage
                  </span>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    Usage Limits
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title="Usage limits info"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                {limits ? (
                  <div className="space-y-4">
                    {/* Projects/Agents Limit */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Projects</span>
                        </div>
                        <span className="text-sm font-mono">
                          {limits.current_projects_num} / {limits.max_projects_num}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 transition-all duration-300"
                          style={{ 
                            width: `${Math.min((limits.current_projects_num / limits.max_projects_num) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Storage Credits (Words) Limit */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Storage (Words)</span>
                        </div>
                        <span className="text-sm font-mono">
                          {limits.current_total_storage_credits.toLocaleString()} / {limits.max_total_storage_credits.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 transition-all duration-300"
                          style={{ 
                            width: `${Math.min((limits.current_total_storage_credits / limits.max_total_storage_credits) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Queries Limit */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Queries</span>
                        </div>
                        <span className="text-sm font-mono">
                          {limits.current_queries.toLocaleString()} / {limits.max_queries.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 transition-all duration-300"
                          style={{ 
                            width: `${Math.min((limits.current_queries / limits.max_queries) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : limitsLoading ? (
                  // Loading skeleton for limits
                  <div className="space-y-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-20"></div>
                      <div className="h-2 bg-muted rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-2 bg-muted rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-20"></div>
                      <div className="h-2 bg-muted rounded"></div>
                    </div>
                  </div>
                ) : (
                  // Error or no data state
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Unable to load usage limits
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* API Info - Compact Footer */}
            {!isMobile && (
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-4 text-xs text-muted-foreground">
                  <code className="bg-accent px-2 py-1 rounded">GET /user</code>
                  <code className="bg-accent px-2 py-1 rounded">POST /user</code>
                </div>
                <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
                  Profile features are limited to those supported by the CustomGPT API
                </p>
              </div>
            )}
          </div>
        ) : (
          // Empty state when no profile data is available
          <Card className="p-6 text-center">
            <User className={cn(
              "text-muted-foreground mx-auto mb-3",
              isMobile ? "w-8 h-8" : "w-10 h-10"
            )} />
            <h3 className={cn(
              "font-medium text-foreground mb-2",
              isMobile ? "text-base" : "text-lg"
            )}>
              No Profile Data
            </h3>
            <p className={cn(
              "text-muted-foreground mb-4",
              isMobile ? "text-sm" : ""
            )}>
              Unable to load profile information
            </p>
            <Button 
              onClick={fetchProfile} 
              disabled={loading}
              size="sm"
              className="h-8 px-3 text-sm"
            >
              <RefreshCw className={cn('w-3 h-3 mr-2', loading && 'animate-spin')} />
              Try Again
            </Button>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}