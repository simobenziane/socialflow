import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  variant?: 'default' | 'minimal';
}

const sizes = {
  sm: { container: 'h-4 w-4', ring: 'h-4 w-4 border-2', inner: 'h-1.5 w-1.5' },
  md: { container: 'h-8 w-8', ring: 'h-8 w-8 border-[3px]', inner: 'h-3 w-3' },
  lg: { container: 'h-12 w-12', ring: 'h-12 w-12 border-4', inner: 'h-4 w-4' },
};

export function LoadingSpinner({ size = 'md', text, className, variant = 'default' }: LoadingSpinnerProps) {
  const sizeConfig = sizes[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={text || 'Loading'}
      className={cn('flex flex-col items-center justify-center gap-3 py-8', className)}
    >
      {/* Spinner with teal gradient ring */}
      <div className={cn('relative', sizeConfig.container)} aria-hidden="true">
        {/* Outer spinning ring */}
        <div
          className={cn(
            sizeConfig.ring,
            'absolute inset-0 rounded-full animate-spin',
            'border-teal-200 dark:border-teal-800',
            'border-t-teal-500 dark:border-t-teal-400'
          )}
        />
        {/* Inner pulsing dot */}
        {variant === 'default' && (
          <div
            className={cn(
              sizeConfig.inner,
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse'
            )}
          />
        )}
      </div>
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">{text}</span>
      )}
      {/* Screen reader only text when no visible text */}
      {!text && <span className="sr-only">Loading...</span>}
    </div>
  );
}
