/**
 * Create Agent Page
 * 
 * This page provides the interface for creating new AI agents/projects.
 * It uses the existing AgentCreationForm component.
 * 
 * Route: /dashboard/projects/create
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { AgentCreationForm } from '@/components/agent/AgentCreationForm';
import { Button } from '@/components/ui/button';

export default function CreateAgentPage() {
  const router = useRouter();

  const handleAgentCreated = (agent: any) => {
    // Redirect to the projects page without ID parameter to avoid navigation issues
    // The projects page will automatically select the newly created agent
    router.push('/projects');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Agent</h1>
          <p className="text-gray-600 mt-2">
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