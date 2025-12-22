import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress, CircularProgress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassPanel } from '@/components/ui/glass-panel';
import { StatusDot, type ContentStatus } from '@/components/ui/status-indicator';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useBatchStatus, useIngest, useGenerate, useSchedule, useResetBatch, useClient, useContentItems, useGenerationProgress, useIngestProgress, useBatchInstructions, useUpdateAgentInstruction, useIsMounted, useScheduleItems, useUpdateBatch, useBatches } from '@/hooks';
import { LoadingSpinner, ErrorAlert, PageHeader } from '@/components/shared';
import { SchedulingCalendar } from '@/components/scheduling';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getVideoCoverUrl } from '@/lib/media';
import { getStatusBadge, DEFAULT_STATUS_COUNTS, WORKFLOW_STEPS, sanitizeErrorMessage } from '@/lib/status-utils';
import type { ContentItem } from '@/api/types';
import {
  Sparkles,
  Eye,
  CheckCircle,
  Calendar,
  AlertCircle,
  Play,
  RefreshCw,
  Image,
  Video,
  FileText,
  Bot,
  Trash2,
  Loader2,
  Save,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Clock,
  Smartphone,
} from 'lucide-react';

type WorkflowStage = 'idle' | 'ingesting' | 'ingest_complete' | 'generating' | 'generate_complete' | 'scheduling' | 'schedule_complete';

// Workflow step icons
const WORKFLOW_STEP_ICONS = {
  ingest: FileText,
  generate: Sparkles,
  schedule: Calendar,
} as const;

// Status configuration for condensed row
const STATUS_ROW: { key: keyof typeof DEFAULT_STATUS_COUNTS; label: string; status: ContentStatus }[] = [
  { key: 'pending', label: 'Pending', status: 'PENDING' },
  { key: 'needs_ai', label: 'AI', status: 'NEEDS_AI' },
  { key: 'needs_review', label: 'Review', status: 'NEEDS_REVIEW' },
  { key: 'approved', label: 'Approved', status: 'APPROVED' },
  { key: 'scheduled', label: 'Scheduled', status: 'SCHEDULED' },
];

