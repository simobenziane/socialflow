import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertCircle, Image, Video, Calendar } from 'lucide-react';
import type { ScheduledItem } from './types';
import type { ContentItem } from '@/api/types';
import { groupByDate, formatDateForDisplay, formatTimeForDisplay } from './scheduleUtils';

interface SchedulePreviewProps {
  scheduledItems: ScheduledItem[];
  overflowItems: ContentItem[];
  totalSlots: number;
}

export function SchedulePreview({
  scheduledItems,
  overflowItems,
  totalSlots,
}: SchedulePreviewProps) {
  const groupedItems = groupByDate(scheduledItems);
  const hasOverflow = overflowItems.length > 0;

  if (scheduledItems.length === 0 && overflowItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No schedule generated yet</p>
        <p className="text-xs mt-1">Select days and click "Generate Preview"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {scheduledItems.length} of {scheduledItems.length + overflowItems.length} items scheduled
        </span>
        <span className="text-muted-foreground">
          {totalSlots} slots available
        </span>
      </div>

      {/* Overflow Warning */}
      {hasOverflow && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="flex items-start gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {overflowItems.length} item{overflowItems.length > 1 ? 's' : ''} won't fit
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                Select more dates or increase max items per day to schedule all content
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {overflowItems.slice(0, 5).map((item) => (
                  <Badge
                    key={item.content_id}
                    variant="outline"
                    className="text-xs bg-amber-100/50 dark:bg-amber-900/30"
                  >
                    {item.file_name || item.file || item.content_id}
                  </Badge>
                ))}
                {overflowItems.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{overflowItems.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule by Date */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {Array.from(groupedItems.entries()).map(([dateKey, items]) => (
          <div key={dateKey} className="space-y-2">
            {/* Date Header */}
            <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur py-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {formatDateForDisplay(dateKey)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {items.length} item{items.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Items for this date */}
            <div className="space-y-2 pl-6">
              {items.map((item) => (
                <div
                  key={item.content_id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg border',
                    'bg-card hover:bg-accent/50 transition-colors'
                  )}
                >
                  {/* Media Type Icon */}
                  <div className="shrink-0">
                    {item.media_type === 'video' ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Image className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Thumbnail */}
                  {item.media_url && (
                    <img
                      src={item.media_url}
                      alt=""
                      className="w-10 h-10 object-cover rounded shrink-0"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeForDisplay(item.scheduled_time)}
                    </p>
                  </div>

                  {/* Slot Badge */}
                  <Badge
                    variant={item.slot === 'story' ? 'secondary' : 'outline'}
                    className="text-xs shrink-0"
                  >
                    {item.slot}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
