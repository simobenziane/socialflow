import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from './Skeleton';

/**
 * Skeleton for ContentPreviewCard loading state.
 * Matches the structure of the actual content card.
 */
export function ContentCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image placeholder */}
      <div className="relative aspect-square bg-muted">
        <Skeleton className="w-full h-full rounded-none" />
        {/* Status badge placeholder */}
        <div className="absolute top-2 left-2">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        {/* Slot badge placeholder */}
        <div className="absolute top-2 right-2">
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>

      {/* Content Info */}
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>

      {/* Caption */}
      <CardContent className="pb-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </CardContent>
    </Card>
  );
}

interface ContentGridSkeletonProps {
  count?: number;
}

/**
 * Grid of skeleton cards for content loading states.
 */
export function ContentGridSkeleton({ count = 8 }: ContentGridSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ContentCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for status cards (used in dashboard, batch detail).
 */
export function StatusCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-3 w-24 mt-1" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for client/batch list items.
 */
export function ListItemSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-5 w-5 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
