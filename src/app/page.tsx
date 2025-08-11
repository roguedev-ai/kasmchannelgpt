/**
 * Home Page Component
 * 
 * This is the main entry point of the application.
 * It handles the initial setup flow and renders the chat interface.
 * 
 * Flow:
 * 1. Check if API key is configured
 * 2. If not, show API key setup screen
 * 3. Once configured, show the main chat interface
 * 
 * Key Features:
 * - Conditional rendering based on setup state
 * - Dynamic import of ChatLayout to avoid SSR issues
 * - Toast notifications for user feedback
 * - Responsive layout that fills the viewport
 * 
 * Customization:
 * - Modify ApiKeySetup for different authentication methods
 * - Change ChatLayout mode ('standalone', 'widget', 'floating')
 * - Adjust toast position and styling
 * - Add onboarding or tutorial overlays
 * 
 * Features:
 * - Secure API key management with persistent localStorage
 * - Optimized component loading with dynamic imports
 * - Consistent navigation structure with professional layout
 */

'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { useConfigStore } from '@/store';
import { ApiKeySetupModal } from '@/components/setup/ApiKeySetupModal';
import { PageLayout } from '@/components/layout/PageLayout';
import { DemoModeProvider } from '@/components/demo/DemoModeProvider';
import type { Agent } from '@/types';

/**
 * Dynamic Import of ChatLayout
 * 
 * ChatLayout contains browser-only code (localStorage, window objects)
 * so we disable SSR to prevent hydration mismatches.
 * 
 * This ensures:
 * - No server-side rendering errors
 * - Consistent client-side behavior
 * - Proper access to browser APIs
 * 
 * The loading state is handled by the component itself.
 */
const ChatLayout = dynamic(
  () => import('@/components/chat/ChatLayout').then(mod => ({ default: mod.ChatLayout })),
  { 
    ssr: false // Disable server-side rendering
  }
);

/**
 * Home Page Component
 * 
 * Manages the application's main flow:
 * - Setup flow for new users
 * - Chat interface for configured users
 * 
 * State Management:
 * - isSetupComplete: Tracks whether API key is configured
 * - apiKey: Retrieved from global config store
 * 
 * The component re-renders when apiKey changes,
 * automatically transitioning from setup to chat.
 */
export default function Home() {
  // Track setup completion state
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Next.js router for navigation
  const router = useRouter();
  
  // Check if demo mode is enabled
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    // In demo mode, skip API key validation
    if (isDemoMode) {
      setIsSetupComplete(true);
      setIsLoading(false);
    } else {
      // For non-demo mode, the ApiKeySetupModal will handle validation
      setIsLoading(false);
    }
  }, [isDemoMode]);

  // Handler for agent settings navigation
  const handleAgentSettings = (agent: Agent) => {
    // Navigate to projects page with the agent ID
    router.push(`/projects?id=${agent.id}`);
  };

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
  };

  // Don't render anything while checking initial state
  if (isLoading) {
    return null;
  }

  // Show main chat interface (wrapped in demo provider if needed)
  return (
    <DemoModeProvider>
      {/* API Key Setup Modal - only shown in non-demo mode when keys are missing */}
      {!isDemoMode && !isSetupComplete && (
        <ApiKeySetupModal 
          onComplete={handleSetupComplete}
          isDemoMode={isDemoMode}
        />
      )}
      
      <PageLayout showBackButton={false}>
        {/* Container with calculated height to account for navbar */}
        <div className="h-[calc(100vh-4rem)] bg-gray-50">
          {/* Main chat interface in standalone mode */}
          {isSetupComplete && (
            <ChatLayout 
              mode="standalone" 
              onAgentSettings={handleAgentSettings}
            />
          )}
        </div>
      </PageLayout>
    </DemoModeProvider>
  );
}
