import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import type { ContentItem } from '@/api/types';
import type { DistributionInput, DistributionResult, ScheduledItem } from './types';

/**
 * Formats a date to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Formats a time to HH:MM:SS string
 */
export function formatTimeString(time: string): string {
  // If already in HH:MM:SS format, return as is
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return time;
  }
  // If in HH:MM format, add seconds
  if (/^\d{2}:\d{2}$/.test(time)) {
    return `${time}:00`;
  }
  // Default to provided value
  return time;
}

/**
 * Generates dates from a weekly pattern starting from a given date
 * @param startDate - The date to start from
 * @param selectedWeekdays - Array of weekdays (0=Sun, 1=Mon, etc.)
 * @param itemCount - Number of items to schedule
 * @param maxPerDay - Maximum items per day
 * @returns Array of dates for scheduling
 */
export function generateWeekDates(
  startDate: Date,
  selectedWeekdays: number[],
  itemCount: number,
  maxPerDay: number
): Date[] {
  if (selectedWeekdays.length === 0 || itemCount === 0) {
    return [];
  }

  const dates: Date[] = [];
  const neededSlots = itemCount;
  const neededDates = Math.ceil(neededSlots / maxPerDay);

  let currentDate = startOfDay(startDate);
  const maxIterations = 365; // Safety limit: don't look more than 1 year ahead
  let iterations = 0;

  while (dates.length < neededDates && iterations < maxIterations) {
    const dayOfWeek = currentDate.getDay();

    if (selectedWeekdays.includes(dayOfWeek)) {
      dates.push(new Date(currentDate));
    }

    currentDate = addDays(currentDate, 1);
    iterations++;
  }

  return dates;
}

/**
 * Distributes content items across available dates
 * Items are sorted alphabetically by filename and distributed chronologically
 *
 * @param input - Distribution input with items, dates, times, and maxPerDay
 * @returns Distribution result with scheduled items and overflow
 */
export function distributeItems(input: DistributionInput): DistributionResult {
  const { items, dates, feedTime, storyTime, maxPerDay } = input;

  if (items.length === 0 || dates.length === 0) {
    return {
      scheduled: [],
      overflow: [],
      totalSlots: dates.length * maxPerDay,
    };
  }

  // Sort items alphabetically by filename
  const sortedItems = [...items].sort((a, b) => {
    const nameA = a.file_name || a.file || a.content_id || '';
    const nameB = b.file_name || b.file || b.content_id || '';
    return nameA.localeCompare(nameB);
  });

  // Sort dates chronologically
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());

  const scheduled: ScheduledItem[] = [];
  const overflow: ContentItem[] = [];

  let itemIndex = 0;

  // Distribute items across dates
  for (const date of sortedDates) {
    let slotsUsedToday = 0;

    while (slotsUsedToday < maxPerDay && itemIndex < sortedItems.length) {
      const item = sortedItems[itemIndex];
      const slot = item.slot || 'feed';
      const time = slot === 'story' ? storyTime : feedTime;

      scheduled.push({
        id: item.id!,
        content_id: item.content_id,
        file_name: item.file_name || item.file || item.content_id,
        media_url: item.media_url || item.preview_url,
        scheduled_date: formatDateString(date),
        scheduled_time: formatTimeString(time),
        slot: slot,
        media_type: item.media_type,
      });

      itemIndex++;
      slotsUsedToday++;
    }
  }

  // Remaining items go to overflow
  while (itemIndex < sortedItems.length) {
    overflow.push(sortedItems[itemIndex]);
    itemIndex++;
  }

  return {
    scheduled,
    overflow,
    totalSlots: sortedDates.length * maxPerDay,
  };
}

/**
 * Checks if a date is in the selected dates array
 */
export function isDateSelected(date: Date, selectedDates: Date[]): boolean {
  return selectedDates.some((selected) => isSameDay(selected, date));
}

/**
 * Toggles a date in the selected dates array
 */
export function toggleDate(date: Date, selectedDates: Date[]): Date[] {
  const isSelected = isDateSelected(date, selectedDates);

  if (isSelected) {
    return selectedDates.filter((d) => !isSameDay(d, date));
  } else {
    return [...selectedDates, date];
  }
}

/**
 * Toggles a weekday in the selected weekdays array
 */
export function toggleWeekday(day: number, selectedWeekdays: number[]): number[] {
  const isSelected = selectedWeekdays.includes(day);

  if (isSelected) {
    return selectedWeekdays.filter((d) => d !== day);
  } else {
    return [...selectedWeekdays, day].sort((a, b) => a - b);
  }
}

/**
 * Validates a time string in HH:MM format
 */
export function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return false;
  }

  const [hours, minutes] = time.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Groups scheduled items by date for display
 */
export function groupByDate(items: ScheduledItem[]): Map<string, ScheduledItem[]> {
  const grouped = new Map<string, ScheduledItem[]>();

  for (const item of items) {
    const dateKey = item.scheduled_date;
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, item]);
  }

  return grouped;
}

/**
 * Formats a date for display (e.g., "Mon, Dec 15")
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return format(date, 'EEE, MMM d');
}

/**
 * Formats a time for display (e.g., "8:00 PM")
 */
export function formatTimeForDisplay(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0);
  return format(date, 'h:mm a');
}
