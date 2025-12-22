import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useClient, useBatches, useDeleteClient, useArchiveClient, useIngest, useGenerate, useSchedule, useClientInstructions, useUpdateAgentInstruction, useGenerateClientConfig, useIsMounted, useAccounts } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner, ErrorAlert, EmptyState, PageHeader } from '@/components/shared';
import { ScheduledPostsSection } from '@/components/ScheduledPostsSection';
import { FolderOpen, ChevronRight, Clock, Globe, MessageSquare, Trash2, Archive, Play, Sparkles, Calendar, Image, Video, Bot, Save, RefreshCw, FileText, AlertCircle, Pencil, Link2 } from 'lucide-react';
import type { Batch } from '@/api/types';

export default function ClientDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const client = useClient(slug || '');
  const batches = useBatches(slug || '');
  const accounts = useAccounts();

  // Track component mount state to prevent memory leaks
  const isMountedRef = useIsMounted();

  // Early return if no slug
  if (!slug) {
    return <ErrorAlert message="No client specified" />;
  }
  const deleteClient = useDeleteClient();
  const archiveClient = useArchiveClient();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Workflow mutations
  const ingest = useIngest();
  const generate = useGenerate();
  const schedule = useSchedule();
  const generateConfig = useGenerateClientConfig();
  const [isGeneratingConfig, setIsGeneratingConfig] = useState(false);
  const [configGenResult, setConfigGenResult] = useState<{ success: boolean; message: string } | null>(null);

  // AI Instructions
  const clientInstructions = useClientInstructions(slug || '');
  const updateInstruction = useUpdateAgentInstruction();
  const [configOverride, setConfigOverride] = useState('');
  const [captionOverride, setCaptionOverride] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingCaption, setIsSavingCaption] = useState(false);

  // Initialize instruction state when data loads
  // Track the last slug+dataId to detect when to re-initialize
  const lastInitKey = useRef<string | null>(null);
  useEffect(() => {
    if (!clientInstructions.data?.data || !slug) return;

    // Create a key from slug + data timestamp to detect new data
    const currentKey = `${slug}:${clientInstructions.dataUpdatedAt}`;
    if (lastInitKey.current === currentKey) return;
    lastInitKey.current = currentKey;

    const instructions = clientInstructions.data.data;
    const configInstr = instructions.find(
      (i) => i.agent_type === 'config_generator' && i.instruction_key === 'override'
    );
    const captionInstr = instructions.find(
      (i) => i.agent_type === 'caption_generator' && i.instruction_key === 'override'
    );
    setConfigOverride(configInstr?.instruction_value || '');
    setCaptionOverride(captionInstr?.instruction_value || '');
  }, [clientInstructions.data, clientInstructions.dataUpdatedAt, slug]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteClient.mutateAsync(slug);
      toast({
        title: 'Client deleted',
        description: `${slug} has been permanently deleted`,
      });
      navigate('/clients');
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveClient.mutateAsync(slug);
      toast({
        title: 'Client archived',
        description: `${slug} has been moved to archive`,
      });
      navigate('/clients');
    } catch (error) {
      toast({
        title: 'Archive failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      if (isMountedRef.current) {
        setIsArchiving(false);
      }
    }
  };

  const handleIngest = async (batchName: string) => {
    try {
      await ingest.mutateAsync({ client: slug, batch: batchName });
      if (isMountedRef.current) {
        toast({
          title: 'Ingest started',
          description: `Processing ${batchName}...`,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Ingest failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    }
  };

  const handleGenerate = async (batchName: string) => {
    try {
      await generate.mutateAsync({ client: slug, batch: batchName });
      if (isMountedRef.current) {
        toast({
          title: 'Caption generation started',
          description: `Generating captions for ${batchName}...`,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Generation failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSchedule = async (batchName: string) => {
    try {
      await schedule.mutateAsync({ client: slug, batch: batchName });
      if (isMountedRef.current) {
        toast({
          title: 'Scheduling started',
          description: `Scheduling ${batchName} to Late.com...`,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Schedule failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    }
  };

  const handleGenerateConfig = async () => {
    if (!clientData) return;
    setIsGeneratingConfig(true);
    setConfigGenResult(null);
    try {
      const result = await generateConfig.mutateAsync({
        slug: clientData.slug,
        onboarding: clientData.onboarding_data || {
          business_name: clientData.name,
          business_description: clientData.brand_description || `${clientData.name} - ${clientData.type} business`,
          target_audience: clientData.brand_target_audience || '',
          brand_personality: '',
          language: clientData.language,
          content_themes: '',
          call_to_actions: '',
          things_to_avoid: '',
        },
      });
      setConfigGenResult({
        success: true,
        message: result.message || 'Brand configuration generated successfully',
      });
      toast({
        title: 'Brand configuration generated',
        description: `Brand voice and hashtags generated for ${clientData.name}`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setConfigGenResult({
        success: false,
        message: errorMsg,
      });
      toast({
        title: 'Generation failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      if (isMountedRef.current) {
        setIsGeneratingConfig(false);
      }
    }
  };

  const handleSaveConfigOverride = async () => {
    if (!slug) return;
    setIsSavingConfig(true);
    try {
      await updateInstruction.mutateAsync({
        agentType: 'config_generator',
        scope: 'client',
        instructionKey: 'override',
        instructionValue: configOverride,
        scopeId: slug,
      });
      toast({
        title: 'Saved',
        description: 'Config generator instructions saved for this client.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      if (isMountedRef.current) {
        setIsSavingConfig(false);
      }
    }
  };

  const handleSaveCaptionOverride = async () => {
    if (!slug) return;
    setIsSavingCaption(true);
    try {
      await updateInstruction.mutateAsync({
        agentType: 'caption_generator',
        scope: 'client',
        instructionKey: 'override',
        instructionValue: captionOverride,
        scopeId: slug,
      });
      toast({
        title: 'Saved',
        description: 'Caption generator instructions saved for this client.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      if (isMountedRef.current) {
        setIsSavingCaption(false);
      }
    }
  };

  if (client.isLoading) {
    return <LoadingSpinner text="Loading client..." />;
  }

  if (client.error) {
    return (
      <ErrorAlert
        message={client.error.message}
        onRetry={() => client.refetch()}
      />
    );
  }

  const clientData = client.data?.data;
  const batchList = batches.data?.data?.batches || [];

  if (!clientData) {
    return <ErrorAlert message="Client not found" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title={clientData.name}
          description={`${clientData.slug} • ${clientData.type} • ${clientData.timezone}`}
          breadcrumbs={[
            { label: 'Dashboard', to: '/' },
            { label: 'Clients', to: '/clients' },
            { label: clientData.name },
          ]}
        />
        <div className="flex gap-2">
          {/* Edit Button */}
          <Button variant="outline" size="sm" asChild>
            <Link to={`/clients/${slug}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>

          {/* Archive Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isArchiving}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive client?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will move "{clientData.name}" and all its data to the archive.
                  You can restore it later from the archive section.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
                  {isArchiving ? 'Archiving...' : 'Archive'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Permanently delete client?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{clientData.name}" and all associated data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isDeleting ? 'Deleting...' : 'Delete permanently'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-instructions" className="gap-2">
            <Bot className="h-4 w-4" />
            AI Instructions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Client Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold uppercase">{clientData.language}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timezone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{clientData.timezone}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium capitalize">{clientData.type}</p>
              </CardContent>
            </Card>
          </div>

          {/* Brand Configuration (AI-Generated) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Brand Configuration
                    {clientData.ai_generated && (
                      <Badge variant="outline" className="ml-2 text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950/30">
                        AI Generated
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {clientData.ai_generated
                      ? 'AI-generated brand voice and hashtags for content creation.'
                      : 'Generate brand configuration to help AI create better captions.'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {clientData.ai_generated && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/clients/${slug}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  )}
                  <Button
                    onClick={handleGenerateConfig}
                    disabled={isGeneratingConfig}
                    variant={clientData.ai_generated ? 'outline' : 'default'}
                    size="sm"
                  >
                    {isGeneratingConfig ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {clientData.ai_generated ? 'Regenerate' : 'Generate'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {clientData.ai_generated ? (
                <div className="space-y-4">
                  {clientData.brand_voice && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Brand Voice</Label>
                      <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3">
                        {clientData.brand_voice.length > 500
                          ? clientData.brand_voice.substring(0, 500) + '...'
                          : clientData.brand_voice}
                      </p>
                    </div>
                  )}
                  {clientData.brand_target_audience && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Target Audience</Label>
                      <p className="mt-1 text-sm">{clientData.brand_target_audience}</p>
                    </div>
                  )}
                  {clientData.hashtags && clientData.hashtags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Hashtags</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {clientData.hashtags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No brand configuration generated yet.</p>
                  <p className="text-xs mt-1">Click "Generate" to create AI-powered brand guidelines.</p>
                  {configGenResult && !configGenResult.success && (
                    <div className="flex items-center justify-center gap-2 text-sm text-red-600 mt-3">
                      <AlertCircle className="h-4 w-4" />
                      {configGenResult.message}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Late.com Integration */}
          {(() => {
            const profiles = accounts.data?.data?.profiles || [];
            const linkedProfile = clientData.late_profile_id
              ? profiles.find(p => p.id === clientData.late_profile_id)
              : null;

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Late.com Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {linkedProfile ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: linkedProfile.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{linkedProfile.name}</p>
                        {linkedProfile.description && (
                          <p className="text-sm text-muted-foreground">{linkedProfile.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/30">
                        Connected
                      </Badge>
                    </div>
                  ) : clientData.late_profile_id ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-700 dark:text-yellow-400">Profile not found</p>
                        <p className="text-sm text-muted-foreground">
                          The linked profile may have been removed from Late.com. Edit the client to select a new profile.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Link2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No Late.com profile linked</p>
                      <p className="text-xs mt-1">
                        <Link to={`/clients/${slug}/edit`} className="text-primary hover:underline">
                          Edit client
                        </Link>
                        {' '}to connect a Late.com profile for scheduling.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {clientData.accounts?.instagram ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <span className="text-2xl">📷</span>
                <div>
                  <p className="font-medium">{clientData.accounts.instagram.username}</p>
                  <p className="text-xs text-muted-foreground">Instagram</p>
                </div>
              </div>
            ) : (
              <Badge variant="secondary" className="text-base py-2 px-4">
                📷 Instagram not linked
              </Badge>
            )}

            {clientData.accounts?.tiktok ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <span className="text-2xl">🎵</span>
                <div>
                  <p className="font-medium">{clientData.accounts.tiktok.username}</p>
                  <p className="text-xs text-muted-foreground">TikTok</p>
                </div>
              </div>
            ) : (
              <Badge variant="secondary" className="text-base py-2 px-4">
                🎵 TikTok not linked
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Posts from Late.com (v16.5) */}
      <ScheduledPostsSection
        slug={slug}
        profileId={clientData.late_profile_id}
      />

      {/* Batches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Batches</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => batches.refetch()}
              disabled={batches.isFetching}
              title="Refresh batches from filesystem"
            >
              <RefreshCw className={`h-4 w-4 ${batches.isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {batches.isLoading ? (
            <LoadingSpinner size="sm" />
          ) : batchList.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No batches"
              description="Create a batch folder with media files to get started. Add a READY.txt file to enable processing."
            />
          ) : (
            <div className="space-y-3">
              {batchList.map((batch: Batch) => (
                <div
                  key={batch.name}
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FolderOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="space-y-2">
                        <div>
                          <Link
                            to={`/batches/${clientData.slug}/${batch.name}`}
                            className="font-medium hover:underline"
                          >
                            {batch.name}
                          </Link>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            {batch.photo_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Image className="h-3.5 w-3.5" />
                                {batch.photo_count} photos
                              </span>
                            )}
                            {batch.video_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Video className="h-3.5 w-3.5" />
                                {batch.video_count} videos
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {batch.has_ready ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/30">
                              Ready
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No READY.txt</Badge>
                          )}
                          {batch.ingested ? (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30">
                              Ingested ({batch.item_count})
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not ingested</Badge>
                          )}
                          {batch.needs_ai > 0 && (
                            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950/30">
                              Needs AI: {batch.needs_ai}
                            </Badge>
                          )}
                          {batch.needs_review > 0 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950/30">
                              Needs Review: {batch.needs_review}
                            </Badge>
                          )}
                          {batch.approved > 0 && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/30">
                              Approved: {batch.approved}
                            </Badge>
                          )}
                          {batch.scheduled > 0 && (
                            <Badge variant="outline" className="text-cyan-600 border-cyan-200 bg-cyan-50 dark:text-cyan-400 dark:border-cyan-800 dark:bg-cyan-950/30">
                              Scheduled: {batch.scheduled}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Workflow action buttons */}
                      {!batch.ingested ? (
                        <Button
                          size="sm"
                          onClick={() => handleIngest(batch.name)}
                          disabled={!batch.has_ready || ingest.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {ingest.isPending ? 'Ingesting...' : 'Ingest'}
                        </Button>
                      ) : (
                        <>
                          {batch.needs_ai > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerate(batch.name)}
                              disabled={generate.isPending}
                            >
                              <Sparkles className="h-4 w-4 mr-1" />
                              {generate.isPending ? 'Generating...' : `Generate (${batch.needs_ai})`}
                            </Button>
                          )}
                          {batch.approved > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSchedule(batch.name)}
                              disabled={schedule.isPending}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              {schedule.isPending ? 'Scheduling...' : `Schedule (${batch.approved})`}
                            </Button>
                          )}
                        </>
                      )}
                      <Link to={`/batches/${clientData.slug}/${batch.name}`}>
                        <Button size="sm" variant="ghost">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* AI Instructions Tab */}
        <TabsContent value="ai-instructions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Config Generator Instructions
              </CardTitle>
              <CardDescription>
                Override instructions for how AI generates configuration files for this client.
                These instructions will be combined with system-level settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="config-override">Client-Specific Instructions</Label>
                <Textarea
                  id="config-override"
                  value={configOverride}
                  onChange={(e) => setConfigOverride(e.target.value)}
                  placeholder="Add client-specific instructions here. For example: Always emphasize the family-friendly atmosphere. Never mention competitors..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use only system-level defaults. These override system instructions for this client.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveConfigOverride}
                  disabled={isSavingConfig}
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Config Instructions
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Caption Generator Instructions
              </CardTitle>
              <CardDescription>
                Override instructions for how AI generates captions for this client's content.
                These instructions will be combined with system-level and batch-level settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption-override">Client-Specific Instructions</Label>
                <Textarea
                  id="caption-override"
                  value={captionOverride}
                  onChange={(e) => setCaptionOverride(e.target.value)}
                  placeholder="Add client-specific caption instructions here. For example: Always end with a question to engage followers. Use casual, friendly tone..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use only system-level defaults. Batch-level instructions can further override these.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveCaptionOverride}
                  disabled={isSavingCaption}
                >
                  {isSavingCaption ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Caption Instructions
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Instruction Hierarchy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Instructions follow a cascade pattern where more specific settings override general ones:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  <strong>System Level</strong> (Settings → AI Agents) - Master instructions for all clients
                </li>
                <li>
                  <strong>Client Level</strong> (this page) - Override specific rules for {clientData.name}
                </li>
                <li>
                  <strong>Batch Level</strong> - Override rules for specific content batches
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
