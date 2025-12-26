import React, { useState, useCallback, type KeyboardEvent } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusIndicator, type ContentStatus } from '@/components/ui/status-indicator';
import type { ContentItem } from '@/api/types';
import { Check, X, Edit2, ExternalLink, MessageSquare, Video, Loader2 } from 'lucide-react';
import { getLatePostUrl } from '@/config/constants';
import { getVideoCoverUrl } from '@/lib/media';
import { AIConversationViewer } from './AIConversationViewer';
import { cn } from '@/lib/utils';
import { useUpdateItemPlatforms } from '@/hooks';

interface ContentPreviewCardProps {
  item: ContentItem;
  onApprove?: (item: ContentItem) => void;
  onReject?: (item: ContentItem) => void;
  onEditCaption?: (item: ContentItem, newCaption: string) => void;
  disabled?: boolean;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export const ContentPreviewCard = React.memo(function ContentPreviewCard({
  item,
  onApprove,
  onReject,
  onEditCaption,
  disabled = false,
  isApproving = false,
  isRejecting = false,
}: ContentPreviewCardProps) {
  // Bug fix: Handle null/undefined caption_ig with fallback to empty string
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(item.caption_ig || '');

  const handleSaveEdit = useCallback(() => {
    if (onEditCaption && editedCaption !== item.caption_ig) {
      onEditCaption(item, editedCaption);
    }
    setIsEditing(false);
  }, [onEditCaption, editedCaption, item]);

  const handleCancelEdit = useCallback(() => {
    setEditedCaption(item.caption_ig || '');
    setIsEditing(false);
  }, [item.caption_ig]);

  // Bug fix: Handle Escape key to cancel edit mode
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleCancelEdit]);

  const mediaLabel = item.media_type === 'photo' ? 'Photo' : 'Video';
  const slotLabel = item.slot === 'feed' ? 'Feed' : 'Story';

  // Platform toggle mutation (v17.8)
  const updatePlatformsMutation = useUpdateItemPlatforms();

  // Parse platforms - normalize 'instagram'/'tiktok' to 'ig'/'tt'
  const rawPlatforms = (item.platforms || 'ig').split(',').map(p => {
    const normalized = p.trim().toLowerCase();
    if (normalized === 'instagram' || normalized === 'ig') return 'ig';
    if (normalized === 'tiktok' || normalized === 'tt') return 'tt';
    return normalized;
  }).filter(p => p === 'ig' || p === 'tt');

  // Ensure at least one platform
  const platforms = rawPlatforms.length > 0 ? rawPlatforms : ['ig'];
  const hasIG = platforms.includes('ig');
  const hasTT = platforms.includes('tt');

  // Toggle platform selection
  const togglePlatform = useCallback((platform: 'ig' | 'tt') => {
    const current = new Set(platforms);
    // Don't allow removing the last platform
    if (current.has(platform) && current.size > 1) {
      current.delete(platform);
    } else if (!current.has(platform)) {
      current.add(platform);
    }
    const newPlatforms = Array.from(current).sort().join(',') as 'ig' | 'tt' | 'ig,tt';
    // Use id or content_id as fallback
    const itemId = item.id ?? item.content_id;
    if (itemId) {
      updatePlatformsMutation.mutate({ id: itemId, platforms: newPlatforms });
    }
  }, [platforms, item.id, item.content_id, updatePlatformsMutation]);

  // Use shared utility for video cover URL resolution
  const previewUrl = getVideoCoverUrl(item);

  // Bug fix: Handle invalid date with fallback
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  // Check if item needs review (for hover actions)
  const canApprove = item.status === 'NEEDS_REVIEW' && onApprove;

