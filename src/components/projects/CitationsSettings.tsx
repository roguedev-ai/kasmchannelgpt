import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CitationsSettingsProps {
  settings: {
    enable_citations?: number;
    citations_view_type?: string;
    image_citation_display?: string;
    enable_inline_citations_api?: boolean;
    hide_sources_from_responses?: boolean;
    no_answer_message?: string;
    ending_message?: string;
    try_asking_questions_msg?: string;
    view_more_msg?: string;
    view_less_msg?: string;
  };
  onChange: (field: string, value: any) => void;
}

export function CitationsSettings({ settings, onChange }: CitationsSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Citations Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure how citations and sources are displayed in responses
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="enable_citations">Citation Display Mode</Label>
            <Select
              value={settings.enable_citations?.toString() || "3"}
              onValueChange={(value) => onChange('enable_citations', parseInt(value))}
            >
              <SelectTrigger id="enable_citations">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Disabled</SelectItem>
                <SelectItem value="1">Inline Only</SelectItem>
                <SelectItem value="2">Footer Only</SelectItem>
                <SelectItem value="3">Both Inline and Footer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="citations_view_type">Citations View Type</Label>
            <Select
              value={settings.citations_view_type || "user"}
              onValueChange={(value) => onChange('citations_view_type', value)}
            >
              <SelectTrigger id="citations_view_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User View</SelectItem>
                <SelectItem value="show">Show Citations</SelectItem>
                <SelectItem value="hide">Hide Citations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_citation_display">Image Citation Display</Label>
            <Select
              value={settings.image_citation_display || "default"}
              onValueChange={(value) => onChange('image_citation_display', value)}
            >
              <SelectTrigger id="image_citation_display">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="inline">Inline</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable_inline_citations_api">Enable Inline Citations API</Label>
              <p className="text-sm text-muted-foreground">
                Allow API responses to include inline citation markers
              </p>
            </div>
            <Switch
              id="enable_inline_citations_api"
              checked={settings.enable_inline_citations_api || false}
              onCheckedChange={(checked) => onChange('enable_inline_citations_api', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hide_sources_from_responses">Hide Sources from Responses</Label>
              <p className="text-sm text-muted-foreground">
                Don&apos;t show source references in chat responses
              </p>
            </div>
            <Switch
              id="hide_sources_from_responses"
              checked={settings.hide_sources_from_responses || false}
              onCheckedChange={(checked) => onChange('hide_sources_from_responses', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Messages</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize messages shown in various response scenarios
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="no_answer_message">No Answer Message</Label>
            <Input
              id="no_answer_message"
              value={settings.no_answer_message || ""}
              onChange={(e) => onChange('no_answer_message', e.target.value)}
              placeholder="Sorry, I don&apos;t have an answer for that."
            />
            <p className="text-sm text-muted-foreground">
              Message shown when the agent cannot find an answer
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ending_message">Ending Message</Label>
            <Input
              id="ending_message"
              value={settings.ending_message || ""}
              onChange={(e) => onChange('ending_message', e.target.value)}
              placeholder="Please email us for further support"
            />
            <p className="text-sm text-muted-foreground">
              Message shown at the end of responses when applicable
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="try_asking_questions_msg">Try Asking Questions Message</Label>
            <Input
              id="try_asking_questions_msg"
              value={settings.try_asking_questions_msg || ""}
              onChange={(e) => onChange('try_asking_questions_msg', e.target.value)}
              placeholder="Try asking these questions..."
            />
            <p className="text-sm text-muted-foreground">
              Prompt shown above example questions
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="view_more_msg">View More Message</Label>
            <Input
              id="view_more_msg"
              value={settings.view_more_msg || ""}
              onChange={(e) => onChange('view_more_msg', e.target.value)}
              placeholder="View more"
            />
            <p className="text-sm text-muted-foreground">
              Text for expanding content
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="view_less_msg">View Less Message</Label>
            <Input
              id="view_less_msg"
              value={settings.view_less_msg || ""}
              onChange={(e) => onChange('view_less_msg', e.target.value)}
              placeholder="View less"
            />
            <p className="text-sm text-muted-foreground">
              Text for collapsing content
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}