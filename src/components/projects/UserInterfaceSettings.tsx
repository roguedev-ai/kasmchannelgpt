import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserInterfaceSettingsProps {
  settings: {
    chatbot_title?: string;
    chatbot_title_color?: string;
    user_avatar?: string;
    spotlight_avatar_enabled?: boolean;
    spotlight_avatar?: string;
    spotlight_avatar_shape?: string;
    spotlight_avatar_type?: string;
    user_avatar_orientation?: string;
    input_field_addendum?: string;
  };
  onChange: (field: string, value: any) => void;
}

export function UserInterfaceSettings({ settings, onChange }: UserInterfaceSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat Interface</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize the chat interface appearance
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chatbot_title">Chatbot Title</Label>
            <Input
              id="chatbot_title"
              value={settings.chatbot_title || ""}
              onChange={(e) => onChange('chatbot_title', e.target.value)}
              placeholder="My Custom Agent"
            />
            <p className="text-sm text-muted-foreground">
              Title displayed at the top of the chat interface
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chatbot_title_color">Title Color</Label>
            <div className="flex gap-2">
              <Input
                id="chatbot_title_color"
                type="color"
                value={settings.chatbot_title_color || "#000000"}
                onChange={(e) => onChange('chatbot_title_color', e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={settings.chatbot_title_color || "#000000"}
                onChange={(e) => onChange('chatbot_title_color', e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="input_field_addendum">Input Field Helper Text</Label>
            <textarea
              id="input_field_addendum"
              value={settings.input_field_addendum || ""}
              onChange={(e) => onChange('input_field_addendum', e.target.value)}
              placeholder="Type your question here..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Additional text shown in or near the input field
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avatar Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure user and agent avatar settings
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_avatar">User Avatar URL</Label>
            <Input
              id="user_avatar"
              value={settings.user_avatar || ""}
              onChange={(e) => onChange('user_avatar', e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
            <p className="text-sm text-muted-foreground">
              Default avatar for users in conversations
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_avatar_orientation">Avatar Orientation</Label>
            <Select
              value={settings.user_avatar_orientation || "agent-left-user-right"}
              onValueChange={(value) => onChange('user_avatar_orientation', value)}
            >
              <SelectTrigger id="user_avatar_orientation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent-left-user-right">Agent Left, User Right</SelectItem>
                <SelectItem value="agent-right-user-left">Agent Right, User Left</SelectItem>
                <SelectItem value="both-left">Both Left</SelectItem>
                <SelectItem value="both-right">Both Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="spotlight_avatar_enabled">Enable Spotlight Avatar</Label>
              <p className="text-sm text-muted-foreground">
                Show a special avatar in spotlight mode
              </p>
            </div>
            <Switch
              id="spotlight_avatar_enabled"
              checked={settings.spotlight_avatar_enabled || false}
              onCheckedChange={(checked) => onChange('spotlight_avatar_enabled', checked)}
            />
          </div>

          {settings.spotlight_avatar_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="spotlight_avatar">Spotlight Avatar URL</Label>
                <Input
                  id="spotlight_avatar"
                  value={settings.spotlight_avatar || ""}
                  onChange={(e) => onChange('spotlight_avatar', e.target.value)}
                  placeholder="https://example.com/spotlight-avatar.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spotlight_avatar_shape">Spotlight Avatar Shape</Label>
                <Select
                  value={settings.spotlight_avatar_shape || "rectangle"}
                  onValueChange={(value) => onChange('spotlight_avatar_shape', value)}
                >
                  <SelectTrigger id="spotlight_avatar_shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spotlight_avatar_type">Spotlight Avatar Type</Label>
                <Select
                  value={settings.spotlight_avatar_type || "default"}
                  onValueChange={(value) => onChange('spotlight_avatar_type', value)}
                >
                  <SelectTrigger id="spotlight_avatar_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="animated">Animated</SelectItem>
                    <SelectItem value="3d">3D</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}