  return (
    <Card variant="interactive" className="overflow-hidden group h-full flex flex-col" data-testid="content-preview-card">
      {/* Media Preview - Larger aspect ratio for better visibility */}
      <div className="relative aspect-[4/5] bg-muted overflow-hidden">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={item.file || 'Content preview'}
            width={400}
            height={500}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (import.meta.env.DEV) {
                console.warn('Image failed to load:', img.src);
              }
              img.src = '/placeholder-image.svg';
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"
            role="img"
            aria-label={`${mediaLabel} placeholder`}
          >
            <span className="text-sm font-medium">{mediaLabel}</span>
          </div>
        )}

        {/* Hover Overlay with Quick Actions - Also shows on focus-within for keyboard accessibility */}
        {canApprove && (
          <div className={cn(
            'absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-200',
            'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
          )}>
            <Button
              variant="success"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              onClick={() => onApprove?.(item)}
              disabled={disabled}
              aria-label="Approve"
            >
              <Check className="h-6 w-6" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              onClick={() => onReject?.(item)}
              disabled={disabled}
              aria-label="Reject"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        )}

        {/* Status Badge - Top Left for better visibility */}
        <div className="absolute top-3 left-3 z-10">
          <StatusIndicator
            status={(item.status || 'PENDING') as ContentStatus}
            size="sm"
            showLabel={true}
            showIcon={false}
            className="backdrop-blur-sm"
          />
        </div>

        {/* Slot Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
          <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
            {slotLabel}
          </Badge>
          {/* Video: Manual Caption indicator */}
          {item.media_type === 'video' && (
            <Badge variant="secondary" className="bg-amber-600/90 text-white border-0 backdrop-blur-sm">
              <Video className="h-3 w-3 mr-1" />
              Manual
            </Badge>
          )}
          {/* Story: No Caption Needed indicator */}
          {item.slot === 'story' && (
            <Badge variant="secondary" className="bg-purple-600/90 text-white border-0 backdrop-blur-sm">
              No Caption
            </Badge>
          )}
        </div>
      </div>

      {/* Content Info - Compact */}
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-sm font-medium truncate flex-1"
            title={item.file_name || item.file}
            data-testid="file-name"
          >
            {item.file_name || item.file || 'Unnamed file'}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDate(item.schedule_at)}
          </span>
        </div>
        {/* Platform toggles (v17.8) - Click to enable/disable platforms */}
        <div className="flex gap-2 mt-1.5" role="group" aria-label="Target platforms">
          <button
            type="button"
            onClick={() => togglePlatform('ig')}
            disabled={disabled || updatePlatformsMutation.isPending}
            aria-pressed={hasIG}
            aria-label={hasIG ? 'Remove from Instagram' : 'Add to Instagram'}
            className={cn(
              'min-h-[44px] min-w-[44px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 inline-flex items-center justify-center gap-1.5',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              hasIG
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm focus:ring-pink-400'
                : 'bg-muted text-muted-foreground hover:bg-pink-100 dark:hover:bg-pink-900/30 focus:ring-muted',
              (disabled || updatePlatformsMutation.isPending) && 'opacity-50 cursor-not-allowed'
            )}
            title={hasIG ? 'Click to disable Instagram' : 'Click to enable Instagram'}
          >
            IG
            {hasIG && <Check className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => togglePlatform('tt')}
            disabled={disabled || updatePlatformsMutation.isPending}
            aria-pressed={hasTT}
            aria-label={hasTT ? 'Remove from TikTok' : 'Add to TikTok'}
            className={cn(
              'min-h-[44px] min-w-[44px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 inline-flex items-center justify-center gap-1.5',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              hasTT
                ? 'bg-black text-white shadow-sm focus:ring-gray-400 dark:bg-white dark:text-black'
                : 'bg-muted text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-muted',
              (disabled || updatePlatformsMutation.isPending) && 'opacity-50 cursor-not-allowed'
            )}
            title={hasTT ? 'Click to disable TikTok' : 'Click to enable TikTok'}
          >
            TT
            {hasTT && <Check className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </CardHeader>

      {/* Caption - Full display with scroll */}
      <CardContent className="p-3 pt-0 flex-1 flex flex-col">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] text-sm"
              placeholder="Enter caption..."
              aria-label="Edit caption"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="min-h-[60px] max-h-[120px] overflow-y-auto">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="caption-display">
              {item.caption_ig || (
                <em className="text-muted-foreground/60">
                  {item.slot === 'story'
                    ? 'No caption needed for stories'
                    : item.media_type === 'video'
                      ? 'Add caption manually for videos'
                      : 'No caption'}
                </em>
              )}
            </p>
          </div>
        )}
      </CardContent>

      {/* Action Bar - Always visible for NEEDS_REVIEW */}
      {item.status === 'NEEDS_REVIEW' && (
        <CardFooter className="p-3 pt-0 flex gap-2 border-t border-border/50">
          <Button
            className="flex-1"
            size="sm"
            onClick={() => onApprove?.(item)}
            disabled={disabled || isApproving}
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Check className="mr-1 h-3 w-3" />
                Approve
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditing(true)}
            disabled={disabled || isEditing || isApproving || isRejecting}
            aria-label="Edit caption"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <AIConversationViewer
            client={item.client_slug}
            batch={item.batch_name}
            contentId={item.content_id}
            trigger={
              <Button variant="ghost" size="icon" aria-label="View AI conversation">
                <MessageSquare className="h-4 w-4" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onReject?.(item)}
            disabled={disabled || isRejecting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label={isRejecting ? "Rejecting..." : "Reject"}
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </CardFooter>
      )}

      {/* Scheduled - Late.com Link */}
      {item.status === 'SCHEDULED' && item.late_post_id && (
        <CardFooter className="p-3 pt-0 border-t border-border/50">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={getLatePostUrl(item.late_post_id)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              View in Late.com
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
});
