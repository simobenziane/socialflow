import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import { StatusDot, type ContentStatus } from '@/components/ui/status-indicator';
import { useClients, useAccounts, useSyncAccounts, useStats, useIsMounted } from '@/hooks';
import { LoadingSpinner, ErrorAlert, PageHeader } from '@/components/shared';
import {
  Building2,
  Users,
  AlertTriangle,
  Plus,
  RefreshCw,
  ExternalLink,
  FileImage,
  Sparkles,
  Eye,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { EXTERNAL_URLS } from '@/config/constants';

// Pipeline status configuration
const PIPELINE_STEPS: {
  key: keyof typeof contentStatsKeys;
  label: string;
  status: ContentStatus;
}[] = [
  { key: 'pending', label: 'Pending', status: 'PENDING' },
  { key: 'needs_ai', label: 'AI', status: 'NEEDS_AI' },
  { key: 'needs_review', label: 'Review', status: 'NEEDS_REVIEW' },
  { key: 'approved', label: 'Approved', status: 'APPROVED' },
  { key: 'scheduled', label: 'Scheduled', status: 'SCHEDULED' },
];

const contentStatsKeys = {
  pending: 0,
  needs_ai: 0,
  needs_review: 0,
  approved: 0,
  scheduled: 0,
  failed: 0,
  total: 0,
};

export default function Dashboard() {
  const clients = useClients();
  const accounts = useAccounts();
  const stats = useStats();
  const syncAccounts = useSyncAccounts();
  const { toast } = useToast();

  // Track component mount state to prevent memory leaks
  const isMountedRef = useIsMounted();

  const handleSync = async () => {
    try {
      await syncAccounts.mutateAsync();
      if (isMountedRef.current) {
        toast({
          title: 'Sync started',
          description: 'Account sync is running. Data will refresh shortly.',
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Sync failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    }
  };

  // Get account list early - must be before useMemo to satisfy hook rules
  const accountList = accounts.data?.data?.accounts || [];

  // Single-pass filtering - O(n) instead of O(3n) for 3 separate filter calls
  const { healthyCount, warningAccounts, expiredAccounts } = useMemo(() => {
    let healthy = 0;
    const warning: typeof accountList = [];
    const expired: typeof accountList = [];

    for (const account of accountList) {
      switch (account.health) {
        case 'healthy':
          healthy++;
          break;
        case 'warning':
          warning.push(account);
          break;
        case 'expired':
          expired.push(account);
          break;
      }
    }

    return {
      healthyCount: healthy,
      warningAccounts: warning,
      expiredAccounts: expired,
    };
  }, [accountList]);

  if (clients.isLoading || accounts.isLoading || stats.isLoading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (clients.error || accounts.error || stats.error) {
    return (
      <ErrorAlert
        message={clients.error?.message || accounts.error?.message || stats.error?.message || 'Failed to load'}
        onRetry={() => {
          clients.refetch();
          accounts.refetch();
          stats.refetch();
        }}
      />
    );
  }

  const clientCount = stats.data?.data?.clients ?? clients.data?.data?.length ?? 0;
  const batchCount = stats.data?.data?.batches ?? 0;
  const contentStats = stats.data?.data?.content_items ?? contentStatsKeys;
  const alertCount = warningAccounts.length + expiredAccounts.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        gradient
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clients.refetch();
              accounts.refetch();
              stats.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Hero Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Primary Stat - Clients with gradient */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-700 text-white border-0 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Clients</CardTitle>
            <Building2 className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{clientCount}</div>
            <p className="text-sm text-white/80 mt-1">active clients</p>
          </CardContent>
        </Card>

        {/* Secondary Stats */}
        <Card variant="elevated" className="group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Batches</CardTitle>
            <FileImage className="h-5 w-5 text-teal-500 dark:text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{batchCount}</div>
            <p className="text-xs text-muted-foreground mt-1">content batches</p>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Content</CardTitle>
            <Sparkles className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contentStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">total items</p>
          </CardContent>
        </Card>

        <Card variant={alertCount > 0 ? "elevated" : "default"} className={cn(alertCount > 0 && "border-amber-200 dark:border-amber-800")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alerts</CardTitle>
            <AlertTriangle className={cn("h-5 w-5", alertCount > 0 ? "text-amber-500" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", alertCount > 0 && "text-amber-600 dark:text-amber-400")}>
              {alertCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Pipeline - Visual Flow */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight">Content Pipeline</h2>
          <Badge variant="secondary" className="text-xs">
            {contentStats.total} total items
          </Badge>
        </div>

        {/* Pipeline Steps */}
        <div className="flex items-center justify-between gap-2">
          {PIPELINE_STEPS.map((step, index) => {
            const count = contentStats[step.key] ?? 0;
            const isLast = index === PIPELINE_STEPS.length - 1;

            return (
              <div key={step.key} className="flex items-center flex-1">
                {/* Step Node */}
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-card border-2 border-border shadow-sm mb-2">
                    <StatusDot status={step.status} size="lg" />
                  </div>
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-xs text-muted-foreground">{step.label}</span>
                </div>

                {/* Connector Arrow */}
                {!isLast && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mx-1" />
                )}
              </div>
            );
          })}

          {/* Failed indicator */}
          {contentStats.failed > 0 && (
            <div className="flex flex-col items-center ml-4 pl-4 border-l border-border">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-200 dark:border-rose-800 shadow-sm mb-2">
                <StatusDot status="FAILED" size="lg" />
              </div>
              <span className="text-2xl font-bold text-rose-600">{contentStats.failed}</span>
              <span className="text-xs text-muted-foreground">Failed</span>
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Health */}
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Account Health</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {accountList.length} connected accounts
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncAccounts.isPending}
            >
              {syncAccounts.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Health Summary */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="approved" className="gap-1.5">
                  <Check className="h-3 w-3" />
                  {healthyCount} healthy
                </Badge>
                {warningAccounts.length > 0 && (
                  <Badge variant="needsReview" className="gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    {warningAccounts.length} warning
                  </Badge>
                )}
                {expiredAccounts.length > 0 && (
                  <Badge variant="failed" className="gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    {expiredAccounts.length} expired
                  </Badge>
                )}
              </div>

              {/* Problem Accounts */}
              {(warningAccounts.length > 0 || expiredAccounts.length > 0) && (
                <div className="space-y-2">
                  {expiredAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-2 text-sm bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 p-3 rounded-lg border border-rose-200 dark:border-rose-800"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{account.username}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {account.platform}
                      </Badge>
                      <span className="text-rose-600 dark:text-rose-400 ml-auto">Token expired</span>
                    </div>
                  ))}
                  {warningAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 p-3 rounded-lg border border-amber-200 dark:border-amber-800"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{account.username}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {account.platform}
                      </Badge>
                      <span className="text-amber-600 dark:text-amber-400 ml-auto">
                        Expires in {account.days_until_expiry} day{account.days_until_expiry !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {warningAccounts.length === 0 && expiredAccounts.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  All accounts are healthy. No action needed.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & External Links */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg" className="w-full justify-start">
                <Link to="/clients/new">
                  <Plus className="mr-2 h-5 w-5" />
                  New Client
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="w-full justify-start">
                <Link to="/accounts">
                  <Users className="mr-2 h-5 w-5" />
                  View Accounts
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="w-full justify-start">
                <Link to="/clients">
                  <Building2 className="mr-2 h-5 w-5" />
                  View Clients
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="w-full justify-start">
                <Link to="/settings">
                  <Eye className="mr-2 h-5 w-5" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* External Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">External Tools</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <a href={EXTERNAL_URLS.N8N_DASHBOARD} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  n8n Dashboard
                </a>
              </Button>
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <a href={EXTERNAL_URLS.LATE_APP} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Late.com
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
