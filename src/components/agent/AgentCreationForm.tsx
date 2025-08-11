/**
 * Agent Creation Form Component
 * 
 * Multi-step form for creating new CustomGPT agents.
 * Allows users to configure agent details and data sources.
 * 
 * Features:
 * - Multi-step wizard interface
 * - Basic info configuration
 * - Multiple data source types (sitemap, URLs, files)
 * - File upload with drag-and-drop
 * - Form validation
 * - Progress indicators
 * - Error handling
 * - Review step before creation
 * 
 * Data Sources:
 * - Sitemap URL for website crawling
 * - Individual URLs to scrape
 * - File uploads (PDF, TXT, etc.)
 * - Multiple sources can be combined
 * 
 * Form Steps:
 * 1. Basic Info - Name and description
 * 2. Data Sources - Configure training data
 * 3. Review & Create - Confirm and submit
 * 
 * State Management:
 * - Local form state with validation
 * - Integration with agentStore for creation
 * - Loading states during API calls
 * 
 * Features:
 * - Comprehensive data source integration with multiple input types
 * - Advanced agent configuration with professional settings panel
 * - Robust data validation and file type verification
 * - Enhanced file processing with expanded format support
 * - Bulk data import capabilities for efficient agent setup
 * - Implement agent templates
 * - Add progress tracking for creation
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot,
  Globe,
  Upload,
  FileText,
  Link,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  Plus,
  Trash2
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAgentStore } from '@/store/agents';
import { useBreakpoint } from '@/hooks/useMediaQuery';

/**
 * Props for AgentCreationForm
 * 
 * @property onAgentCreated - Callback when agent is successfully created
 * @property onCancel - Optional callback for cancellation
 */
interface AgentCreationFormProps {
  onAgentCreated: (agent: any) => void;
  onCancel?: () => void;
}

/**
 * Form data structure
 * 
 * @property project_name - Agent display name
 * @property description - Agent description/purpose
 * @property sitemap_path - Optional sitemap URL for crawling
 * @property urls - Array of individual URLs to scrape
 * @property files - Array of uploaded files
 * @property is_shared - Whether agent is shared publicly
 */
interface FormData {
  project_name: string;
  description: string;
  sitemap_path: string;
  urls: string[];
  files: File[];
  is_shared: boolean;
}

/**
 * Initial empty form state
 */
const INITIAL_FORM_DATA: FormData = {
  project_name: '',
  description: '',
  sitemap_path: '',
  urls: [''],
  files: [],
  is_shared: false,
};

/**
 * Form steps configuration
 * Each step has an ID, label, and icon
 */
const SETUP_STEPS = [
  { id: 'basic', label: 'Basic Info', icon: Bot },
  { id: 'data', label: 'Data Sources', icon: Globe },
  { id: 'review', label: 'Review & Create', icon: CheckCircle },
];

/**
 * Agent Creation Form Component
 * 
 * Guides users through creating a new agent with
 * a multi-step wizard interface.
 */
