import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAccounts, useSyncAccounts, useClients } from '@/hooks';
import { AccountCard } from '@/components/AccountCard';
import { LoadingSpinner, ErrorAlert, EmptyState, PageHeader } from '@/components/shared';
import { Users, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Accounts() {
  const accounts = useAccounts();
  const clients = useClients();
  const syncAccounts = useSyncAccounts();
  const { toast } = useToast();

  // Track component mount state to prevent memory leaks
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  if (accounts.isLoading) {
    return <LoadingSpinner text="Loading accounts..." />;
  }

  if (accounts.error) {
    return (
      <ErrorAlert
        message={accounts.error.message}
        onRetry={() => accounts.refetch()}
      />
    );
  }

  const accountList = accounts.data?.data?.accounts || [];
  const syncedAt = accounts.data?.data?.synced_at;

  // Build account ID -> client slug map
  const accountToClient: Record<string, string> = {};
  (clients.data?.data || []).forEach((client) => {
    if (client.accounts?.instagram?.late_account_id) {
      accountToClient[client.accounts.instagram.late_account_id] = client.name;
    }
    if (client.accounts?.tiktok?.late_account_id) {
      accountToClient[client.accounts.tiktok.late_account_id] = client.name;
    }
  });

  const instagramAccounts = accountList.filter((a) => a.platform === 'instagram');
  const tiktokAccounts = accountList.filter((a) => a.platform === 'tiktok');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Late Accounts"
        description={
          syncedAt
            ? `Last synced: ${format(new Date(syncedAt), "MMM d, yyyy 'at' h:mm a")}`
            : undefined
        }
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Accounts' },
        ]}
        actions={
          <Button onClick={handleSync} disabled={syncAccounts.isPending}>
            {syncAccounts.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Now
          </Button>
        }
      />

      {accountList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No accounts found"
          description="Sync with Late.com to see your connected accounts"
          action={
            <Button onClick={handleSync} disabled={syncAccounts.isPending}>
              Sync Accounts
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {instagramAccounts.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <span>📷</span>
                Instagram ({instagramAccounts.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {instagramAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    linkedClient={accountToClient[account.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {tiktokAccounts.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <span>🎵</span>
                TikTok ({tiktokAccounts.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {tiktokAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    linkedClient={accountToClient[account.id]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
