'use client';

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Key, Loader2 } from 'lucide-react';
import { useAgentStore } from '@/store/agents';
import { toast } from 'react-hot-toast';

interface LicenseToggleProps {
  agentId: number;
  initialValue: boolean;
  onUpdate?: (newValue: boolean) => void;
}

export const LicenseToggle: React.FC<LicenseToggleProps> = ({
  agentId,
  initialValue,
  onUpdate
}) => {
  const { updateAgent } = useAgentStore();
  const [isEnabled, setIsEnabled] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await updateAgent(agentId, { are_licenses_allowed: checked });
      setIsEnabled(checked);
      toast.success(`Licenses ${checked ? 'enabled' : 'disabled'} successfully`);
      onUpdate?.(checked);
    } catch (error) {
      toast.error('Failed to update license settings');
      console.error('License toggle error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <Key className="h-5 w-5 text-gray-500" />
        <div>
          <Label htmlFor="license-toggle" className="text-base font-medium">
            Enable Licenses
          </Label>
          <p className="text-sm text-gray-500">
            Allow license-based access control for this agent
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
        <Switch
          id="license-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
        />
      </div>
    </div>
  );
};