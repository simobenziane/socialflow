import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Layers } from 'lucide-react';

interface TimeConfigProps {
  feedTime: string;
  storyTime: string;
  maxPerDay: number;
  onFeedTimeChange: (time: string) => void;
  onStoryTimeChange: (time: string) => void;
  onMaxPerDayChange: (max: number) => void;
}

export function TimeConfig({
  feedTime,
  storyTime,
  maxPerDay,
  onFeedTimeChange,
  onStoryTimeChange,
  onMaxPerDayChange,
}: TimeConfigProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Posting Times</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Feed Time */}
        <div className="space-y-2">
          <Label htmlFor="feed-time" className="text-sm">
            Feed Posts
          </Label>
          <Input
            id="feed-time"
            type="time"
            value={feedTime}
            onChange={(e) => onFeedTimeChange(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Time for regular feed posts
          </p>
        </div>

        {/* Story Time */}
        <div className="space-y-2">
          <Label htmlFor="story-time" className="text-sm">
            Story Posts
          </Label>
          <Input
            id="story-time"
            type="time"
            value={storyTime}
            onChange={(e) => onStoryTimeChange(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Time for story content
          </p>
        </div>

        {/* Max Per Day */}
        <div className="space-y-2">
          <Label htmlFor="max-per-day" className="text-sm flex items-center gap-1">
            <Layers className="h-3 w-3" />
            Max Per Day
          </Label>
          <Select
            value={String(maxPerDay)}
            onValueChange={(value) => onMaxPerDayChange(parseInt(value, 10))}
          >
            <SelectTrigger id="max-per-day">
              <SelectValue placeholder="Select max" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={String(num)}>
                  {num} item{num > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Maximum posts per day
          </p>
        </div>
      </div>
    </div>
  );
}
