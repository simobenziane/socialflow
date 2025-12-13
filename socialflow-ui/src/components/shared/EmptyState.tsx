import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center animate-fade-in",
        className
      )}
    >
      {/* Decorative icon container with glow effect */}
      <div className="relative mb-6">
        {/* Background glow */}
        <div className="absolute -inset-4 bg-teal-100/50 dark:bg-teal-900/30 rounded-full blur-xl" />
        {/* Icon container */}
        <div className="relative bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/50 dark:to-cyan-900/50 rounded-2xl p-5 border border-teal-100 dark:border-teal-800">
          <Icon className="h-8 w-8 text-teal-500 dark:text-teal-400" />
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* Action button */}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
