/**
 * Partner Switcher Component
 * 
 * Allows switching between mock partner accounts for testing.
 * Handles session cleanup and re-authentication.
 */

import React from 'react';
import { 
  Users,
  LogIn,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { sessionManager } from '@/lib/session/partner-session';
import { mockClient } from '@/lib/api/mock-client';
import { cn } from '@/lib/utils';

// Mock partner data
const MOCK_PARTNERS = [
  { id: 'partner_a', email: 'partner.a@example.com', name: 'Partner A' },
  { id: 'partner_b', email: 'partner.b@example.com', name: 'Partner B' },
  { id: 'partner_c', email: 'partner.c@example.com', name: 'Partner C' },
] as const;

interface PartnerSwitcherProps {
  onSwitch?: (partnerId: string) => void;
  className?: string;
}

export function PartnerSwitcher({
  onSwitch,
  className
}: PartnerSwitcherProps) {
  const { partnerId } = sessionManager.useSession();

  const handlePartnerSwitch = async (partner: typeof MOCK_PARTNERS[number]) => {
    try {
      // Clear current session
      sessionManager.clearSession();

      // Simulate loading
      toast.loading(`Switching to ${partner.name}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Login as new partner
      const response = await mockClient.mockLogin(partner.id, partner.email);
      
      if (!response.success || !response.data) {
        throw new Error('Login failed');
      }

      // Set new session
      sessionManager.setSession(response.data.token, response.data.partnerId);
      
      // Show success message
      toast.success(`Switched to ${partner.name}`);
      
      // Notify parent
      onSwitch?.(partner.id);

    } catch (error) {
      console.error('Failed to switch partner:', error);
      toast.error('Failed to switch partner');
      
      // Clear session on error
      sessionManager.clearSession();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2",
            className
          )}
        >
          <Users className="w-4 h-4" />
          <span>Switch Partner</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          TEST PARTNERS
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MOCK_PARTNERS.map(partner => (
          <DropdownMenuItem
            key={partner.id}
            onClick={() => handlePartnerSwitch(partner)}
            className="flex flex-col items-start py-2"
            disabled={partner.id === partnerId}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{partner.name}</span>
              {partner.id === partnerId && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {partner.email}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-2">
          <p className="text-xs text-muted-foreground">
            Switch between test partner accounts.
            All data is mocked for development.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
