# SocialFlow Scheduling System v9

This document describes the flexible scheduling system for auto-discovered media files.

## Overview

The v9 system **auto-discovers** all media files from `photos/` and `videos/` folders with **no naming expectations**. Files are processed alphabetically. Scheduling is controlled via `schedule.yaml` configuration.

## Version History

- **v7**: CSV-based scheduling (deprecated)
- **v8**: Auto-discovery with `__F` frame pattern
- **v9**: Flexible naming with `_F` pattern, `_COVER` support, backward compatible

## File Structure

```
/data/clients/{client_slug}/{batch_name}/
├── READY.txt              # Gate file (required to process)
├── brief.txt              # AI context for photos AND videos
├── hashtags.txt           # Default hashtags
├── schedule.yaml          # Scheduling configuration
├── photos/
│   ├── 01_sunset.jpg      # Any naming - processed alphabetically
│   ├── beach_photo.png
│   ├── beach_photo_STORY.png  # Optional story variant
│   └── ...
└── videos/
    ├── promo.mp4          # Main video file
    ├── promo_F1.jpg       # Frame 1 (required)
    ├── promo_F2.jpg       # Frame 2 (required)
    ├── promo_F3.jpg       # Frame 3 (required)
    ├── promo_F4.jpg       # Frame 4 (required)
    ├── promo_COVER.jpg    # Cover image (optional)
    ├── promo_STORY.mp4    # Story variant (optional)
    └── ...
```

## File Naming Conventions (v9)

### Photos
- **Supported extensions**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Naming**: No restrictions - files are processed alphabetically
- **Story variants**: `filename_STORY.jpg` (optional, single underscore)

### Videos
- **Supported extensions**: `.mp4`, `.mov`, `.webm`
- **Naming**: No restrictions - files are processed alphabetically
- **Required frames**: `videoname_F1.jpg`, `_F2.jpg`, `_F3.jpg`, `_F4.jpg`
- **Cover image**: `videoname_COVER.jpg` (optional, used for AI analysis)
- **Story variants**: `videoname_STORY.mp4` (optional)

### Frame/Cover Association

Frames and covers are associated with videos by matching the base filename:

```
videos/
├── clip.mp4           # Video file
├── clip_F1.jpg        # "clip" matches "clip.mp4" → Frame 1
├── clip_F2.jpg        # "clip" matches "clip.mp4" → Frame 2
├── clip_F3.jpg        # "clip" matches "clip.mp4" → Frame 3
├── clip_F4.jpg        # "clip" matches "clip.mp4" → Frame 4
└── clip_COVER.jpg     # "clip" matches "clip.mp4" → Cover
```

### Backward Compatibility

The system supports old `__F` (double underscore) patterns with deprecation warnings:

| Old Pattern (deprecated) | New Pattern (v9) |
|--------------------------|------------------|
| `video__F1.jpg`          | `video_F1.jpg`   |
| `video__COVER.jpg`       | `video_COVER.jpg`|
| `file__STORY.ext`        | `file_STORY.ext` |

## schedule.yaml Configuration

### Basic Example

```yaml
# schedule.yaml - Scheduling configuration for this batch

# Start date for scheduling (YYYY-MM-DD)
start_date: "2024-12-09"

# Timezone for all scheduled times
timezone: "Europe/Berlin"

# Default posting times
defaults:
  feed_time: "20:00"
  story_time: "18:30"

# Scheduling strategy
strategy:
  # Options: "daily", "interval", "weekly", "specific_dates"
  type: "interval"

  # For "interval" type: post every N days
  interval_days: 2

  # For "weekly" type: which days to post (0=Sunday, 1=Monday, etc.)
  # weekdays: [1, 3, 5]  # Monday, Wednesday, Friday

  # Maximum posts per day (photos + videos combined)
  max_per_day: 2

  # How to distribute content types
  distribution:
    # Options: "alternate", "photos_first", "videos_first", "mixed"
    mode: "alternate"

# Platform defaults by media type
platforms:
  photos:
    feed: "ig"           # Instagram only for photos
    story: "ig"
  videos:
    feed: "ig,tt"        # Instagram + TikTok for videos
    story: "ig"

# Content slot (feed vs story)
slot: "feed"             # Default slot for all items
```

### Advanced Example: Weekly Schedule

```yaml
start_date: "2024-12-09"
timezone: "Europe/Berlin"

defaults:
  feed_time: "19:00"
  story_time: "12:00"

strategy:
  type: "weekly"
  weekdays: [1, 4]       # Monday and Thursday
  max_per_day: 3

# Override settings for specific files
overrides:
  - file: "promo_video.mp4"
    slot: "story"
    platforms: "ig"
    caption_override: "Check out our special offer!"

  - file: "announcement.jpg"
    date: "2024-12-25"   # Specific date override
    time: "10:00"
    platforms: "ig,tt"
```