export default function BatchDetail() {
  const { client, batch } = useParams<{ client: string; batch: string }>();

  // Early return if params are missing
  if (!client || !batch) {
    return <ErrorAlert message="Missing client or batch parameter" />;
  }

  const clientData = useClient(client);
  const batchStatus = useBatchStatus(client, batch);
  const contentItems = useContentItems(client, batch);
  const ingest = useIngest();
  const generate = useGenerate();
  const schedule = useSchedule();
  const resetBatch = useResetBatch();
  const updateBatch = useUpdateBatch();
  const batchesData = useBatches(client);
  const { toast } = useToast();

  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('idle');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // AI Caption settings state (v16.1, v17.6)
  const currentBatch = batchesData.data?.data?.batches?.find(b => b.slug === batch);
  const [videoAiSetting, setVideoAiSetting] = useState<'inherit' | 'enabled' | 'disabled'>('inherit');
  const [photoAiSetting, setPhotoAiSetting] = useState<'inherit' | 'enabled' | 'disabled'>('inherit');

  // Schedule time settings (v17.8) - Format-specific posting times
  const [photoTime, setPhotoTime] = useState('19:00');
  const [videoTime, setVideoTime] = useState('20:00');
  const [storyTime, setStoryTime] = useState('12:00');

  // Initialize AI settings and schedule times from batch data
  useEffect(() => {
    if (currentBatch) {
      // Video AI
      if (currentBatch.video_ai_captions === true) {
        setVideoAiSetting('enabled');
      } else if (currentBatch.video_ai_captions === false) {
        setVideoAiSetting('disabled');
      } else {
        setVideoAiSetting('inherit');
      }
      // Photo AI
      if (currentBatch.photo_ai_captions === true) {
        setPhotoAiSetting('enabled');
      } else if (currentBatch.photo_ai_captions === false) {
        setPhotoAiSetting('disabled');
      } else {
        setPhotoAiSetting('inherit');
      }
      // Schedule times (v17.8)
      if (currentBatch.schedule_config) {
        try {
          const config = typeof currentBatch.schedule_config === 'string'
            ? JSON.parse(currentBatch.schedule_config)
            : currentBatch.schedule_config;
          setPhotoTime(config.photo_time || config.feed_time || '19:00');
          setVideoTime(config.video_time || config.feed_time || '20:00');
          setStoryTime(config.story_time || '12:00');
        } catch {
          // Keep defaults if parsing fails
        }
      }
    }
  }, [currentBatch]);

  // Handler for video AI setting change
  const handleVideoAiSettingChange = async (value: 'inherit' | 'enabled' | 'disabled') => {
    const previousValue = videoAiSetting;
    setVideoAiSetting(value);
    const apiValue = value === 'inherit' ? null : value === 'enabled';
    try {
      await updateBatch.mutateAsync({
        client,
        batch,
        updates: { video_ai_captions: apiValue }
      });
      toast({
        title: 'Settings updated',
        description: 'Video AI caption setting has been saved.',
      });
    } catch {
      // Rollback to previous value on error
      setVideoAiSetting(previousValue);
      toast({
        title: 'Error',
        description: 'Failed to save video AI setting.',
        variant: 'destructive',
      });
    }
  };

  // Handler for photo AI setting change
  const handlePhotoAiSettingChange = async (value: 'inherit' | 'enabled' | 'disabled') => {
    const previousValue = photoAiSetting;
    setPhotoAiSetting(value);
    const apiValue = value === 'inherit' ? null : value === 'enabled';
    try {
      await updateBatch.mutateAsync({
        client,
        batch,
        updates: { photo_ai_captions: apiValue }
      });
      toast({
        title: 'Settings updated',
        description: 'Photo AI caption setting has been saved.',
      });
    } catch {
      // Rollback to previous value on error
      setPhotoAiSetting(previousValue);
      toast({
        title: 'Error',
        description: 'Failed to save photo AI setting.',
        variant: 'destructive',
      });
    }
  };

  // Handler for schedule time changes (v17.8)
  const handleScheduleTimeChange = async (
    timeType: 'photo' | 'video' | 'story',
    value: string
  ) => {
    // Update local state immediately
    if (timeType === 'photo') setPhotoTime(value);
    else if (timeType === 'video') setVideoTime(value);
    else if (timeType === 'story') setStoryTime(value);

    // Build schedule config
    const newConfig = {
      photo_time: timeType === 'photo' ? value : photoTime,
      video_time: timeType === 'video' ? value : videoTime,
      story_time: timeType === 'story' ? value : storyTime,
      // Keep legacy feed_time for backwards compatibility
      feed_time: timeType === 'photo' ? value : photoTime,
    };

    try {
      await updateBatch.mutateAsync({
        client,
        batch,
        updates: { schedule_config: JSON.stringify(newConfig) }
      });
      toast({
        title: 'Schedule updated',
        description: `${timeType.charAt(0).toUpperCase() + timeType.slice(1)} posting time saved.`,
      });
    } catch {
      // Rollback on error
      if (currentBatch?.schedule_config) {
        try {
          const config = typeof currentBatch.schedule_config === 'string'
            ? JSON.parse(currentBatch.schedule_config)
            : currentBatch.schedule_config;
          setPhotoTime(config.photo_time || config.feed_time || '19:00');
          setVideoTime(config.video_time || config.feed_time || '20:00');
          setStoryTime(config.story_time || '12:00');
        } catch {
          // Keep current values if rollback fails
        }
      }
      toast({
        title: 'Error',
        description: 'Failed to save schedule time.',
        variant: 'destructive',
      });
    }
  };

  // AI Instructions state
  const batchInstructions = useBatchInstructions(client, batch);
  const updateInstruction = useUpdateAgentInstruction();
  const [captionOverride, setCaptionOverride] = useState('');
  const [isSavingCaption, setIsSavingCaption] = useState(false);

  // Scheduling calendar state
  const scheduleItems = useScheduleItems({ clientSlug: client, batchSlug: batch });

  // Track component mounted state to prevent state updates after unmount
  const isMountedRef = useIsMounted();

  // Initialize batch instruction state when data loads
  const lastInitKey = useRef<string | null>(null);
  useEffect(() => {
    if (!batchInstructions.data?.data || !client || !batch) return;

    const currentKey = `${client}/${batch}:${batchInstructions.dataUpdatedAt}`;
    if (lastInitKey.current === currentKey) return;
    lastInitKey.current = currentKey;

    const instructions = batchInstructions.data.data;
    const captionInstr = instructions.find(
      (i) => i.agent_type === 'caption_generator' && i.instruction_key === 'override'
    );
    setCaptionOverride(captionInstr?.instruction_value || '');
  }, [batchInstructions.data, batchInstructions.dataUpdatedAt, client, batch]);

  // Use TanStack Query for generation progress polling - automatically stops when not generating
  const generationProgressQuery = useGenerationProgress(client, batch, workflowStage === 'generating');
  const generationProgress = generationProgressQuery.data?.data?.progress || null;
  const isGenerationRunning = generationProgressQuery.data?.data?.is_running ?? false;

  // Use TanStack Query for ingest progress polling - automatically stops when not ingesting
  const ingestProgressQuery = useIngestProgress(client, batch, workflowStage === 'ingesting');
  const ingestProgress = ingestProgressQuery.data?.data?.progress || null;
  const isIngestRunning = ingestProgressQuery.data?.data?.is_running ?? false;

  // Track if we've seen the workflow start (to detect completion)
  const ingestStartedRef = useRef(false);
  const generateStartedRef = useRef(false);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  // Detect ingest completion via polling (not API response)
  useEffect(() => {
    if (workflowStage !== 'ingesting') {
      ingestStartedRef.current = false;
      return;
    }

    // Mark as started once we see is_running = true
    if (isIngestRunning) {
      ingestStartedRef.current = true;
    }

    // Detect completion: was running, now stopped
    if (ingestStartedRef.current && !isIngestRunning && ingestProgressQuery.data) {
      batchStatus.refetch();
      contentItems.refetch();
      toast({
        title: 'Ingest complete',
        description: 'Media files processed successfully',
      });
      setWorkflowStage('ingest_complete');
      completionTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) setWorkflowStage('idle');
      }, 3000);
    }
  }, [workflowStage, isIngestRunning, ingestProgressQuery.data, batchStatus, contentItems, toast]);

  // Detect generation completion via polling
  useEffect(() => {
    if (workflowStage !== 'generating') {
      generateStartedRef.current = false;
      return;
    }

    if (isGenerationRunning) {
      generateStartedRef.current = true;
    }

    if (generateStartedRef.current && !isGenerationRunning && generationProgressQuery.data) {
      batchStatus.refetch();
      contentItems.refetch();
      toast({
        title: 'AI generation complete',
        description: 'Captions generated successfully',
      });
      setWorkflowStage('generate_complete');
      completionTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) setWorkflowStage('idle');
      }, 3000);
    }
  }, [workflowStage, isGenerationRunning, generationProgressQuery.data, batchStatus, contentItems, toast]);

  const handleIngest = async () => {
    if (ingest.isPending || workflowStage === 'ingesting') return;
    setWorkflowStage('ingesting');
    try {
      const result = await ingest.mutateAsync({ client, batch });
      // v15.2: Handle immediate error responses from workflow
      if (!result.success || result.error_code) {
        if (isMountedRef.current) {
          toast({
            title: 'Ingest failed',
            description: result.error_message || result.message || 'Unknown error',
            variant: 'destructive',
          });
          setWorkflowStage('idle');
        }
        return;
      }
      // Check summary from workflow response
      const summary = result.data?.summary || result.summary;
      const totalItems = summary?.total ?? result.data?.total ?? 0;

      // Check if workflow found media but all items already exist (common when copying batches)
      // This happens because content_id doesn't include batch name
      if (totalItems === 0) {
        if (isMountedRef.current) {
          // Check error messages for specific issues
          const errorMsg = result.error_message || result.message || '';
          const isNoMedia = errorMsg.toLowerCase().includes('no media') ||
                           errorMsg.toLowerCase().includes('no files') ||
                           errorMsg.toLowerCase().includes('no_items');
          const isReadyMissing = errorMsg.toLowerCase().includes('ready.txt') ||
                                 errorMsg.toLowerCase().includes('ready_file');

          let title = 'Ingest complete';
          let description = 'No new items to process.';
          let variant: 'default' | 'destructive' = 'default';

          if (isReadyMissing) {
            title = 'READY.txt missing';
            description = 'Create a READY.txt file in the batch folder to enable processing.';
            variant = 'destructive';
          } else if (isNoMedia) {
            title = 'No media found';
            description = 'Ensure the batch has photos/ or videos/ subfolders with media files.';
            variant = 'destructive';
          }

          toast({ title, description, variant });
          batchStatus.refetch();
          contentItems.refetch();
          setWorkflowStage('ingest_complete');
          completionTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setWorkflowStage('idle');
          }, 3000);
        }
        return;
      }
      // Workflow started - completion will be detected by useEffect polling
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Ingest failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
        setWorkflowStage('idle');
      }
    }
  };

  const handleGenerate = async () => {
    if (generate.isPending || workflowStage === 'generating') return;
    setWorkflowStage('generating');
    try {
      const result = await generate.mutateAsync({ client, batch });
      // Handle immediate error responses
      if (!result.success || result.error_code) {
        if (isMountedRef.current) {
          toast({
            title: 'Generation failed',
            description: result.error_message || result.message || 'Unknown error',
            variant: 'destructive',
          });
          setWorkflowStage('idle');
        }
        return;
      }
      // Workflow started - completion will be detected by useEffect polling
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Generation failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
        setWorkflowStage('idle');
      }
    }
  };

  const handleSchedule = async () => {
    if (schedule.isPending) return;
    setWorkflowStage('scheduling');
    try {
      const result = await schedule.mutateAsync({ client, batch });
      if (isMountedRef.current) {
        toast({
          title: 'Scheduling complete',
          description: `Scheduled ${result.summary?.scheduled || 0} items to Late.com.`,
        });
        batchStatus.refetch();
        contentItems.refetch();
        // Show completion state briefly, then go idle
        setWorkflowStage('schedule_complete');
        setTimeout(() => {
          if (isMountedRef.current) setWorkflowStage('idle');
        }, 3000);
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Scheduling failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
        setWorkflowStage('idle');
      }
    }
  };

  const handleReset = async () => {
    try {
      const result = await resetBatch.mutateAsync({ client, batch });
      if (!isMountedRef.current) return;
      toast({
        title: 'Batch reset',
        description: `Deleted ${result.deleted} item${result.deleted !== 1 ? 's' : ''}. Media files preserved. Ready for re-ingest.`,
      });
      setIsResetDialogOpen(false);
      batchStatus.refetch();
      contentItems.refetch();
    } catch (error) {
      if (!isMountedRef.current) return;
      toast({
        title: 'Reset failed',
        description: error instanceof Error ? error.message : 'Failed to reset batch',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCaptionOverride = async () => {
    if (!client || !batch) return;
    setIsSavingCaption(true);
    try {
      await updateInstruction.mutateAsync({
        agentType: 'caption_generator',
        scope: 'batch',
        instructionKey: 'override',
        instructionValue: captionOverride,
        scopeId: `${client}/${batch}`,
      });
      toast({
        title: 'Saved',
        description: 'Batch AI instructions saved successfully.',
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

  if (batchStatus.isLoading || clientData.isLoading || contentItems.isLoading) {
    return <LoadingSpinner text="Loading batch..." />;
  }

  if (batchStatus.error) {
    return (
      <ErrorAlert
        message={batchStatus.error.message}
        onRetry={() => batchStatus.refetch()}
      />
    );
  }

  const counts = batchStatus.data?.data?.counts || DEFAULT_STATUS_COUNTS;

  const clientName = clientData.data?.data?.name || client;
  const progressPercent = counts.total > 0 ? Math.round((counts.scheduled / counts.total) * 100) : 0;

  const isWorkflowRunning = workflowStage !== 'idle' && !workflowStage.endsWith('_complete');

  // Get approved items for scheduling calendar
  const approvedItems = contentItems.data?.data?.items?.filter(
    (item: ContentItem) => item.status === 'APPROVED'
  ) || [];

  // Determine workflow step states
  const getStepState = (step: 'ingest' | 'generate' | 'schedule') => {
    if (step === 'ingest') {
      if (workflowStage === 'ingesting') return 'running';
      if (workflowStage === 'ingest_complete') return 'complete';
      if (counts.needs_ai > 0 || counts.needs_review > 0 || counts.approved > 0 || counts.scheduled > 0) return 'done';
      return 'ready';
    }
    if (step === 'generate') {
      if (workflowStage === 'generating') return 'running';
      if (workflowStage === 'generate_complete') return 'complete';
      if (counts.needs_review > 0 || counts.approved > 0 || counts.scheduled > 0) return 'done';
      if (counts.needs_ai > 0) return 'ready';
      return 'waiting';
    }
    if (step === 'schedule') {
      if (workflowStage === 'scheduling') return 'running';
      if (workflowStage === 'schedule_complete') return 'complete';
      if (counts.scheduled > 0) return 'done';
      if (counts.approved > 0) return 'ready';
      return 'waiting';
    }
    return 'waiting';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={batch}
        description={`Client: ${clientName}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Clients', to: '/clients' },
          { label: clientName, to: `/clients/${client}` },
          { label: batch },
        ]}
        actions={
          <div className="flex gap-2">
            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isWorkflowRunning || counts.total === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Batch</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all {counts.total} processed item{counts.total !== 1 ? 's' : ''} from the database for this batch. Media files, batch configuration, and client settings will be preserved. You can re-run Ingest after reset.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    disabled={resetBatch.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {resetBatch.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Batch'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => batchStatus.refetch()}
              disabled={isWorkflowRunning}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', batchStatus.isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Progress Hero */}
      <GlassPanel className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Circular Progress */}
          <div className="shrink-0">
            <CircularProgress value={progressPercent} size={140} strokeWidth={10}>
              <div className="text-center">
                <span className="text-3xl font-bold">{progressPercent}%</span>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </CircularProgress>
          </div>

          {/* Status Summary */}
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{counts.scheduled}/{counts.total} Scheduled</h2>
                <p className="text-sm text-muted-foreground">
                  {counts.needs_review > 0 && `${counts.needs_review} awaiting review`}
                  {counts.needs_review > 0 && counts.failed > 0 && ' • '}
                  {counts.failed > 0 && <span className="text-rose-600">{counts.failed} failed</span>}
                </p>
              </div>
            </div>

            {/* Condensed Status Row */}
            <div className="flex flex-wrap gap-4">
              {STATUS_ROW.map((item) => {
                const count = counts[item.key] ?? 0;
                return (
                  <div key={item.key} className="flex items-center gap-2">
                    <StatusDot status={item.status} size="md" />
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                );
              })}
              {counts.failed > 0 && (
                <div className="flex items-center gap-2">
                  <StatusDot status="FAILED" size="md" />
                  <span className="text-sm font-medium text-rose-600">{counts.failed}</span>
                  <span className="text-xs text-muted-foreground">Failed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Workflow Pipeline - Visual 3 Steps */}
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Workflow Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {WORKFLOW_STEPS.map((step, index) => {
              const state = getStepState(step.key);
              const StepIcon = WORKFLOW_STEP_ICONS[step.key];
              const isLast = index === WORKFLOW_STEPS.length - 1;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  {/* Step Node */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        'flex items-center justify-center w-14 h-14 rounded-2xl border-2 shadow-sm mb-2 transition-all',
                        state === 'running' && 'bg-teal-50 border-teal-500 animate-pulse dark:bg-teal-950/50 dark:border-teal-600',
                        state === 'complete' && 'bg-emerald-100 border-emerald-500 dark:bg-emerald-950/50 dark:border-emerald-600',
                        state === 'done' && 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700',
                        state === 'ready' && 'bg-white border-teal-300 hover:border-teal-500 dark:bg-slate-800 dark:border-teal-700 dark:hover:border-teal-500',
                        state === 'waiting' && 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                      )}
                    >
                      {state === 'running' ? (
                        <RefreshCw className="h-6 w-6 text-teal-600 dark:text-teal-400 animate-spin" />
                      ) : state === 'complete' || state === 'done' ? (
                        <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <StepIcon className={cn('h-6 w-6', state === 'ready' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400')} />
                      )}
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      state === 'running' && 'text-teal-600 dark:text-teal-400',
                      (state === 'complete' || state === 'done') && 'text-emerald-600 dark:text-emerald-400',
                      state === 'ready' && 'text-foreground',
                      state === 'waiting' && 'text-muted-foreground'
                    )}>
                      {index + 1}. {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{step.description}</span>

                    {/* Action Button */}
                    <div className="mt-3">
                      {step.key === 'ingest' && (
                        <Button
                          size="sm"
                          onClick={handleIngest}
                          disabled={isWorkflowRunning || ingest.isPending}
                          variant={state === 'ready' ? 'default' : 'outline'}
                        >
                          {workflowStage === 'ingesting' ? (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                              {ingestProgress ? (
                                ingestProgress.stage === 'discovering' ? 'Discovering...' :
                                ingestProgress.stage === 'validating' ? `Validating ${ingestProgress.current}/${ingestProgress.total}` :
                                ingestProgress.stage === 'describing' ? `Describing ${ingestProgress.current}/${ingestProgress.total}` :
                                ingestProgress.stage === 'saving' ? 'Saving...' :
                                `${ingestProgress.current}/${ingestProgress.total}`
                              ) : 'Starting...'}
                            </>
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" />
                              Ingest
                            </>
                          )}
                        </Button>
                      )}
                      {step.key === 'generate' && (
                        <Button
                          size="sm"
                          onClick={handleGenerate}
                          disabled={isWorkflowRunning || generate.isPending || counts.needs_ai === 0}
                          variant={counts.needs_ai > 0 ? 'default' : 'outline'}
                        >
                          {workflowStage === 'generating' ? (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                              {generationProgress ? `${generationProgress.current}/${generationProgress.total}` : '...'}
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-1 h-3 w-3" />
                              Generate ({counts.needs_ai})
                            </>
                          )}
                        </Button>
                      )}
                      {step.key === 'schedule' && (
                        <Button
                          size="sm"
                          onClick={handleSchedule}
                          disabled={isWorkflowRunning || schedule.isPending || counts.approved === 0}
                          variant={counts.approved > 0 ? 'default' : 'outline'}
                        >
                          {workflowStage === 'scheduling' ? (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Calendar className="mr-1 h-3 w-3" />
                              Schedule ({counts.approved})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Connector Arrow */}
                  {!isLast && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground/40 shrink-0 mx-2 hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ingest Progress Bar - Shows during ingest with filename */}
      {workflowStage === 'ingesting' && ingestProgress && ingestProgress.total > 0 && (
        <Card>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {ingestProgress.stage === 'discovering' && 'Discovering media files...'}
                {ingestProgress.stage === 'validating' && 'Validating media...'}
                {ingestProgress.stage === 'describing' && 'Generating image descriptions...'}
                {ingestProgress.stage === 'saving' && 'Saving to database...'}
              </span>
              <span className="font-medium">{ingestProgress.current}/{ingestProgress.total}</span>
            </div>
            <Progress value={(ingestProgress.current / ingestProgress.total) * 100} />
            {ingestProgress.file_name && (
              <p className="text-xs text-muted-foreground text-center truncate">
                Processing: {ingestProgress.file_name}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Open Approval Board - Prominent CTA */}
      <Card className={cn(
        'border-2 transition-all',
        counts.needs_review > 0
          ? 'border-teal-300 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-900/20 dark:to-cyan-900/20'
          : 'border-border'
      )}>
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl',
              counts.needs_review > 0 ? 'bg-teal-100 dark:bg-teal-900/50' : 'bg-slate-100 dark:bg-slate-800'
            )}>
              <Eye className={cn('h-6 w-6', counts.needs_review > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground')} />
            </div>
            <div>
              <h3 className="font-semibold">Approval Board</h3>
              <p className="text-sm text-muted-foreground">
                {counts.needs_review > 0
                  ? `${counts.needs_review} item${counts.needs_review !== 1 ? 's' : ''} waiting for review`
                  : 'No items pending review'}
              </p>
            </div>
          </div>
          <Button asChild size="lg" variant={counts.needs_review > 0 ? 'default' : 'outline'}>
            <Link to={`/batches/${client}/${batch}/approve`}>
              Open Board
              {counts.needs_review > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white/20">
                  {counts.needs_review}
                </Badge>
              )}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Scheduling Calendar - Shows when there are approved items */}
      {approvedItems.length > 0 && (
        <SchedulingCalendar
          clientSlug={client}
          batchSlug={batch}
          approvedItems={approvedItems}
          onScheduleSave={async (items) => {
            await scheduleItems.mutateAsync(items);
          }}
          isSaving={scheduleItems.isPending}
        />
      )}

      {/* Failed Items Alert */}
      {counts.failed > 0 && (
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50">
              <AlertCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-medium text-rose-700 dark:text-rose-300">
                {counts.failed} Failed Item{counts.failed !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/80">
                Check error messages in the approval board
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Instructions - Collapsible */}
      <Collapsible open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-violet-500" />
                  <div>
                    <CardTitle className="text-base">Batch Brief / AI Instructions</CardTitle>
                    <CardDescription>
                      {captionOverride ? 'Custom instructions set' : 'Using client defaults'}
                    </CardDescription>
                  </div>
                </div>
                {isInstructionsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {batchInstructions.isLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading instructions...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="caption-override">Batch Context / Brief</Label>
                    <Textarea
                      id="caption-override"
                      value={captionOverride}
                      onChange={(e) => setCaptionOverride(e.target.value)}
                      placeholder="Describe what this batch is about. For example:

• 'Promotional content for our summer sale event'
• 'Behind-the-scenes content from our course filming day'
• 'Product showcase for new menu items'"
                      className="min-h-[150px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      This overrides client-level instructions for items in this batch only.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCaptionOverride('')}
                      disabled={!captionOverride}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
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
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Batch Settings - Collapsible (v16.1) */}
      <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-slate-500" />
                  <div>
                    <CardTitle className="text-base">Batch Settings</CardTitle>
                    <CardDescription>
                      {(videoAiSetting === 'inherit' && photoAiSetting === 'inherit') ? 'Using client defaults' : 'Custom settings applied'}
                    </CardDescription>
                  </div>
                </div>
                {isSettingsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    Photo AI Captions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Override whether AI generates captions for photos in this batch.
                  </p>
                </div>
                <Select
                  value={photoAiSetting}
                  onValueChange={handlePhotoAiSettingChange}
                  disabled={updateBatch.isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Inherit from Client</SelectItem>
                    <SelectItem value="enabled">Generate AI Captions</SelectItem>
                    <SelectItem value="disabled">Manual Captions Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    Video AI Captions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Override whether AI generates captions for videos in this batch.
                  </p>
                </div>
                <Select
                  value={videoAiSetting}
                  onValueChange={handleVideoAiSettingChange}
                  disabled={updateBatch.isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Inherit from Client</SelectItem>
                    <SelectItem value="enabled">Generate AI Captions</SelectItem>
                    <SelectItem value="disabled">Manual Captions Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule Times (v17.8) - Format-specific posting times */}
              <div className="pt-4 border-t">
                <div className="mb-3">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Schedule Times
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set default posting times for each content format.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="photo-time" className="text-xs flex items-center gap-1.5">
                      <Image className="h-3.5 w-3.5" />
                      Photo Posts
                    </Label>
                    <Input
                      id="photo-time"
                      type="time"
                      value={photoTime}
                      onChange={(e) => handleScheduleTimeChange('photo', e.target.value)}
                      disabled={updateBatch.isPending}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video-time" className="text-xs flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5" />
                      Video/Reels
                    </Label>
                    <Input
                      id="video-time"
                      type="time"
                      value={videoTime}
                      onChange={(e) => handleScheduleTimeChange('video', e.target.value)}
                      disabled={updateBatch.isPending}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="story-time" className="text-xs flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5" />
                      Stories
                    </Label>
                    <Input
                      id="story-time"
                      type="time"
                      value={storyTime}
                      onChange={(e) => handleScheduleTimeChange('story', e.target.value)}
                      disabled={updateBatch.isPending}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Content Items - Always Visible List */}
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-teal-500 dark:text-teal-400" />
            <div>
              <CardTitle className="text-base">Content Items</CardTitle>
              <CardDescription>
                {counts.total} item{counts.total !== 1 ? 's' : ''} in this batch
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {contentItems.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading items...</span>
            </div>
          ) : contentItems.error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load items: {contentItems.error.message}
            </div>
          ) : !contentItems.data?.data?.items?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found. Run the Ingest workflow to scan media files.
            </div>
          ) : (
            <div className="space-y-3">
              {contentItems.data.data.items.map((item: ContentItem) => {
                const statusBadge = getStatusBadge(item.status);
                return (
                  <div
                    key={item.id || item.content_id}
                    className="rounded-lg border p-4 space-y-3 hover:border-teal-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Media type icon */}
                        <div className="mt-0.5">
                          {item.media_type === 'video' ? (
                            <Video className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Image className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* File name and status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">
                              {item.file_name || item.file || item.content_id}
                            </span>
                            <Badge variant={statusBadge.variant} className={statusBadge.className}>
                              {statusBadge.label}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.date && `Scheduled: ${item.date}`}
                            {item.slot && ` • ${item.slot}`}
                            {item.platforms && ` • ${item.platforms}`}
                          </div>

                          {/* Show image_description after W1 (NEEDS_AI), caption after W2 (NEEDS_REVIEW+) */}
                          {item.status === 'NEEDS_AI' && item.image_description && (
                            <div className="mt-2 p-2 rounded bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-sm">
                              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mb-1">
                                AI Description:
                              </p>
                              <p className="text-violet-900 dark:text-violet-100 whitespace-pre-wrap">
                                {item.image_description}
                              </p>
                            </div>
                          )}

                          {item.status !== 'NEEDS_AI' && (item.caption_ig || item.caption_override) && (
                            <div className="mt-2 p-2 rounded bg-muted/50 text-sm">
                              <p className="text-xs text-muted-foreground mb-1">Caption:</p>
                              <p className="whitespace-pre-wrap">
                                {item.caption_override || item.caption_ig || 'No caption'}
                              </p>
                            </div>
                          )}

                          {/* Error message if any */}
                          {item.error_message && (
                            <div className="mt-2 p-2 rounded bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300" role="alert">
                              <p className="text-xs font-medium mb-1">Error:</p>
                              <p>{sanitizeErrorMessage(item.error_message)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preview thumbnail */}
                      {(() => {
                        const thumbnailUrl = getVideoCoverUrl(item);
                        return thumbnailUrl ? (
                          <div className="shrink-0">
                            <img
                              src={thumbnailUrl}
                              alt={item.file_name || 'Preview'}
                              className="w-16 h-16 object-cover rounded-lg border"
                              loading="lazy"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="m21 15-5-5L5 21"/%3E%3C/svg%3E';
                                img.alt = 'Image unavailable';
                              }}
                            />
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
