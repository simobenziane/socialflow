import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Image } from 'lucide-react';
import type { LatePost } from '@/api/types';
import { format } from 'date-fns';

interface ScheduledPostCardProps {
  post: LatePost;
}

export function ScheduledPostCard({ post }: ScheduledPostCardProps) {
  const media = post.media[0];
  const isVideo = media?.type === 'video';

  // Format scheduled date
  const scheduledDate = post.scheduled_for
    ? format(new Date(post.scheduled_for), 'MMM d, yyyy')
    : 'Not scheduled';
  const scheduledTime = post.scheduled_for
    ? format(new Date(post.scheduled_for), 'h:mm a')
    : '';

  // Get platform names
  const platformNames = post.platforms.map(p => p.platform);

  return (
    <Card variant="interactive" className="overflow-hidden group">
      {/* Media Preview */}
      <div className="relative aspect-[4/5] bg-muted">
        {media ? (
          isVideo ? (
            <video
              src={media.url}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              onMouseEnter={(e) => {
                const video = e.currentTarget;
                video.play().catch(() => {});
              }}
              onMouseLeave={(e) => {
                const video = e.currentTarget;
                video.pause();
                video.currentTime = 0;
              }}
            />
          ) : (
            <img
              src={media.url}
              alt="Post preview"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Platform badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {platformNames.includes('instagram') && (
            <Badge variant="instagram" className="text-xs px-1.5 py-0.5">
              IG
            </Badge>
          )}
          {platformNames.includes('tiktok') && (
            <Badge variant="tiktok" className="text-xs px-1.5 py-0.5">
              TT
            </Badge>
          )}
        </div>

        {/* Video indicator */}
        {isVideo && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 bg-amber-500/90 text-white border-0"
          >
            <Video className="h-3 w-3 mr-1" />
            Video
          </Badge>
        )}
      </div>

      {/* Info */}
      <CardContent className="p-3 space-y-2">
        {/* Caption preview */}
        <p className="text-sm line-clamp-2 text-muted-foreground">
          {post.content || 'No caption'}
        </p>

        {/* Schedule info */}
        <div className="flex items-center text-xs text-muted-foreground gap-1">
          <Calendar className="h-3 w-3" />
          <span className="font-medium">{scheduledDate}</span>
          {scheduledTime && (
            <span className="text-muted-foreground/70">at {scheduledTime}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
