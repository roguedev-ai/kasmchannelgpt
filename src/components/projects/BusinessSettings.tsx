import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Key } from "lucide-react";

interface BusinessSettingsProps {
  settings: {
    is_selling_enabled?: boolean;
    license_slug?: boolean;
    selling_url?: string;
  };
  onChange: (field: string, value: any) => void;
}

export function BusinessSettings({ settings, onChange }: BusinessSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commerce Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure selling and licensing options
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="is_selling_enabled" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Enable Selling
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow users to purchase products or services through the chatbot
              </p>
            </div>
            <Switch
              id="is_selling_enabled"
              checked={settings.is_selling_enabled || false}
              onCheckedChange={(checked) => onChange('is_selling_enabled', checked)}
            />
          </div>

          {settings.is_selling_enabled && (
            <div className="space-y-2 pl-6 border-l-2 border-muted">
              <Label htmlFor="selling_url">Selling URL</Label>
              <Input
                id="selling_url"
                value={settings.selling_url || ""}
                onChange={(e) => onChange('selling_url', e.target.value)}
                placeholder="https://your-store.com/products"
              />
              <p className="text-sm text-muted-foreground">
                URL where users will be redirected to complete purchases
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="license_slug" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Enable License Management
              </Label>
              <p className="text-sm text-muted-foreground">
                Manage licenses and access control for your chatbot
              </p>
            </div>
            <Switch
              id="license_slug"
              checked={settings.license_slug !== false}
              onCheckedChange={(checked) => onChange('license_slug', checked)}
            />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Business Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Commerce integration for product sales</li>
              <li>• License management for access control</li>
              <li>• Custom checkout flows</li>
              <li>• Analytics and reporting (coming soon)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}