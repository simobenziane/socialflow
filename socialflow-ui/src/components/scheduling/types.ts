import type { ContentItem, SlotType } from '@/api/types';

/**
 * Configuration for the scheduling calendar
 */
export interface ScheduleConfig {
  /** Current view mode */
  viewType: 'week' | 'month';

  /** Selected weekdays for weekly scheduling (0=Sun, 1=Mon, ..., 6=Sat) */
  selectedWeekdays: number[];

  /** Start date for weekly scheduling */
  startDate: Date;

  /** Selected specific dates for monthly scheduling */
  selectedDates: Date[];

  /** Time for feed posts (HH:MM format) */
  feedTime: string;

  /** Time for story posts (HH:MM format) */
  storyTime: string;

  /** Maximum items per day */
  maxPerDay: number;

  /** Timezone for scheduling */
  timezone: string;
}

/**
 * Default schedule configuration
 */
export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  viewType: 'week',
  selectedWeekdays: [1, 3, 5], // Mon, Wed, Fri
  startDate: new Date(),
  selectedDates: [],
  feedTime: '20:00',
  storyTime: '18:30',
  maxPerDay: 2,
  timezone: 'Europe/Berlin',
};

/**
 * A scheduled item with computed date/time
 */
export interface ScheduledItem {
  /** Database ID */
  id: number;

  /** Unique content identifier */
  content_id: string;

  /** Original filename for display */
  file_name: string;

  /** Media URL for thumbnail */
  media_url?: string;

  /** Scheduled date (YYYY-MM-DD) */
  scheduled_date: string;

  /** Scheduled time (HH:MM:SS) */
  scheduled_time: string;

  /** Slot type (feed or story) */
  slot: SlotType;

  /** Media type for display */
  media_type?: 'photo' | 'video';
}

/**
 * Result of the distribution algorithm
 */
export interface DistributionResult {
  /** Successfully scheduled items */
  scheduled: ScheduledItem[];

  /** Items that couldn't fit in available slots */
  overflow: ContentItem[];

  /** Total available slots */
  totalSlots: number;
}

/**
 * Input for the distribution algorithm
 */
export interface DistributionInput {
  /** Content items to schedule (should be APPROVED status) */
  items: ContentItem[];

  /** Available dates for scheduling */
  dates: Date[];

  /** Time for feed posts */
  feedTime: string;

  /** Time for story posts */
  storyTime: string;

  /** Maximum items per day */
  maxPerDay: number;
}

/**
 * API request for bulk schedule update
 */
export interface BulkScheduleRequest {
  items: Array<{
    id: number;
    scheduled_date: string;
    scheduled_time: string;
    slot: SlotType;
  }>;
  timezone: string;
}

/**
 * API response for bulk schedule update
 */
export interface BulkScheduleResponse {
  success: boolean;
  message: string;
  data: {
    updated: number;
    total: number;
  };
}

/**
 * Day labels for week view
 */
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Full day labels
 */
export const WEEKDAY_FULL_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
