/**
 * Create Agent Page
 * 
 * This page provides the interface for creating new AI agents/projects.
 * It uses the existing AgentCreationForm component.
 * 
 * Route: /dashboard/projects/create
 * 
 * Mobile Optimized:
 * - Responsive padding and spacing
 * - Mobile-friendly text sizes
 * - Full-width layout on mobile
 * - Touch-friendly button sizes
 */

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { AgentCreationForm } from '@/components/agent/AgentCreationForm';
import { Button } from '@/components/ui/button';
import { useBreakpoint } from '@/hooks/useMediaQuery';

export default function CreateAgentPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  const handleAgentCreated = (agent: any) => {
    // Redirect to the projects page without ID parameter to avoid navigation issues
    // The projects page will automatically select the newly created agent
    router.push('/projects');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <PageLayout showMobileNavigation={isMobile}>
      <div className={`
        ${isMobile ? 'px-4 py-4' : 'max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'}
      `}>
        {/* Header */}
        <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className={`${isMobile ? 'mb-3 h-10 px-3' : 'mb-4'} touch-target`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className={isMobile ? 'text-sm' : ''}>Back</span>
          </Button>
          
          <h1 className={`
            font-bold text-gray-900 dark:text-gray-100
            ${isMobile ? 'text-xl' : 'text-3xl'}
          `}>
            Create New Agent
          </h1>
          <p className={`
            text-gray-600 dark:text-gray-400 mt-2
            ${isMobile ? 'text-sm' : 'text-base'}
          `}>
            Create a new AI agent by uploading files or providing a website URL
          </p>
        </div>

        {/* Agent Creation Form */}
        <AgentCreationForm
          onAgentCreated={handleAgentCreated}
          onCancel={handleCancel}
        />
      </div>
    </PageLayout>
  );
}