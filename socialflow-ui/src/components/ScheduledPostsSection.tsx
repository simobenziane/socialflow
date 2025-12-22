import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useScheduledPosts, useSyncScheduledPosts } from '@/hooks';
import { RefreshCw, Calendar, ChevronDown, ExternalLink } from 'lucide-react';
import { ScheduledPostCard } from './ScheduledPostCard';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface ScheduledPostsSectionProps {
  slug: string;
  profileId?: string;
}

export function ScheduledPostsSection({ slug, profileId }: ScheduledPostsSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const posts = useScheduledPosts(slug);
  const syncPosts = useSyncScheduledPosts(slug);

  // Don't show section if no profile linked
  if (!profileId) {
    return null;
  }

  const postsData = posts.data?.data;
  const postsList = postsData?.posts || [];
  const total = postsData?.total || 0;
  const syncedAt = postsData?.synced_at;

  const handleSync = () => {
    syncPosts.mutate();
  };

  // Format synced time
  const syncedTimeAgo = syncedAt
    ? formatDistanceToNow(new Date(syncedAt), { addSuffix: true })
    : null;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduled Posts
                  {total > 0 && (
                    <span className="text-muted-foreground font-normal">
                      ({total})
                    </span>
                  )}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-2">
              {syncedTimeAgo && (
                <span className="text-xs text-muted-foreground">
                  Synced {syncedTimeAgo}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={syncPosts.isPending}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${
                    syncPosts.isPending ? 'animate-spin' : ''
                  }`}
                />
                Sync
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a
                  href="https://app.getlate.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Late
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {posts.isLoading ? (
              // Loading skeleton
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[4/5] rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : posts.error ? (
              // Error state
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-destructive">
                  Failed to load scheduled posts
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : postsList.length > 0 ? (
              // Posts grid
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {postsList.map((post) => (
                  <ScheduledPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              // Empty state
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No scheduled posts</p>
                <p className="text-sm mt-1">
                  {syncedAt
                    ? 'Schedule posts in Late.com to see them here'
                    : 'Click Sync to fetch scheduled posts from Late.com'}
                </p>
                {!syncedAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncPosts.isPending}
                    className="mt-4"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-1 ${
                        syncPosts.isPending ? 'animate-spin' : ''
                      }`}
                    />
                    Sync Now
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
