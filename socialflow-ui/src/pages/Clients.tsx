import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useClients, useArchivedClients, useRestoreClient, useDeleteArchivedClient, useDeleteAllClients, useIsMounted } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import { ClientCard } from '@/components/ClientCard';
import { LoadingSpinner, ErrorAlert, EmptyState, PageHeader } from '@/components/shared';
import { Building2, Plus, Archive, ChevronDown, RotateCcw, Trash2, Loader2 } from 'lucide-react';

export default function Clients() {
  const clients = useClients();
  const archivedClients = useArchivedClients();
  const restoreClient = useRestoreClient();
  const deleteArchivedClient = useDeleteArchivedClient();
  const deleteAllClients = useDeleteAllClients();
  const { toast } = useToast();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  // Track component mount state to prevent memory leaks
  const isMountedRef = useIsMounted();

  const handleRestore = async (id: number, slug: string) => {
    setRestoringId(id);
    try {
      await restoreClient.mutateAsync(id);
      if (isMountedRef.current) {
        toast({
          title: 'Client restored',
          description: `${slug} has been restored from archive`,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Restore failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setRestoringId(null);
      }
    }
  };

  const handleDeleteArchived = async (id: number, slug: string) => {
    setDeletingId(id);
    try {
      await deleteArchivedClient.mutateAsync(id);
      if (isMountedRef.current) {
        toast({
          title: 'Client deleted',
          description: `${slug} has been permanently deleted from archive`,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Delete failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setDeletingId(null);
      }
    }
  };

  const handleDeleteAll = async () => {
    try {
      const result = await deleteAllClients.mutateAsync();
      if (!isMountedRef.current) return;
      toast({
        title: 'All clients deleted',
        description: `${result.deleted} client${result.deleted !== 1 ? 's' : ''} permanently deleted.`,
      });
      setIsDeleteAllDialogOpen(false);
    } catch (error) {
      if (!isMountedRef.current) return;
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete clients',
        variant: 'destructive',
      });
    }
  };

  if (clients.isLoading) {
    return <LoadingSpinner text="Loading clients..." />;
  }

  if (clients.error) {
    return (
      <ErrorAlert
        message={clients.error.message}
        onRetry={() => clients.refetch()}
      />
    );
  }

  const clientList = clients.data?.data || [];
  const archivedList = archivedClients.data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={`${clientList.length} client${clientList.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Clients' },
        ]}
        actions={
          <div className="flex gap-2">
            {clientList.length > 0 && (
              <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Clients</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete ALL {clientList.length} client{clientList.length !== 1 ? 's' : ''} and all associated data including batches, content items, captions, and configurations. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      disabled={deleteAllClients.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteAllClients.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        `Delete All ${clientList.length} Client${clientList.length !== 1 ? 's' : ''}`
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button asChild>
              <Link to="/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                New Client
              </Link>
            </Button>
          </div>
        }
      />

      {clientList.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Create your first client to get started with content automation"
          action={
            <Button asChild>
              <Link to="/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Client
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clientList.map((client) => (
            <ClientCard key={client.slug} client={client} />
          ))}
        </div>
      )}

      {/* Archive Section */}
      {archivedList.length > 0 && (
        <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    Archive ({archivedList.length})
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${archiveOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {archivedList.map((archived) => (
                    <div
                      key={archived.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">{archived.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {archived.slug} • Archived {new Date(archived.archived_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {archived.batch_count} batches • {archived.item_count} items
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(archived.id, archived.slug)}
                          disabled={restoringId === archived.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          {restoringId === archived.id ? 'Restoring...' : 'Restore'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={deletingId === archived.id}
                              aria-label={`Delete ${archived.name}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{archived.name}" from the archive.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteArchived(archived.id, archived.slug)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
