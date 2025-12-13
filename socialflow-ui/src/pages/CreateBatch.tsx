import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, LoadingSpinner, ErrorAlert } from '@/components/shared';
import { useClient, useGenerateBatchBrief } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, RefreshCw, FolderPlus } from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CreateBatch() {
  const { client } = useParams<{ client: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const clientData = useClient(client || '');
  const generateBrief = useGenerateBatchBrief();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [brief, setBrief] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!client) {
    return <ErrorAlert message="No client specified" />;
  }

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const handleGenerateBrief = async () => {
    if (!description.trim()) {
      toast({
        title: 'Description required',
        description: 'Please enter a description of the batch project first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateBrief.mutateAsync({
        client,
        batch: slug || 'new-batch',
        description,
      });
      setBrief(result.data.brief);
      toast({
        title: 'Brief generated',
        description: 'AI has generated a brief based on your description. You can edit it before saving.',
      });
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate brief',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug) {
      toast({
        title: 'Validation error',
        description: 'Name and slug are required',
        variant: 'destructive',
      });
      return;
    }

    // For now, just show a toast - actual batch creation would need backend support
    toast({
      title: 'Batch configuration ready',
      description: `Create the folder "${slug}" in the client directory and add your media files. The brief will be saved to batch.yaml.`,
    });

    navigate(`/clients/${client}`);
  };

  if (clientData.isLoading) {
    return <LoadingSpinner text="Loading client..." />;
  }

  if (clientData.error) {
    return (
      <ErrorAlert
        message={clientData.error.message}
        onRetry={() => clientData.refetch()}
      />
    );
  }

  const clientName = clientData.data?.data?.name || client;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Create New Batch"
        description={`Create a new content batch for ${clientName}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Clients', to: '/clients' },
          { label: clientName, to: `/clients/${client}` },
          { label: 'New Batch' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Batch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="December Feed Content"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Folder Name *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="december-feed"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be the folder name for your media files
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Brief Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Brief Generation
            </CardTitle>
            <CardDescription>
              Describe your batch project and let AI generate the caption brief
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the theme, goals, and mood of this batch. For example: Winter menu launch featuring new soups and warm dishes. Focus on cozy vibes, comfort food, and warmth."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                The more detail you provide, the better the AI-generated brief will be.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateBrief}
              disabled={isGenerating || !description.trim()}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Brief
                </>
              )}
            </Button>

            <div className="space-y-2">
              <Label htmlFor="brief">Caption Brief</Label>
              <Textarea
                id="brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="The caption brief will appear here after generation. You can also write one manually."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This brief tells the AI how to generate captions for content in this batch.
                You can edit the generated brief or write your own.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hashtags */}
        <Card>
          <CardHeader>
            <CardTitle>Batch Hashtags</CardTitle>
            <CardDescription>
              These hashtags will be added to content in this batch (in addition to client hashtags)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#wintermenu #comfortfood #seasonal"
              />
              <p className="text-xs text-muted-foreground">
                Space-separated hashtags specific to this batch
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(`/clients/${client}`)}>
            Cancel
          </Button>
          <Button type="submit">
            <FolderPlus className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </form>
    </div>
  );
}
