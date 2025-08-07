import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdvancedSettingsProps {
  settings: {
    chatbot_model?: string;
    enable_feedbacks?: boolean;
    is_loading_indicator_enabled?: boolean;
    can_share_conversation?: boolean;
    can_export_conversation?: boolean;
    conversation_time_window?: boolean;
    conversation_retention_period?: string;
    conversation_retention_days?: number;
    enable_agent_knowledge_base_awareness?: boolean;
    markdown_enabled?: boolean;
  };
  onChange: (field: string, value: any) => void;
}

export function AdvancedSettings({ settings, onChange }: AdvancedSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure the AI model and response behavior
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chatbot_model">AI Model</Label>
            <Select
              value={settings.chatbot_model || "gpt-4-o"}
              onValueChange={(value) => onChange('chatbot_model', value)}
            >
              <SelectTrigger id="chatbot_model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4-o">GPT-4 Optimized</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="markdown_enabled">Enable Markdown</Label>
              <p className="text-sm text-muted-foreground">
                Allow markdown formatting in responses
              </p>
            </div>
            <Switch
              id="markdown_enabled"
              checked={settings.markdown_enabled !== false}
              onCheckedChange={(checked) => onChange('markdown_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable_agent_knowledge_base_awareness">Knowledge Base Awareness</Label>
              <p className="text-sm text-muted-foreground">
                Allow agent to be aware of its knowledge base content
              </p>
            </div>
            <Switch
              id="enable_agent_knowledge_base_awareness"
              checked={settings.enable_agent_knowledge_base_awareness !== false}
              onCheckedChange={(checked) => onChange('enable_agent_knowledge_base_awareness', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Experience Features</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toggle features that enhance user interaction
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable_feedbacks">Enable Feedback</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to provide feedback on responses
              </p>
            </div>
            <Switch
              id="enable_feedbacks"
              checked={settings.enable_feedbacks !== false}
              onCheckedChange={(checked) => onChange('enable_feedbacks', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_loading_indicator_enabled">Show Loading Indicator</Label>
              <p className="text-sm text-muted-foreground">
                Display loading animation while generating responses
              </p>
            </div>
            <Switch
              id="is_loading_indicator_enabled"
              checked={settings.is_loading_indicator_enabled !== false}
              onCheckedChange={(checked) => onChange('is_loading_indicator_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="can_share_conversation">Allow Conversation Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Enable users to share conversations
              </p>
            </div>
            <Switch
              id="can_share_conversation"
              checked={settings.can_share_conversation || false}
              onCheckedChange={(checked) => onChange('can_share_conversation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="can_export_conversation">Allow Conversation Export</Label>
              <p className="text-sm text-muted-foreground">
                Enable users to export conversations
              </p>
            </div>
            <Switch
              id="can_export_conversation"
              checked={settings.can_export_conversation || false}
              onCheckedChange={(checked) => onChange('can_export_conversation', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure how long conversations are stored
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="conversation_time_window">Enable Retention Period</Label>
              <p className="text-sm text-muted-foreground">
                Automatically delete old conversations
              </p>
            </div>
            <Switch
              id="conversation_time_window"
              checked={settings.conversation_time_window || false}
              onCheckedChange={(checked) => onChange('conversation_time_window', checked)}
            />
          </div>

          {settings.conversation_time_window && (
            <>
              <div className="space-y-2">
                <Label htmlFor="conversation_retention_period">Retention Period</Label>
                <Select
                  value={settings.conversation_retention_period || "year"}
                  onValueChange={(value) => onChange('conversation_retention_period', value)}
                >
                  <SelectTrigger id="conversation_retention_period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                    <SelectItem value="custom">Custom Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.conversation_retention_period === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="conversation_retention_days">Custom Retention Days</Label>
                  <Input
                    id="conversation_retention_days"
                    type="number"
                    min="1"
                    max="3650"
                    value={settings.conversation_retention_days || 180}
                    onChange={(e) => onChange('conversation_retention_days', parseInt(e.target.value))}
                    placeholder="180"
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of days to retain conversations (1-3650)
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}