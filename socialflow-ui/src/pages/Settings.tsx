import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GlassPanel } from '@/components/ui/glass-panel';
import { useSettings, useUpdateSettings, useIsMounted, useAccounts, useSyncAccounts } from '@/hooks';
import { PageHeader, LoadingSpinner, ErrorAlert } from '@/components/shared';
import { testCloudflareUrl } from '@/api/client';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Cloud,
  Bot,
  FolderOpen,
  Save,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Sparkles,
  Eye,
  MessageSquare,
  ChevronDown,
  Settings as SettingsIcon,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Available models for selection
const VISUAL_MODELS = [
  { value: 'llava:7b', label: 'LLaVA 7B (Recommended)', description: 'Best quality image understanding' },
  { value: 'qwen3-vl:4b', label: 'Qwen3-VL 4B', description: 'Faster, good quality' },
  { value: 'qwen3-vl:8b', label: 'Qwen3-VL 8B', description: 'Higher quality, slower' },
];

const TEXT_MODELS = [
  { value: 'llama3.2:3b', label: 'Llama 3.2 3B (Recommended)', description: 'Fast and efficient' },
  { value: 'gemma3:4b', label: 'Gemma 3 4B', description: 'Good balance of speed and quality' },
];

export default function Settings() {
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useSettings();
  const syncAccounts = useSyncAccounts();
  const [isPurging, setIsPurging] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Late.com integration (v16.10) - credential is in n8n, just need sync
  const accounts = useAccounts();
  const [isLateOpen, setIsLateOpen] = useState(true);

  // Collapsible section states - Late and Cloudflare open by default
  const [isCloudflareOpen, setIsCloudflareOpen] = useState(false);
  const [isAiProviderOpen, setIsAiProviderOpen] = useState(false);
  const [isOllamaModelsOpen, setIsOllamaModelsOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateSettings = useUpdateSettings({
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Your configuration has been updated successfully',
      });
      setIsDirty(false);
    },
    onError: (err) => {
      toast({
        title: 'Error saving settings',
        description: err.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  // Track component mount state to prevent memory leaks
  const isMountedRef = useIsMounted();

  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state - Basic
  const [cloudflareUrl, setCloudflareUrl] = useState('');
  const [aiProvider, setAiProvider] = useState('ollama');
  const [ollamaTimeout, setOllamaTimeout] = useState(600000);

  // Form state - Visual LLM
  const [imageDescriberModel, setImageDescriberModel] = useState('llava:7b');

  // Form state - Text LLM
  const [captionGeneratorModel, setCaptionGeneratorModel] = useState('llama3.2:3b');
  const [captionSupervisorModel, setCaptionSupervisorModel] = useState('llama3.2:3b');
  const [configGeneratorModel, setConfigGeneratorModel] = useState('llama3.2:3b');

  // Form state - Gemini
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form with loaded data (API returns data in 'data' field)
  const settings = data?.data;

  useEffect(() => {
    if (settings) {
      setCloudflareUrl(settings.cloudflare_tunnel_url || '');
      setAiProvider(settings.ai_provider || 'ollama');
      setOllamaTimeout(settings.ollama?.timeout_ms || 600000);

      // Visual LLM
      setImageDescriberModel(settings.ollama?.models?.image_describer || settings.ollama?.model || 'llava:7b');

      // Text LLMs
      setCaptionGeneratorModel(settings.ollama?.models?.caption_generator || 'llama3.2:3b');
      setCaptionSupervisorModel(settings.ollama?.models?.caption_supervisor || 'llama3.2:3b');
      setConfigGeneratorModel(settings.ollama?.models?.config_generator || 'llama3.2:3b');

      // Gemini
      setGeminiApiKey(settings.gemini?.api_key || '');
      setGeminiModel(settings.gemini?.model || 'gemini-2.5-flash');

      setIsDirty(false);
    }
  }, [settings]);

  // Handle field changes with dirty tracking
  const handleCloudflareUrlChange = (value: string) => {
    setCloudflareUrl(value);
    setIsDirty(true);
    setTestResult(null);
    if (errors.cloudflareUrl) {
      setErrors((prev) => ({ ...prev, cloudflareUrl: '' }));
    }
  };

  // Test Cloudflare connection - uses form input URL, not saved URL
  const handleTestConnection = async () => {
    const urlToTest = cloudflareUrl.trim();
    if (!urlToTest) {
      setTestResult({ success: false, message: 'Please enter a Cloudflare tunnel URL' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Use centralized tunnel testing function (15s timeout, handles CORS fallback)
      const result = await testCloudflareUrl(urlToTest);

      if (isMountedRef.current) {
        setTestResult({
          success: result.success,
          message: result.message,
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Connection failed';
        setTestResult({
          success: false,
          message: `Test failed: ${message}`,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsTesting(false);
      }
    }
  };

  const handleAiProviderChange = (value: string) => {
    setAiProvider(value);
    setIsDirty(true);
  };

  const handleOllamaTimeoutChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setOllamaTimeout(isNaN(numValue) ? 0 : numValue);
    setIsDirty(true);
    if (errors.ollamaTimeout) {
      setErrors((prev) => ({ ...prev, ollamaTimeout: '' }));
    }
  };

  const handleGeminiApiKeyChange = (value: string) => {
    setGeminiApiKey(value);
    setIsDirty(true);
    if (errors.geminiApiKey) {
      setErrors((prev) => ({ ...prev, geminiApiKey: '' }));
    }
  };

  const handleGeminiModelChange = (value: string) => {
    setGeminiModel(value);
    setIsDirty(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!cloudflareUrl.trim()) {
      newErrors.cloudflareUrl = 'Cloudflare tunnel URL is required';
    } else {
      try {
        new URL(cloudflareUrl);
      } catch {
        newErrors.cloudflareUrl = 'Please enter a valid URL';
      }
    }

    if (aiProvider === 'ollama') {
      if (ollamaTimeout < 1000) {
        newErrors.ollamaTimeout = 'Timeout must be at least 1000ms';
      } else if (ollamaTimeout > 600000) {
        newErrors.ollamaTimeout = 'Timeout cannot exceed 600000ms';
      }
    } else if (aiProvider === 'gemini') {
      if (!geminiApiKey.trim()) {
        newErrors.geminiApiKey = 'Gemini API key is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        variant: 'destructive',
      });
      return;
    }

    // Mutation callbacks handle success/error toasts
    updateSettings.mutate({
      cloudflare_tunnel_url: cloudflareUrl.trim(),
      ai_provider: aiProvider as 'ollama' | 'gemini',
      ollama: {
        model: imageDescriberModel, // Legacy fallback
        models: {
          image_describer: imageDescriberModel,
          caption_generator: captionGeneratorModel,
          caption_supervisor: captionSupervisorModel,
          config_generator: configGeneratorModel,
        },
        timeout_ms: ollamaTimeout,
      },
      gemini: {
        api_key: geminiApiKey.trim(),
        model: geminiModel,
        timeout_ms: 60000,
      },
    });
  };

  // Handle purge and resync
  const handlePurgeAndSync = async () => {
    setIsPurging(true);
    try {
      await syncAccounts.mutateAsync();
      toast({
        title: 'Cache refreshed',
        description: 'Account data has been re-synced from Late.com',
      });
    } catch (err) {
      toast({
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Failed to refresh cache',
        variant: 'destructive',
      });
    } finally {
      if (isMountedRef.current) setIsPurging(false);
    }
  };

  // Handle Late.com sync
  const handleLateSync = async () => {
    try {
      const result = await syncAccounts.mutateAsync();
      if (result.success) {
        toast({
          title: 'Sync complete',
          description: `${result.summary?.profiles_synced || 0} profiles, ${result.summary?.accounts_synced || 0} accounts`,
        });
      } else {
        toast({
          title: 'Sync failed',
          description: result.error || 'Failed to sync',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Failed to sync',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading settings..." />;

  if (error) {
    return (
      <ErrorAlert
        message={`Failed to load settings: ${error.message}`}
        onRetry={() => refetch()}
      />
    );
  }

  const dockerBasePath = settings?.paths?.docker_base || '/data/clients/';
  const savedCloudflareUrl = settings?.cloudflare_tunnel_url || '';
  const savedAiProvider = settings?.ai_provider || 'ollama';
  const isCloudflareValid = savedCloudflareUrl.startsWith('https://') && !savedCloudflareUrl.includes('PASTE-YOUR');
  const isAiConfigured = savedAiProvider === 'gemini' ? !!settings?.gemini?.api_key : !!settings?.ollama?.models?.image_describer || !!settings?.ollama?.model;

  // Late.com status derived from accounts cache
  const lateProfiles = accounts.data?.data?.profiles || [];
  const lateAccountsList = accounts.data?.data?.accounts || [];
  const lateSyncedAt = accounts.data?.data?.synced_at;
  const isLateConfigured = lateProfiles.length > 0 || !!lateSyncedAt;

  // Helper component for collapsible section header
  const SectionHeader = ({
    icon: Icon,
    title,
    description,
    badge,
    isOpen,
    iconColor,
  }: {
    icon: typeof Cloud;
    title: string;
    description: string;
    badge?: React.ReactNode;
    isOpen: boolean;
    iconColor?: string;
  }) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          iconColor || 'bg-teal-50 dark:bg-teal-900/30'
        )}>
          <Icon className={cn('h-5 w-5', iconColor ? '' : 'text-teal-600 dark:text-teal-400')} />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{title}</span>
            {badge}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronDown className={cn(
        'h-5 w-5 text-muted-foreground transition-transform duration-200',
        isOpen && 'rotate-180'
      )} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      <PageHeader
        title="Settings"
        gradient
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Settings' }]}
        actions={
          <Button onClick={handleSave} disabled={updateSettings.isPending || !isDirty} data-testid="save-button">
            {updateSettings.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        }
      />

      {/* Configuration Status Hero */}
      <GlassPanel className="p-6" data-testid="current-config-section">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
            <SettingsIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Configuration Status</h2>
            <p className="text-sm text-muted-foreground">Current saved configuration</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Late.com Status */}
          <div className={cn(
            'flex items-start gap-3 p-4 rounded-xl border transition-colors',
            isLateConfigured
              ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50/50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
          )}>
            <div className={cn(
              'p-2 rounded-full',
              isLateConfigured ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-rose-100 dark:bg-rose-900/50'
            )}>
              {isLateConfigured ? (
                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Late.com</span>
                <Badge variant={isLateConfigured ? 'approved' : 'failed'}>
                  {isLateConfigured ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
              {isLateConfigured ? (
                <p className="text-xs text-muted-foreground">
                  {lateProfiles.length} profiles, {lateAccountsList.length} accounts
                  {lateSyncedAt && ` • Synced ${new Date(lateSyncedAt).toLocaleDateString()}`}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Click Sync below</p>
              )}
            </div>
          </div>

          {/* Cloudflare Status */}
          <div className={cn(
            'flex items-start gap-3 p-4 rounded-xl border transition-colors',
            isCloudflareValid
              ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700'
              : 'bg-rose-50/50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
          )}>
            <div className={cn(
              'p-2 rounded-full',
              isCloudflareValid ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-rose-100 dark:bg-rose-900/50'
            )}>
              {isCloudflareValid ? (
                <Cloud className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Cloudflare Tunnel</span>
                <Badge variant={isCloudflareValid ? 'secondary' : 'failed'}>
                  {isCloudflareValid ? 'Configured' : 'Not Set'}
                </Badge>
              </div>
              {isCloudflareValid ? (
                <p className="text-xs font-mono text-muted-foreground break-all line-clamp-1">
                  {savedCloudflareUrl}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Configure tunnel URL below</p>
              )}
            </div>
          </div>

          {/* AI Provider Status */}
          <div className={cn(
            'flex items-start gap-3 p-4 rounded-xl border transition-colors',
            isAiConfigured
              ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50/50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
          )}>
            <div className={cn(
              'p-2 rounded-full',
              isAiConfigured ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-rose-100 dark:bg-rose-900/50'
            )}>
              {isAiConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">AI Provider</span>
                <Badge variant={isAiConfigured ? 'approved' : 'failed'}>
                  {isAiConfigured ? (savedAiProvider === 'gemini' ? 'Gemini' : 'Ollama') : 'Not Set'}
                </Badge>
              </div>
              {isAiConfigured ? (
                <p className="text-xs text-muted-foreground">
                  {savedAiProvider === 'gemini'
                    ? settings?.gemini?.model || 'gemini-2.5-flash'
                    : `${settings?.ollama?.models?.image_describer || 'llava:7b'} + ${settings?.ollama?.models?.caption_generator || 'llama3.2:3b'}`}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Configure AI settings below</p>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {/* Late.com Integration */}
        <Collapsible open={isLateOpen} onOpenChange={setIsLateOpen}>
          <Card variant="elevated" className="overflow-hidden" data-testid="late-section">
            <CollapsibleTrigger asChild>
              <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                <SectionHeader
                  icon={Calendar}
                  title="Late.com Integration"
                  description="Connect your Late.com account for scheduling"
                  badge={isLateConfigured && <Badge variant="approved" className="text-[10px]">Connected</Badge>}
                  isOpen={isLateOpen}
                  iconColor="bg-orange-50 dark:bg-orange-900/30"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4 space-y-4 border-t">
                <div className="space-y-4 pt-4">
                  {/* Status display */}
                  <div className={cn(
                    'flex items-center justify-between p-4 rounded-xl border',
                    isLateConfigured
                      ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700'
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-full',
                        isLateConfigured ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-800/50'
                      )}>
                        {isLateConfigured ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className={cn(
                          'font-medium',
                          isLateConfigured ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
                        )}>
                          {isLateConfigured ? 'Late.com Connected' : 'Click Sync to fetch profiles'}
                        </p>
                        <p className={cn(
                          'text-sm',
                          isLateConfigured ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-slate-500 dark:text-slate-400'
                        )}>
                          {isLateConfigured ? (
                            <>
                              {lateProfiles.length} profiles, {lateAccountsList.length} accounts
                              {lateSyncedAt && ` • Synced: ${new Date(lateSyncedAt).toLocaleString()}`}
                            </>
                          ) : (
                            'n8n credential is configured - sync to load profiles'
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleLateSync}
                      disabled={syncAccounts.isPending}
                      data-testid="late-sync-button"
                    >
                      {syncAccounts.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Sync Profiles
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Syncs profiles and accounts from Late.com using the n8n credential. Profiles are used when creating clients.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Cloudflare Integration */}
        <Collapsible open={isCloudflareOpen} onOpenChange={setIsCloudflareOpen}>
          <Card variant="elevated" className="overflow-hidden" data-testid="cloudflare-section">
            <CollapsibleTrigger asChild>
              <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                <SectionHeader
                  icon={Cloud}
                  title="Cloudflare Integration"
                  description="Configure your tunnel for media hosting"
                  badge={isCloudflareValid && <Badge variant="approved" className="text-[10px]">Active</Badge>}
                  isOpen={isCloudflareOpen}
                  iconColor="bg-sky-50 dark:bg-sky-900/30"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4 space-y-4 border-t">
                <div className="space-y-2 pt-4">
                  <Label htmlFor="cloudflareUrl">Tunnel URL *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cloudflareUrl"
                      type="url"
                      value={cloudflareUrl}
                      onChange={(e) => handleCloudflareUrlChange(e.target.value)}
                      placeholder="https://abc-xyz.trycloudflare.com"
                      className="flex-1"
                      data-testid="cloudflare-url-input"
                    />
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTesting || !cloudflareUrl.trim()}
                      data-testid="test-cloudflare-button"
                    >
                      {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
                      Test
                    </Button>
                  </div>
                  {testResult && (
                    <div className={cn(
                      'flex items-center gap-2 p-3 rounded-lg text-sm',
                      testResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    )}>
                      {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                  {errors.cloudflareUrl ? (
                    <p className="text-sm text-destructive" role="alert" aria-live="assertive">{errors.cloudflareUrl}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Update this URL after starting your Cloudflare tunnel each session</p>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* AI Provider Selection */}
        <Collapsible open={isAiProviderOpen} onOpenChange={setIsAiProviderOpen}>
          <Card variant="elevated" className="overflow-hidden" data-testid="ai-provider-section">
            <CollapsibleTrigger asChild>
              <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                <SectionHeader
                  icon={Bot}
                  title="AI Provider"
                  description="Choose between local Ollama or cloud Gemini"
                  badge={<Badge variant="secondary" className="text-[10px]">{aiProvider === 'gemini' ? 'Gemini' : 'Ollama'}</Badge>}
                  isOpen={isAiProviderOpen}
                  iconColor="bg-violet-50 dark:bg-violet-900/30"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4 space-y-4 border-t">
                <div className="space-y-3 pt-4">
                  <Label id="ai-provider-label">Select Provider</Label>
                  <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="ai-provider-label">
                    {/* Ollama Option */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={aiProvider === 'ollama'}
                      onClick={() => handleAiProviderChange('ollama')}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
                        aiProvider === 'ollama'
                          ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20'
                          : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg',
                        aiProvider === 'ollama' ? 'bg-teal-100 dark:bg-teal-900/50' : 'bg-muted'
                      )}>
                        <Bot className={cn('h-5 w-5', aiProvider === 'ollama' ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground')} />
                      </div>
                      <div>
                        <p className="font-medium">Ollama (Local)</p>
                        <p className="text-xs text-muted-foreground">Privacy-first, runs locally on your machine</p>
                      </div>
                    </button>

                    {/* Gemini Option */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={aiProvider === 'gemini'}
                      onClick={() => handleAiProviderChange('gemini')}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
                        aiProvider === 'gemini'
                          ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20'
                          : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg',
                        aiProvider === 'gemini' ? 'bg-teal-100 dark:bg-teal-900/50' : 'bg-muted'
                      )}>
                        <Sparkles className={cn('h-5 w-5', aiProvider === 'gemini' ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground')} />
                      </div>
                      <div>
                        <p className="font-medium">Google Gemini</p>
                        <p className="text-xs text-muted-foreground">Cloud API, 1,500 free requests/day</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Gemini API Key (shown when Gemini selected) */}
                {aiProvider === 'gemini' && (
                  <div className="grid gap-4 md:grid-cols-2 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="geminiApiKey">API Key *</Label>
                      <Input
                        id="geminiApiKey"
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => handleGeminiApiKeyChange(e.target.value)}
                        placeholder="AIzaSy..."
                        data-testid="gemini-api-key-input"
                      />
                      {errors.geminiApiKey && <p className="text-sm text-destructive" role="alert" aria-live="assertive">{errors.geminiApiKey}</p>}
                      <p className="text-xs text-muted-foreground">
                        Get your key at{' '}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">
                          Google AI Studio
                        </a>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="geminiModel">Model</Label>
                      <Select value={geminiModel} onValueChange={handleGeminiModelChange}>
                        <SelectTrigger id="geminiModel" data-testid="gemini-model-select">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</SelectItem>
                          <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                          <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Ollama Models Configuration (only shown when Ollama is selected) */}
        {aiProvider === 'ollama' && (
          <Collapsible open={isOllamaModelsOpen} onOpenChange={setIsOllamaModelsOpen}>
            <Card variant="elevated" className="overflow-hidden" data-testid="ollama-models-section">
              <CollapsibleTrigger asChild>
                <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                  <SectionHeader
                    icon={MessageSquare}
                    title="Ollama Models"
                    description="Configure models for each AI task"
                    isOpen={isOllamaModelsOpen}
                    iconColor="bg-purple-50 dark:bg-purple-900/30"
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 border-t">
                  <div className="space-y-6 pt-4">
                    {/* Visual LLM */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-sky-600" />
                        <Label className="text-sm font-medium">Visual LLM (Image Understanding)</Label>
                      </div>
                      <Select
                        value={imageDescriberModel}
                        onValueChange={(value) => { setImageDescriberModel(value); setIsDirty(true); }}
                      >
                        <SelectTrigger data-testid="image-describer-select">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {VISUAL_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              <div className="flex flex-col">
                                <span>{model.label}</span>
                                <span className="text-xs text-muted-foreground">{model.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Used in W1 to analyze photos and create descriptions</p>
                    </div>

                    {/* Text LLMs - 3 columns on desktop */}
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Caption Generator */}
                      <div className="space-y-2">
                        <Label htmlFor="captionGeneratorModel" className="text-sm">Caption Generator</Label>
                        <Select
                          value={captionGeneratorModel}
                          onValueChange={(value) => { setCaptionGeneratorModel(value); setIsDirty(true); }}
                        >
                          <SelectTrigger id="captionGeneratorModel" data-testid="caption-generator-select">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEXT_MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Creates captions</p>
                      </div>

                      {/* Caption Supervisor */}
                      <div className="space-y-2">
                        <Label htmlFor="captionSupervisorModel" className="text-sm">Caption Supervisor</Label>
                        <Select
                          value={captionSupervisorModel}
                          onValueChange={(value) => { setCaptionSupervisorModel(value); setIsDirty(true); }}
                        >
                          <SelectTrigger id="captionSupervisorModel" data-testid="caption-supervisor-select">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEXT_MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Reviews quality</p>
                      </div>

                      {/* Config Generator */}
                      <div className="space-y-2">
                        <Label htmlFor="configGeneratorModel" className="text-sm">Config Generator</Label>
                        <Select
                          value={configGeneratorModel}
                          onValueChange={(value) => { setConfigGeneratorModel(value); setIsDirty(true); }}
                        >
                          <SelectTrigger id="configGeneratorModel" data-testid="config-generator-select">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEXT_MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Client configs</p>
                      </div>
                    </div>

                    {/* Timeout Setting */}
                    <div className="space-y-2 max-w-xs">
                      <Label htmlFor="ollamaTimeout">API Timeout (ms)</Label>
                      <Input
                        id="ollamaTimeout"
                        type="number"
                        value={ollamaTimeout}
                        onChange={(e) => handleOllamaTimeoutChange(e.target.value)}
                        min={1000}
                        max={600000}
                        data-testid="ollama-timeout-input"
                      />
                      {errors.ollamaTimeout ? (
                        <p className="text-sm text-destructive">{errors.ollamaTimeout}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">1,000 - 600,000 ms (10 min max)</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Advanced Settings */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <Card variant="elevated" className="overflow-hidden" data-testid="advanced-section">
            <CollapsibleTrigger asChild>
              <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                <SectionHeader
                  icon={FolderOpen}
                  title="Advanced Settings"
                  description="Infrastructure and cache management"
                  isOpen={isAdvancedOpen}
                  iconColor="bg-slate-100 dark:bg-slate-800"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4 border-t">
                <div className="space-y-6 pt-4">
                  {/* Infrastructure */}
                  <div className="space-y-2">
                    <Label htmlFor="dockerBasePath">Docker Base Path</Label>
                    <Input
                      id="dockerBasePath"
                      value={dockerBasePath}
                      readOnly
                      disabled
                      className="bg-muted font-mono text-sm"
                      data-testid="docker-base-path-input"
                    />
                    <p className="text-xs text-muted-foreground">Base path where client folders are mounted in Docker</p>
                  </div>

                  {/* Cache Management */}
                  <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50">
                        <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-rose-700 dark:text-rose-300">Cache Management</h4>
                        <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mt-1 mb-3">
                          If account data appears stale, purge the cache to fetch fresh data from Late.com.
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handlePurgeAndSync}
                          disabled={isPurging}
                          data-testid="purge-cache-button"
                        >
                          {isPurging ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Purge Cache & Resync
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}
