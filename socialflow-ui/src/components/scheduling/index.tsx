import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassPanel } from '@/components/ui/glass-panel';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Calendar, CalendarDays, Sparkles, Save, RefreshCw, Loader2 } from 'lucide-react';
import type { ContentItem } from '@/api/types';
import { TimeConfig } from './TimeConfig';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { SchedulePreview } from './SchedulePreview';
import { distributeItems, generateWeekDates } from './scheduleUtils';
import type { ScheduleConfig, ScheduledItem, DistributionResult } from './types';
import { DEFAULT_SCHEDULE_CONFIG } from './types';

interface SchedulingCalendarProps {
  clientSlug: string;
  batchSlug: string;
  approvedItems: ContentItem[];
  onScheduleSave: (items: ScheduledItem[]) => Promise<void>;
  isSaving?: boolean;
}

export function SchedulingCalendar({
  clientSlug: _clientSlug,
  batchSlug: _batchSlug,
  approvedItems,
  onScheduleSave,
  isSaving = false,
}: SchedulingCalendarProps) {
  // Note: clientSlug and batchSlug are available for future use (e.g., saving draft schedules)
  void _clientSlug;
  void _batchSlug;
  const { toast } = useToast();

  // Schedule configuration state
  const [config, setConfig] = useState<ScheduleConfig>(DEFAULT_SCHEDULE_CONFIG);

  // Preview state
  const [preview, setPreview] = useState<DistributionResult | null>(null);

  // Update config helpers
  const updateConfig = useCallback((updates: Partial<ScheduleConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    // Clear preview when config changes
    setPreview(null);
  }, []);

  // Generate preview
  const handleGeneratePreview = useCallback(() => {
    let dates: Date[];

    if (config.viewType === 'week') {
      if (config.selectedWeekdays.length === 0) {
        toast({
          title: 'No days selected',
          description: 'Please select at least one day of the week',
          variant: 'destructive',
        });
        return;
      }
      dates = generateWeekDates(
        config.startDate,
        config.selectedWeekdays,
        approvedItems.length,
        config.maxPerDay
      );
    } else {
      if (config.selectedDates.length === 0) {
        toast({
          title: 'No dates selected',
          description: 'Please select at least one date on the calendar',
          variant: 'destructive',
        });
        return;
      }
      dates = config.selectedDates;
    }

    const result = distributeItems({
      items: approvedItems,
      dates,
      feedTime: config.feedTime,
      storyTime: config.storyTime,
      maxPerDay: config.maxPerDay,
    });

    setPreview(result);

    if (result.overflow.length > 0) {
      toast({
        title: 'Some items won\'t fit',
        description: `${result.overflow.length} item${result.overflow.length > 1 ? 's' : ''} couldn't be scheduled. Select more dates or increase max per day.`,
        variant: 'default',
      });
    }
  }, [config, approvedItems, toast]);

  // Save schedule
  const handleSaveSchedule = useCallback(async () => {
    if (!preview || preview.scheduled.length === 0) {
      toast({
        title: 'Nothing to save',
        description: 'Generate a preview first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onScheduleSave(preview.scheduled);
      toast({
        title: 'Schedule saved',
        description: `Updated schedule for ${preview.scheduled.length} item${preview.scheduled.length > 1 ? 's' : ''}`,
      });
      setPreview(null);
    } catch (error) {
      toast({
        title: 'Failed to save schedule',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [preview, onScheduleSave, toast]);

  // Check if we can generate preview
  const canGenerate = useMemo(() => {
    if (approvedItems.length === 0) return false;
    if (config.viewType === 'week') {
      return config.selectedWeekdays.length > 0;
    }
    return config.selectedDates.length > 0;
  }, [approvedItems.length, config.viewType, config.selectedWeekdays, config.selectedDates]);

  if (approvedItems.length === 0) {
    return null;
  }

  return (
    <Card variant="elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Schedule Content</CardTitle>
            <CardDescription>
              {approvedItems.length} approved item{approvedItems.length > 1 ? 's' : ''} ready to schedule
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* View Type Tabs */}
        <Tabs
          value={config.viewType}
          onValueChange={(v) => updateConfig({ viewType: v as 'week' | 'month' })}
        >
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="week" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Month
            </TabsTrigger>
          </TabsList>

          {/* Week View */}
          <TabsContent value="week" className="mt-4">
            <GlassPanel className="p-4">
              <WeekView
                selectedWeekdays={config.selectedWeekdays}
                startDate={config.startDate}
                onWeekdaysChange={(days) => updateConfig({ selectedWeekdays: days })}
                onStartDateChange={(date) => updateConfig({ startDate: date })}
              />
            </GlassPanel>
          </TabsContent>

          {/* Month View */}
          <TabsContent value="month" className="mt-4">
            <GlassPanel className="p-4">
              <MonthView
                selectedDates={config.selectedDates}
                onDatesChange={(dates) => updateConfig({ selectedDates: dates })}
              />
            </GlassPanel>
          </TabsContent>
        </Tabs>

        {/* Time Configuration */}
        <GlassPanel className="p-4">
          <TimeConfig
            feedTime={config.feedTime}
            storyTime={config.storyTime}
            maxPerDay={config.maxPerDay}
            onFeedTimeChange={(time) => updateConfig({ feedTime: time })}
            onStoryTimeChange={(time) => updateConfig({ storyTime: time })}
            onMaxPerDayChange={(max) => updateConfig({ maxPerDay: max })}
          />
        </GlassPanel>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleGeneratePreview}
            disabled={!canGenerate || isSaving}
            className="min-w-[200px]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Preview
          </Button>
        </div>

        {/* Preview Section */}
        {preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Schedule Preview</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreview(null)}
                disabled={isSaving}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </div>

            <GlassPanel className="p-4">
              <SchedulePreview
                scheduledItems={preview.scheduled}
                overflowItems={preview.overflow}
                totalSlots={preview.totalSlots}
              />
            </GlassPanel>

            {/* Save Button */}
            {preview.scheduled.length > 0 && (
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSaveSchedule}
                  disabled={isSaving}
                  className={cn(
                    'min-w-[200px]',
                    'bg-gradient-to-r from-emerald-500 to-teal-500',
                    'hover:from-emerald-600 hover:to-teal-600'
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Schedule ({preview.scheduled.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { TimeConfig } from './TimeConfig';
export { WeekView } from './WeekView';
export { MonthView } from './MonthView';
export { SchedulePreview } from './SchedulePreview';
export * from './types';
export * from './scheduleUtils';
