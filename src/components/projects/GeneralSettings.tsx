'use client';

import React, { useEffect, useState } from 'react';
import { Save, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { useProjectSettingsStore, useAgentStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

interface GeneralSettingsProps {
  project: Agent;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ project }) => {
  const { 
    settings, 
    settingsLoading, 
    settingsError, 
    fetchSettings, 
    updateSettings 
  } = useProjectSettingsStore();

  const { updateAgent, deleteAgent } = useAgentStore();

  const [formData, setFormData] = useState({
    project_name: '',
    default_prompt: '',
    example_questions: [''],
  });

  const [isModified, setIsModified] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Clear any previous errors when project changes
    useProjectSettingsStore.setState({ settingsError: null });
    fetchSettings(project.id);
    
    // Cleanup function to clear errors when component unmounts
    return () => {
      useProjectSettingsStore.setState({ settingsError: null });
    };
  }, [project.id, fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        project_name: project.project_name || '',
        default_prompt: settings.default_prompt || '',
        example_questions: settings.example_questions?.length ? settings.example_questions : [''],
      });
      setIsModified(false);
    }
  }, [settings, project.project_name]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Don't mark as modified for read-only fields
    if (field !== 'example_questions') {
      setIsModified(true);
    }
  };

  // Example questions are read-only - these handlers are no longer needed
  // but kept for potential future use if the API changes

  const handleSave = async () => {
    try {
      const { project_name, example_questions, ...settingsData } = formData;
      
      // Update project name if it changed
      if (project_name !== project.project_name) {
        await updateAgent(project.id, { project_name });
        toast.success('Project name updated successfully');
      }
      
      // Update settings (excluding read-only example_questions)
      if (Object.keys(settingsData).length > 0) {
        await updateSettings(project.id, settingsData);
        toast.success('Settings updated successfully');
      }
      
      setIsModified(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleRefresh = () => {
    // Clear error state before refreshing
    useProjectSettingsStore.setState({ settingsError: null });
    fetchSettings(project.id);
    setIsModified(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAgent(project.id);
      toast.success('Project deleted successfully');
      // Redirect to dashboard after successful deletion
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      toast.error(error.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">General Settings</h2>
          <p className="text-gray-600 mt-1">
            Configure basic project information and behavior
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={settingsLoading}
            size="sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', settingsLoading && 'animate-spin')} />
            Refresh
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!isModified || settingsLoading}
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {settingsLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {settingsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading settings</span>
          </div>
          <p className="text-red-700 mt-1 text-sm">{settingsError}</p>
        </div>
      )}

      {/* Loading State */}
      {settingsLoading && !settings ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-10 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Project Info */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Information</h3>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => handleInputChange('project_name', e.target.value)}
                  placeholder="Enter project name"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A descriptive name for your project ({formData.project_name.length}/100)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project ID
                </label>
                <input
                  type="text"
                  value={project.id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>
          </Card>

          {/* Default Prompt */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Default Prompt</h3>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}/settings
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Welcome Message
              </label>
              <textarea
                value={formData.default_prompt}
                onChange={(e) => handleInputChange('default_prompt', e.target.value)}
                placeholder="How can I help you?"
                rows={3}
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This message is shown to users when they start a conversation ({formData.default_prompt.length}/255)
              </p>
            </div>
          </Card>

          {/* Example Questions */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Example Questions</h3>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                GET /projects/{project.id}/settings
              </span>
            </div>
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Example questions are currently read-only and managed by CustomGPT. They cannot be edited through the API.
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              These questions help guide users on what they can ask your agent
            </p>
            
            <div className="space-y-3">
              {formData.example_questions.length === 0 || (formData.example_questions.length === 1 && !formData.example_questions[0]) ? (
                <p className="text-sm text-gray-500 italic">No example questions have been set by CustomGPT.</p>
              ) : (
                formData.example_questions.map((question, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={question}
                      readOnly
                      disabled
                      placeholder="No example question set"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-red-200 bg-red-50/50">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
              <span className="text-xs text-red-600 font-mono bg-red-100 px-2 py-1 rounded">
                DELETE /projects/{project.id}
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-2">Delete this project</h4>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete a project, there is no going back. This action will permanently delete the project, 
                  all its data sources, conversations, and settings.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </div>
            </div>
          </Card>

          {/* Save Button at Bottom */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={!isModified || settingsLoading}
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {settingsLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              <span className="font-semibold"> "{project.project_name}"</span> and remove all of its data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All data sources and uploaded files</li>
                <li>All conversations and messages</li>
                <li>All settings and configurations</li>
                <li>All analytics and usage data</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};