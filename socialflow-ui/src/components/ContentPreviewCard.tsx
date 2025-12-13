import React, { useState, useCallback, type KeyboardEvent } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusIndicator, type ContentStatus } from '@/components/ui/status-indicator';
import type { ContentItem } from '@/api/types';
import { Check, X, Edit2, ExternalLink, MessageSquare } from 'lucide-react';
import { getLatePostUrl } from '@/config/constants';
import { getVideoCoverUrl } from '@/lib/media';
import { AIConversationViewer } from './AIConversationViewer';
import { cn } from '@/lib/utils';

interface ContentPreviewCardProps {
  item: ContentItem;
  onApprove?: (item: ContentItem) => void;
  onReject?: (item: ContentItem) => void;
  onEditCaption?: (item: ContentItem, newCaption: string) => void;
  disabled?: boolean;
}

export const ContentPreviewCard = React.memo(function ContentPreviewCard({
  item,
  onApprove,
  onReject,
  onEditCaption,
  disabled = false,
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

  // Bug fix: Handle null/undefined platforms with fallback to empty string
  const platforms = (item.platforms || '').split(',').filter(p => p.trim());

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

        {/* Hover Overlay with Quick Actions */}
        {canApprove && (
          <div className={cn(
            'absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-200',
            'opacity-0 group-hover:opacity-100'
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

        {/* Status Badge - Top Left */}
        <div className="absolute top-3 right-3 z-10">
          <StatusIndicator
            status={(item.status || 'PENDING') as ContentStatus}
            size="sm"
            showLabel={true}
            showIcon={false}
          />
        </div>

        {/* Slot Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
            {slotLabel}
          </Badge>
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
        {platforms.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {platforms.map((platform) => (
              <Badge
                key={platform}
                variant={platform.trim() === 'instagram' ? 'instagram' : 'tiktok'}
                className="text-[10px] px-1.5 py-0"
              >
                {platform.trim() === 'instagram' ? 'IG' : 'TT'}
              </Badge>
            ))}
          </div>
        )}
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
              {item.caption_ig || <em className="text-muted-foreground/60">No caption</em>}
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
            disabled={disabled}
          >
            <Check className="mr-1 h-3 w-3" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setIsEditing(true)}
            disabled={disabled || isEditing}
            aria-label="Edit caption"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <AIConversationViewer
            client={item.client_slug}
            batch={item.batch_name}
            contentId={item.content_id}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="View AI conversation">
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onReject?.(item)}
            disabled={disabled}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Reject"
          >
            <X className="h-3.5 w-3.5" />
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
