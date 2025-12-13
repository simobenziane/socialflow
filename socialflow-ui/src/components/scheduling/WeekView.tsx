import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { WEEKDAY_LABELS } from './types';
import { CalendarDays } from 'lucide-react';

interface WeekViewProps {
  selectedWeekdays: number[];
  startDate: Date;
  onWeekdaysChange: (days: number[]) => void;
  onStartDateChange: (date: Date) => void;
}

export function WeekView({
  selectedWeekdays,
  startDate,
  onWeekdaysChange,
  onStartDateChange,
}: WeekViewProps) {
  const toggleDay = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      onWeekdaysChange(selectedWeekdays.filter((d) => d !== day));
    } else {
      onWeekdaysChange([...selectedWeekdays, day].sort((a, b) => a - b));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      onStartDateChange(date);
    }
  };

  return (
    <div className="space-y-6">
      {/* Start Date */}
      <div className="space-y-2">
        <Label htmlFor="start-date" className="text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Start Date
        </Label>
        <Input
          id="start-date"
          type="date"
          value={format(startDate, 'yyyy-MM-dd')}
          onChange={handleDateChange}
          min={format(new Date(), 'yyyy-MM-dd')}
          className="w-full max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Scheduling will begin from this date
        </p>
      </div>

      {/* Day Selection */}
      <div className="space-y-3">
        <Label className="text-sm">Posting Days</Label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, index) => {
            const isSelected = selectedWeekdays.includes(index);
            return (
              <Button
                key={index}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleDay(index)}
                className={cn(
                  'min-w-[3.5rem] transition-all',
                  isSelected && 'shadow-md',
                  !isSelected && 'hover:border-primary/50'
                )}
              >
                {label}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedWeekdays.length === 0
            ? 'Select at least one day'
            : `Posts every ${selectedWeekdays.map((d) => WEEKDAY_LABELS[d]).join(', ')}`}
        </p>
      </div>
    </div>
  );
}
