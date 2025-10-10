/**
 * Home Page Component
 * 
 * Main entry point with partner authentication flow:
 * 1. Partner authentication check
 * 2. If not authenticated → Show PartnerLogin
 * 3. If authenticated → Show chat interface with PartnerInfo
 */

'use client';

import React from 'react';
import { PartnerGuard } from '@/components/auth/PartnerGuard';
import { PartnerChatLayout } from '@/components/chat/PartnerChatLayout';
import { PageLayout } from '@/components/layout/PageLayout';
import { PartnerInfo } from '@/components/partner/PartnerInfo';
import { PartnerSwitcher } from '@/components/partner/PartnerSwitcher';
import { sessionManager } from '@/lib/session/partner-session';

export default function Home() {
  const handleLogout = () => {
    sessionManager.clearSession();
  };

  const handlePartnerSwitch = (newPartnerId: string) => {
    console.log('Switching to partner:', newPartnerId);
  };

  return (
    <PartnerGuard>
      {(isAuthenticated) => 
        isAuthenticated ? (
          <PageLayout showBackButton={false}>
            {/* Top Bar with Partner Controls */}
            <div className="h-16 border-b bg-background flex items-center justify-between px-4">
              <h1 className="text-lg font-semibold">Partner Chat</h1>
              <div className="flex items-center gap-4">
                <PartnerSwitcher onSwitch={handlePartnerSwitch} />
                <PartnerInfo onLogout={handleLogout} />
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="h-[calc(100vh-4rem)] bg-gray-50">
              <PartnerChatLayout onLogout={handleLogout} />
            </div>
          </PageLayout>
        ) : (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              {/* PartnerLogin is now rendered by PartnerGuard */}
            </div>
          </div>
        )
      }
    </PartnerGuard>
  );
}
