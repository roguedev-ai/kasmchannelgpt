'use client';

import React, { useEffect, useState } from 'react';
import { Save, Upload, Image, Palette, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { useProjectSettingsStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

interface AppearanceSettingsProps {
  project: Agent;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ project }) => {
  const { 
    settings, 
    settingsLoading, 
    settingsError, 
    fetchSettings, 
    updateSettings 
  } = useProjectSettingsStore();

  const [formData, setFormData] = useState({
    chatbot_avatar: '',
    chatbot_background_type: 'image' as 'image' | 'color',
    chatbot_background: '',
    chatbot_background_color: '#F5F5F5',
    chatbot_color: '#000000',
    chatbot_toolbar_color: '#000000',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    fetchSettings(project.id);
  }, [project.id]);

  useEffect(() => {
    if (settings) {
      setFormData({
        chatbot_avatar: settings.chatbot_avatar || '',
        chatbot_background_type: settings.chatbot_background_type || 'image',
        chatbot_background: settings.chatbot_background || '',
        chatbot_background_color: settings.chatbot_background_color || '#F5F5F5',
        chatbot_color: settings.chatbot_color || '#000000',
        chatbot_toolbar_color: settings.chatbot_toolbar_color || '#000000',
      });
      setIsModified(false);
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      
      setAvatarFile(file);
      setIsModified(true);
    }
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      
      setBackgroundFile(file);
      setIsModified(true);
    }
  };

  const handleSave = async () => {
    try {
      const updateData: any = { ...formData };
      
      if (avatarFile) {
        updateData.chat_bot_avatar = avatarFile;
      }
      
      if (backgroundFile) {
        updateData.chat_bot_bg = backgroundFile;
      }
      
      await updateSettings(project.id, updateData);
      
      setIsModified(false);
      setAvatarFile(null);
      setBackgroundFile(null);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleRefresh = () => {
    fetchSettings(project.id);
    setIsModified(false);
    setAvatarFile(null);
    setBackgroundFile(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Appearance Settings</h2>
          <p className="text-muted-foreground mt-1">
            Customize the visual appearance of your chatbot
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
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading settings</span>
          </div>
          <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{settingsError}</p>
        </div>
      )}

      {/* Loading State */}
      {settingsLoading && !settings ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-4" />
              <div className="h-24 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Avatar Settings */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Chatbot Avatar</h3>
              <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                POST /projects/{project.id}/settings
              </span>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Current Avatar
                </label>
                
                <div className="w-20 h-20 rounded-full overflow-hidden bg-accent border-2 border-border mb-4">
                  {formData.chatbot_avatar ? (
                    <img
                      src={formData.chatbot_avatar}
                      alt="Chatbot Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Avatar
                    </div>
                  </label>
                  {avatarFile && (
                    <p className="text-sm text-green-600 mt-2">
                      New avatar selected: {avatarFile.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Upload a profile picture or company logo to represent your chatbot. 
                  This image will appear in chat conversations next to AI responses.
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• Recommended size: 200x200 pixels</li>
                  <li>• Supported formats: JPG, PNG, GIF</li>
                  <li>• Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Background Settings */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Chat Background</h3>
              <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                POST /projects/{project.id}/settings
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Background Type */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Background Type
                </label>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="background_type"
                      value="image"
                      checked={formData.chatbot_background_type === 'image'}
                      onChange={(e) => handleInputChange('chatbot_background_type', e.target.value)}
                    />
                    <span className="text-sm">Background Image</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="background_type"
                      value="color"
                      checked={formData.chatbot_background_type === 'color'}
                      onChange={(e) => handleInputChange('chatbot_background_type', e.target.value)}
                    />
                    <span className="text-sm">Background Color</span>
                  </label>
                </div>
              </div>

              {/* Background Image */}
              {formData.chatbot_background_type === 'image' && (
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Background Image
                    </label>
                    
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-accent border-2 border-border mb-4">
                      {formData.chatbot_background ? (
                        <img
                          src={formData.chatbot_background}
                          alt="Chat Background"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundUpload}
                        className="hidden"
                        id="background-upload"
                      />
                      <label htmlFor="background-upload" className="cursor-pointer">
                        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Background
                        </div>
                      </label>
                      {backgroundFile && (
                        <p className="text-sm text-green-600 mt-2">
                          New background selected: {backgroundFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Upload a background image for the chat widget. This will be displayed behind the conversation.
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      <li>• Recommended size: 1200x800 pixels</li>
                      <li>• Supported formats: JPG, PNG</li>
                      <li>• Maximum file size: 5MB</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Background Color */}
              {formData.chatbot_background_type === 'color' && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Background Color
                  </label>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.chatbot_background_color}
                      onChange={(e) => handleInputChange('chatbot_background_color', e.target.value)}
                      className="w-12 h-10 border border-border rounded cursor-pointer bg-background"
                    />
                    
                    <input
                      type="text"
                      value={formData.chatbot_background_color}
                      onChange={(e) => handleInputChange('chatbot_background_color', e.target.value)}
                      placeholder="#F5F5F5"
                      className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-background text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Color Settings */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Color Theme</h3>
              <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                POST /projects/{project.id}/settings
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Primary Color
                </label>
                
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.chatbot_color}
                    onChange={(e) => handleInputChange('chatbot_color', e.target.value)}
                    className="w-12 h-10 border border-border rounded cursor-pointer"
                  />
                  
                  <input
                    type="text"
                    value={formData.chatbot_color}
                    onChange={(e) => handleInputChange('chatbot_color', e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-background text-foreground"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  Main accent color for buttons and highlights
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Toolbar Color
                </label>
                
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.chatbot_toolbar_color}
                    onChange={(e) => handleInputChange('chatbot_toolbar_color', e.target.value)}
                    className="w-12 h-10 border border-border rounded cursor-pointer"
                  />
                  
                  <input
                    type="text"
                    value={formData.chatbot_toolbar_color}
                    onChange={(e) => handleInputChange('chatbot_toolbar_color', e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-background text-foreground"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  Color for the chat widget toolbar and header
                </p>
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>
            
            <div className="border border-border rounded-lg p-4 bg-accent">
              <div 
                className="w-full h-32 rounded-lg flex items-center justify-center relative"
                style={{
                  backgroundColor: formData.chatbot_background_type === 'color' 
                    ? formData.chatbot_background_color 
                    : '#F5F5F5',
                  backgroundImage: formData.chatbot_background_type === 'image' && formData.chatbot_background
                    ? `url(${formData.chatbot_background})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-white bg-opacity-80 rounded-lg" />
                
                <div className="relative flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-accent">
                    {formData.chatbot_avatar ? (
                      <img
                        src={formData.chatbot_avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className="px-3 py-2 rounded-lg text-white text-sm"
                    style={{ backgroundColor: formData.chatbot_color }}
                  >
                    Hello! How can I help you today?
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2 text-center">
                This is how your chatbot will appear to users
              </p>
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
    </div>
  );
};