### Specific Dates Example

```yaml
start_date: "2024-12-09"
timezone: "Europe/Berlin"

strategy:
  type: "specific_dates"
  dates:
    - "2024-12-09"
    - "2024-12-12"
    - "2024-12-16"
    - "2024-12-20"
    - "2024-12-24"

defaults:
  feed_time: "20:00"

platforms:
  photos:
    feed: "ig"
  videos:
    feed: "ig,tt"
```

## Strategy Types

### 1. `daily` - Post Every Day

```yaml
strategy:
  type: "daily"
  max_per_day: 1         # One post per day
```

Files are scheduled one per day starting from `start_date`.

### 2. `interval` - Post Every N Days

```yaml
strategy:
  type: "interval"
  interval_days: 2       # Every 2 days
  max_per_day: 1
```

Files are scheduled with N-day gaps between posting dates.

### 3. `weekly` - Post on Specific Weekdays

```yaml
strategy:
  type: "weekly"
  weekdays: [1, 3, 5]    # Monday, Wednesday, Friday
  max_per_day: 2
```

Weekday numbers: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

### 4. `specific_dates` - Post on Exact Dates

```yaml
strategy:
  type: "specific_dates"
  dates:
    - "2024-12-09"
    - "2024-12-15"
    - "2024-12-22"
```

Files are distributed across the specified dates.

## Distribution Modes

Controls how photos and videos are ordered:

- **`alternate`**: Photo, Video, Photo, Video...
- **`photos_first`**: All photos, then all videos
- **`videos_first`**: All videos, then all photos
- **`mixed`**: Alphabetical by filename (all files sorted together)

## Per-File Overrides

Override settings for specific files:

```yaml
overrides:
  - file: "special_promo.jpg"
    date: "2024-12-25"         # Force specific date
    time: "10:00"              # Override posting time
    slot: "story"              # Override slot
    platforms: "ig"            # Override platforms
    caption_override: "text"   # Skip AI, use this caption
    notes: "Christmas special" # Notes for AI context
```

## Cache Busting

Media URLs include a cache-busting parameter based on file hash:

```
https://tunnel.trycloudflare.com/client/batch/photos/photo1.jpg?v=abc123def
```

This ensures Late API always fetches the current file version.

## Cover Image for AI

When a `_COVER.jpg` image exists for a video, W2 uses it as the primary image for AI caption generation, followed by the frame images. This provides better context for the AI to generate relevant captions.

## UI Integration

The `schedule.yaml` structure is designed for easy UI integration:

```javascript
// Example: Generate schedule.yaml from UI form
const config = {
  start_date: formData.startDate,
  timezone: formData.timezone,
  strategy: {
    type: formData.scheduleType,
    interval_days: formData.intervalDays,
    weekdays: formData.selectedWeekdays,
    max_per_day: formData.maxPerDay
  },
  defaults: {
    feed_time: formData.feedTime,
    story_time: formData.storyTime
  },
  platforms: {
    photos: { feed: formData.photoPlatforms },
    videos: { feed: formData.videoPlatforms }
  }
};

// Convert to YAML and save
const yaml = generateYAML(config);
saveToFile(`${batchPath}/schedule.yaml`, yaml);
```

## Fallback Behavior

If `schedule.yaml` is missing or incomplete:

1. **No schedule.yaml**: Uses client defaults from `client.yaml`
2. **Missing start_date**: Uses current date
3. **Missing strategy**: Defaults to `daily` with `max_per_day: 1`
4. **Missing platforms**: Uses client config from `client.yaml`

## Validation

W1 validates the schedule configuration:

- `start_date` must be valid YYYY-MM-DD format
- `weekdays` must be 0-6 range
- `dates` must be valid dates
- `interval_days` must be positive integer
- Files in `overrides` must exist
- Video frames must exist (4 required by default)

## Policy Configuration

Frame requirements can be configured in `client.yaml`:

```yaml
policy:
  require_video_frames: true
  video_frames_required: 4
  require_cover_image: false
  tiktok_video_only: true
  story_requires_story_asset: true
```

## Migration from v8

To migrate from v8 (double underscore patterns):

1. Rename `video__F1.jpg` to `video_F1.jpg` (single underscore)
2. Rename `video__COVER.jpg` to `video_COVER.jpg`
3. Rename `file__STORY.ext` to `file_STORY.ext`

Or keep old naming - v9 is backward compatible and will log deprecation warnings.
