/**
 * Partner Guard Component
 * 
 * Handles partner authentication state and renders appropriate content.
 * Uses React state to track authentication changes.
 */

import React, { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/session/partner-session';
import { PartnerLogin } from './PartnerLogin';

interface PartnerGuardProps {
  children: (isAuthenticated: boolean) => React.ReactNode;
}

export function PartnerGuard({ children }: PartnerGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionManager.isAuthenticated());

  useEffect(() => {
    // Subscribe to session changes
    const cleanup = sessionManager.onSessionChange(() => {
      setIsAuthenticated(sessionManager.isAuthenticated());
    });

    return cleanup;
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
        <div className="w-full max-w-md">
          <PartnerLogin onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  return <>{children(isAuthenticated)}</>;
}
