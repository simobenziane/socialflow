import { useState, type ReactElement } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthViewProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
}

export function MonthView({ selectedDates, onDatesChange }: MonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const toggleDate = (date: Date) => {
    const isSelected = selectedDates.some((d) => isSameDay(d, date));

    if (isSelected) {
      onDatesChange(selectedDates.filter((d) => !isSameDay(d, date)));
    } else {
      onDatesChange([...selectedDates, date]);
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderDaysHeader = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const today = startOfDay(new Date());

    const rows: ReactElement[] = [];
    let days: ReactElement[] = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDates.some((d) => isSameDay(d, currentDay));
        const isPast = isBefore(currentDay, today);
        const isTodayDate = isToday(currentDay);

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={isPast || !isCurrentMonth}
            onClick={() => toggleDate(currentDay)}
            className={cn(
              'relative h-9 w-full rounded-md text-sm transition-all',
              'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50',
              'disabled:cursor-not-allowed disabled:opacity-30',
              !isCurrentMonth && 'text-muted-foreground/40',
              isCurrentMonth && !isSelected && 'hover:bg-accent',
              isSelected &&
                'bg-primary text-primary-foreground hover:bg-primary/90',
              isTodayDate && !isSelected && 'ring-2 ring-primary/30',
              isPast && 'line-through'
            )}
          >
            <span className="relative z-10">{format(day, 'd')}</span>
            {isSelected && (
              <span className="absolute inset-0 rounded-md bg-primary opacity-20" />
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="space-y-4">
      {renderHeader()}
      {renderDaysHeader()}
      {renderCells()}
      <p className="text-xs text-muted-foreground text-center mt-4">
        {selectedDates.length === 0
          ? 'Click dates to select posting days'
          : `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`}
      </p>
    </div>
  );
}