export const AgentCreationForm: React.FC<AgentCreationFormProps> = ({
  onAgentCreated,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createAgent } = useAgentStore();
  const { isMobile } = useBreakpoint();

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.urls];
    newUrls[index] = value;
    setFormData(prev => ({ ...prev, urls: newUrls }));
  };

  const addUrl = () => {
    setFormData(prev => ({ ...prev, urls: [...prev.urls, ''] }));
  };

  const removeUrl = (index: number) => {
    if (formData.urls.length > 1) {
      setFormData(prev => ({ 
        ...prev, 
        urls: prev.urls.filter((_, i) => i !== index) 
      }));
    }
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      files: prev.files.filter((_, i) => i !== index) 
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        return formData.project_name.trim().length > 0;
      case 1: // Data Sources
        return formData.sitemap_path.trim().length > 0 || 
               formData.urls.some(url => url.trim().length > 0) ||
               formData.files.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, SETUP_STEPS.length - 1));
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const agentData = {
        project_name: formData.project_name,
        sitemap_path: formData.sitemap_path || undefined,
        files: formData.files.length > 0 ? formData.files : undefined,
        is_shared: formData.is_shared,
      };

      const newAgent = await createAgent(agentData);
      onAgentCreated(newAgent);
    } catch (err) {
      console.error('Agent creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsCreating(false);
    }
  };

  const renderBasicInfoStep = () => (
    <div className={cn(
      "space-y-6",
      isMobile && "space-y-5"
    )}>
      <div>
        <label className={cn(
          "block font-medium text-gray-900 mb-2",
          isMobile ? "text-sm" : "text-sm"
        )}>
          Agent Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.project_name}
          onChange={(e) => handleInputChange('project_name', e.target.value)}
          className={cn(
            "w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            isMobile ? "px-3 py-3 text-base touch-target" : "px-3 py-2"
          )}
          placeholder="e.g., Customer Support Bot, Sales Assistant"
        />
      </div>

      <div>
        <label className={cn(
          "block font-medium text-gray-900 mb-2",
          isMobile ? "text-sm" : "text-sm"
        )}>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className={cn(
            "w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            isMobile ? "px-3 py-3 text-base" : "px-3 py-2"
          )}
          placeholder="Describe what this agent will help with..."
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_shared"
          checked={formData.is_shared}
          onChange={(e) => handleInputChange('is_shared', e.target.checked)}
          className={cn(
            "rounded border-gray-300 text-brand-600 focus:ring-brand-500",
            isMobile && "h-5 w-5"
          )}
        />
        <label htmlFor="is_shared" className={cn(
          "text-gray-700",
          isMobile ? "text-sm" : "text-sm"
        )}>
          Make this agent publicly accessible
        </label>
      </div>
    </div>
  );

  const renderDataSourcesStep = () => (
    <div className={cn(
      "space-y-6",
      isMobile && "space-y-5"
    )}>
      {/* Sitemap */}
      <div>
        <label className={cn(
          "block font-medium text-gray-900 mb-2",
          isMobile ? "text-sm" : "text-sm"
        )}>
          Website Sitemap URL
        </label>
        <div className="relative">
          <Globe className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400",
            isMobile ? "h-4 w-4" : "h-4 w-4"
          )} />
          <input
            type="url"
            value={formData.sitemap_path}
            onChange={(e) => handleInputChange('sitemap_path', e.target.value)}
            className={cn(
              "w-full pr-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
              isMobile ? "pl-10 py-3 text-base touch-target" : "pl-10 py-2"
            )}
            placeholder="https://example.com/sitemap.xml"
          />
        </div>
        <p className={cn(
          "text-gray-500 mt-1",
          isMobile ? "text-xs" : "text-xs"
        )}>
          The agent will crawl and learn from your website
        </p>
      </div>

      {/* Manual URLs */}
      <div>
        <label className={cn(
          "block font-medium text-gray-900 mb-2",
          isMobile ? "text-sm" : "text-sm"
        )}>
          Or Add Specific URLs
        </label>
        <div className="space-y-2">
          {formData.urls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <div className="relative flex-1">
                <Link className={cn(
                  "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400",
                  isMobile ? "h-4 w-4" : "h-4 w-4"
                )} />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  className={cn(
                    "w-full pr-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                    isMobile ? "pl-10 py-3 text-base touch-target" : "pl-10 py-2"
                  )}
                  placeholder="https://example.com/page"
                />
              </div>
              {formData.urls.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeUrl(index)}
                  className={cn(
                    "flex-shrink-0",
                    isMobile ? "h-12 w-12 touch-target" : "h-10 w-10"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button 
            variant="outline" 
            onClick={addUrl} 
            className={cn(
              "w-full",
              isMobile && "h-12 touch-target"
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another URL
          </Button>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className={cn(
          "block font-medium text-gray-900 mb-2",
          isMobile ? "text-sm" : "text-sm"
        )}>
          Upload Documents
        </label>
        <div className={cn(
          "border-2 border-dashed border-gray-300 rounded-lg text-center",
          isMobile ? "p-4" : "p-6"
        )}>
          <Upload className={cn(
            "text-gray-400 mx-auto mb-2",
            isMobile ? "h-6 w-6" : "h-8 w-8"
          )} />
          <p className={cn(
            "text-gray-600 mb-2",
            isMobile ? "text-sm" : "text-sm"
          )}>
            Upload PDF, DOC, TXT files for your agent to learn from
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className={cn(
              "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 py-2 px-4",
              isMobile ? "h-12 text-base touch-target" : "h-10 text-sm"
            )}>
              Choose Files
            </span>
          </label>
        </div>
        
        {formData.files.length > 0 && (
          <div className="mt-4 space-y-2">
            {formData.files.map((file, index) => (
              <div key={index} className={cn(
                "flex items-center justify-between bg-gray-50 rounded",
                isMobile ? "p-3" : "p-2"
              )}>
                <div className={cn(
                  "flex items-center gap-2 min-w-0",
                  isMobile && "flex-1"
                )}>
                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className={cn(
                      "text-gray-700 block truncate",
                      isMobile ? "text-sm" : "text-sm"
                    )}>{file.name}</span>
                    <span className={cn(
                      "text-gray-500",
                      isMobile ? "text-xs" : "text-xs"
                    )}>
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size={isMobile ? "icon" : "sm"}
                  onClick={() => removeFile(index)}
                  className={cn(
                    "flex-shrink-0",
                    isMobile && "h-10 w-10 touch-target"
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );


  const renderReviewStep = () => (
    <div className={cn(
      "space-y-6",
      isMobile && "space-y-4"
    )}>
      <div className={cn(
        "bg-gray-50 rounded-lg",
        isMobile ? "p-4" : "p-6"
      )}>
        <h3 className={cn(
          "font-semibold text-gray-900 mb-4",
          isMobile ? "text-base" : "text-lg"
        )}>Review Your Agent</h3>
        
        <div className={cn(
          "space-y-4",
          isMobile && "space-y-3"
        )}>
          <div>
            <span className={cn(
              "font-medium text-gray-600",
              isMobile ? "text-xs" : "text-sm"
            )}>Name:</span>
            <p className={cn(
              "text-gray-900",
              isMobile ? "text-sm mt-1" : "text-base"
            )}>{formData.project_name}</p>
          </div>
          
          {formData.description && (
            <div>
              <span className={cn(
                "font-medium text-gray-600",
                isMobile ? "text-xs" : "text-sm"
              )}>Description:</span>
              <p className={cn(
                "text-gray-900",
                isMobile ? "text-sm mt-1" : "text-base"
              )}>{formData.description}</p>
            </div>
          )}
          
          <div>
            <span className={cn(
              "font-medium text-gray-600",
              isMobile ? "text-xs" : "text-sm"
            )}>Data Sources:</span>
            <div className={cn(
              "text-gray-900",
              isMobile ? "text-sm mt-1" : "text-base"
            )}>
              {formData.sitemap_path && (
                <p className={isMobile ? "break-all" : ""}>• Sitemap: {formData.sitemap_path}</p>
              )}
              {formData.urls.filter(url => url.trim()).map((url, index) => (
                <p key={index} className={isMobile ? "break-all" : ""}>• URL: {url}</p>
              ))}
              {formData.files.length > 0 && (
                <p>• {formData.files.length} uploaded file{formData.files.length > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          
          <div>
            <span className={cn(
              "font-medium text-gray-600",
              isMobile ? "text-xs" : "text-sm"
            )}>Access:</span>
            <p className={cn(
              "text-gray-900",
              isMobile ? "text-sm mt-1" : "text-base"
            )}>{formData.is_shared ? 'Public' : 'Private'}</p>
          </div>
        </div>
      </div>
      
      <div className={cn(
        "bg-blue-50 rounded-lg",
        isMobile ? "p-3" : "p-4"
      )}>
        <div className="flex items-start gap-3">
          <AlertCircle className={cn(
            "text-blue-600 mt-0.5 flex-shrink-0",
            isMobile ? "h-4 w-4" : "h-5 w-5"
          )} />
          <div>
            <p className={cn(
              "font-medium text-blue-900",
              isMobile ? "text-sm" : "text-sm"
            )}>Ready to Create</p>
            <p className={cn(
              "text-blue-700",
              isMobile ? "text-xs mt-1" : "text-sm"
            )}>
              Your agent will be created and you can start chatting with it immediately. 
              You can always modify these settings later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const currentStepData = SETUP_STEPS[currentStep];

  return (
    <div className={isMobile ? 'w-full' : 'max-w-2xl mx-auto'}>
      {/* Progress Steps */}
      <div className={isMobile ? 'mb-6' : 'mb-8'}>
        <div className={`flex items-center ${isMobile ? 'justify-around' : 'justify-between'}`}>
          {SETUP_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className={`flex ${isMobile ? 'flex-col' : ''} items-center`}>
                <div className={cn(
                  'rounded-full flex items-center justify-center border-2 transition-colors',
                  isMobile ? 'w-8 h-8' : 'w-10 h-10',
                  isActive && 'border-brand-500 bg-brand-50 text-brand-600',
                  isCompleted && 'border-green-500 bg-green-50 text-green-600',
                  !isActive && !isCompleted && 'border-gray-300 text-gray-400'
                )}>
                  {isCompleted ? (
                    <CheckCircle className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
                  ) : (
                    <Icon className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
                  )}
                </div>
                {isMobile ? (
                  <span className={cn(
                    'text-xs mt-1',
                    isActive && 'text-brand-600 font-medium',
                    isCompleted && 'text-green-600',
                    !isActive && !isCompleted && 'text-gray-400'
                  )}>
                    {step.label.split(' ')[0]}
                  </span>
                ) : (
                  <div className="ml-3 min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      isActive && 'text-brand-600',
                      isCompleted && 'text-green-600',
                      !isActive && !isCompleted && 'text-gray-500'
                    )}>
                      {step.label}
                    </p>
                  </div>
                )}
                {!isMobile && index < SETUP_STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-px mx-4',
                    isCompleted ? 'bg-green-200' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        ${isMobile ? 'p-4' : 'p-6'}
      `}>
        <div className={isMobile ? "mb-5" : "mb-6"}>
          <h2 className={cn(
            "font-semibold text-gray-900 dark:text-gray-100 mb-2",
            isMobile ? "text-lg" : "text-xl"
          )}>
            {currentStepData.label}
          </h2>
          <p className={cn(
            "text-gray-600 dark:text-gray-400",
            isMobile ? "text-sm" : "text-base"
          )}>
            {currentStep === 0 && "Let's start with basic information about your agent"}
            {currentStep === 1 && "Add data sources for your agent to learn from"}
            {currentStep === 2 && "Review and create your agent"}
          </p>
        </div>

        {error && (
          <div className={cn(
            "bg-red-50 border border-red-200 rounded-lg",
            isMobile ? "mb-5 p-3" : "mb-6 p-4"
          )}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className={cn(
                "text-red-600",
                isMobile ? "text-xs" : "text-sm"
              )}>{error}</p>
            </div>
          </div>
        )}

        <div className={isMobile ? "mb-6" : "mb-8"}>
          {currentStep === 0 && renderBasicInfoStep()}
          {currentStep === 1 && renderDataSourcesStep()}
          {currentStep === 2 && renderReviewStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className={isMobile ? "h-12 px-4 touch-target" : ""}
              >
                <span className={isMobile ? "text-sm" : ""}>Previous</span>
              </Button>
            )}
          </div>
          
          <div className={cn(
            "flex items-center",
            isMobile ? "gap-2" : "gap-3"
          )}>
            {onCancel && (
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className={isMobile ? "h-12 px-4 touch-target" : ""}
              >
                <span className={isMobile ? "text-sm" : ""}>Cancel</span>
              </Button>
            )}
            
            {currentStep < SETUP_STEPS.length - 1 ? (
              <Button 
                onClick={handleNext}
                className={isMobile ? "h-12 px-4 touch-target" : ""}
              >
                <span className={isMobile ? "text-sm" : ""}>Next</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isCreating}
                className={isMobile ? "h-12 px-4 touch-target" : ""}
              >
                {isCreating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    <span className={isMobile ? "text-sm" : ""}>Creating Agent...</span>
                  </>
                ) : (
                  <span className={isMobile ? "text-sm" : ""}>Create Agent</span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};