import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useDeleteClient, useIsMounted } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/api/types';
import { getBatches } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { Trash2, Loader2, Instagram } from 'lucide-react';

interface ClientCardProps {
  client: Client;
}

// Get initials from client name (e.g., "Bento Ninja" -> "BN")
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ClientCard({ client }: ClientCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteClient = useDeleteClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track component mount state to prevent memory leaks
  const isMountedRef = useIsMounted();

  // Prefetch batches on hover for instant navigation feel
  const handleMouseEnter = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.batches.byClient(client.slug),
      queryFn: () => getBatches(client.slug),
      staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    });
  }, [queryClient, client.slug]);

  const handleDelete = async () => {
    try {
      await deleteClient.mutateAsync(client.slug);
      if (!isMountedRef.current) return;
      toast({
        title: 'Client deleted',
        description: `"${client.name}" has been permanently deleted.`,
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      if (!isMountedRef.current) return;
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete client',
        variant: 'destructive',
      });
    }
  };

  const hasInstagram = !!client.accounts?.instagram;
  const hasTiktok = !!client.accounts?.tiktok;
  const platformCount = [hasInstagram, hasTiktok].filter(Boolean).length;

  return (
    <Link to={`/clients/${client.slug}`} className="block" onMouseEnter={handleMouseEnter}>
      <Card variant="interactive" className="overflow-hidden group cursor-pointer">
        {/* Gradient Header with Initials */}
        <div className="h-20 bg-gradient-to-br from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-700 flex items-center justify-center relative">
          <span className="text-3xl font-bold text-white/90 tracking-tight">
            {getInitials(client.name)}
          </span>
          {/* Decorative circle */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>

        <CardContent className="p-4">
          {/* Client Info */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {client.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {client.slug}
            </p>
          </div>

          {/* Platform Badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {hasInstagram && (
              <Badge variant="instagram" className="gap-1 text-[11px]">
                <Instagram className="h-3 w-3" />
                {client.accounts?.instagram?.username}
              </Badge>
            )}
            {hasTiktok && (
              <Badge variant="tiktok" className="gap-1 text-[11px]">
                <span className="text-xs">TT</span>
                {client.accounts?.tiktok?.username}
              </Badge>
            )}
            {platformCount === 0 && (
              <Badge variant="secondary" className="text-[11px]">
                No platforms linked
              </Badge>
            )}
          </div>

          {/* Delete Action */}
          <div className="pt-3 border-t border-border/50">
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label={`Delete ${client.name}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Client</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{client.name}" and all associated data including batches, content items, and AI-generated captions. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteClient.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteClient.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
