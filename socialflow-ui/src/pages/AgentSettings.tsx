import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader, LoadingSpinner, ErrorAlert } from '@/components/shared';
import { useAgentSettings, useUpdateAgentSettings } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import { Save, Bot, Sparkles, RefreshCw } from 'lucide-react';

export default function AgentSettings() {
  const { toast } = useToast();
  const agentSettings = useAgentSettings();
  const updateSettings = useUpdateAgentSettings();

  // Local state for editing
  const [configModel, setConfigModel] = useState('');
  const [configPrompt, setConfigPrompt] = useState('');
  const [captionModel, setCaptionModel] = useState('');
  const [captionPrompt, setCaptionPrompt] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize local state from API data
  useEffect(() => {
    if (agentSettings.data?.data && !initialized) {
      const data = agentSettings.data.data;
      setConfigModel(data.config_generator?.model || 'llama3.2:3b');
      setConfigPrompt(data.config_generator?.master_prompt || '');
      setCaptionModel(data.caption_generator?.model || 'llava:7b');
      setCaptionPrompt(data.caption_generator?.master_prompt || '');
      setInitialized(true);
    }
  }, [agentSettings.data, initialized]);

  const handleSaveConfigGenerator = async () => {
    try {
      await updateSettings.mutateAsync({
        agentType: 'config_generator',
        updates: {
          model: configModel,
          master_prompt: configPrompt,
        },
      });
      toast({
        title: 'Settings saved',
        description: 'Config Generator settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCaptionGenerator = async () => {
    try {
      await updateSettings.mutateAsync({
        agentType: 'caption_generator',
        updates: {
          model: captionModel,
          master_prompt: captionPrompt,
        },
      });
      toast({
        title: 'Settings saved',
        description: 'Caption Generator settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  if (agentSettings.isLoading) {
    return <LoadingSpinner text="Loading agent settings..." />;
  }

  if (agentSettings.error) {
    return (
      <ErrorAlert
        message={agentSettings.error.message}
        onRetry={() => agentSettings.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Agent Settings"
        description="Configure the AI agents that generate configurations and captions"
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Settings', to: '/settings' },
          { label: 'AI Agents' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInitialized(false);
              agentSettings.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config" className="gap-2">
            <Bot className="h-4 w-4" />
            Config Generator
          </TabsTrigger>
          <TabsTrigger value="caption" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Caption Generator
          </TabsTrigger>
        </TabsList>

        {/* Config Generator Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Config Generator (Agent 1)
              </CardTitle>
              <CardDescription>
                Generates client configuration files from onboarding form data.
                Creates client.yaml, brief.txt (for photos & videos), and hashtags.txt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="config-model">Ollama Model</Label>
                <Input
                  id="config-model"
                  value={configModel}
                  onChange={(e) => setConfigModel(e.target.value)}
                  placeholder="llama3.2:3b"
                />
                <p className="text-xs text-muted-foreground">
                  Text-only model for config generation. Recommended: llama3.2:3b
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="config-prompt">Master Instructions</Label>
                <Textarea
                  id="config-prompt"
                  value={configPrompt}
                  onChange={(e) => setConfigPrompt(e.target.value)}
                  placeholder="Enter the master instructions for the config generator agent..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  These instructions tell the AI how to generate client configuration files.
                  They are used as the system prompt when generating configs from onboarding data.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveConfigGenerator}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Caption Generator Tab */}
        <TabsContent value="caption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Caption Generator (Agent 2)
              </CardTitle>
              <CardDescription>
                Generates captions for social media content using images and client configuration.
                This is an enhanced version of the W2 workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption-model">Ollama Model</Label>
                <Input
                  id="caption-model"
                  value={captionModel}
                  onChange={(e) => setCaptionModel(e.target.value)}
                  placeholder="llava:7b"
                />
                <p className="text-xs text-muted-foreground">
                  Vision model for caption generation. Recommended: llava:7b or qwen2-vl
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption-prompt">Master Instructions</Label>
                <Textarea
                  id="caption-prompt"
                  value={captionPrompt}
                  onChange={(e) => setCaptionPrompt(e.target.value)}
                  placeholder="Enter the master instructions for the caption generator agent..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  These instructions tell the AI how to generate captions.
                  Client and batch-level overrides can modify these base instructions.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveCaptionGenerator}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Instruction Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            AI agent instructions follow a cascade pattern where more specific instructions override general ones:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>System Level</strong> (this page) - Master instructions for all agents
            </li>
            <li>
              <strong>Client Level</strong> - Override specific rules for a client (via Client Detail → AI Instructions)
            </li>
            <li>
              <strong>Batch Level</strong> - Override rules for a specific batch (via batch settings)
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
