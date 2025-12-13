import type { ContentItem } from '@/api/types';

/**
 * Get the video cover URL from a content item.
 * For videos with cover_path, constructs URL from base media URL.
 * Falls back to preview_url for photos or videos without covers.
 */
export function getVideoCoverUrl(item: ContentItem): string | undefined {
  if (item.media_type === 'video' && item.cover_path && item.media_url) {
    // Extract cloudflare base URL from media_url
    const urlMatch = item.media_url.match(/^(https?:\/\/[^/]+)/);
    if (urlMatch) {
      const baseUrl = urlMatch[1];
      // Convert /data/clients/path to just /path
      const relativePath = item.cover_path.replace('/data/clients/', '/');
      return `${baseUrl}${relativePath}`;
    }
  }
  return item.preview_url;
}
