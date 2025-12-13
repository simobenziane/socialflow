import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Breadcrumb trail - if provided, replaces backTo/backLabel */
  breadcrumbs?: BreadcrumbItem[];
  /** Legacy: single back link (used if no breadcrumbs) */
  backTo?: string;
  /** Legacy: back button label */
  backLabel?: string;
  actions?: ReactNode;
  /** Use gradient styling for title */
  gradient?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  backTo,
  backLabel,
  actions,
  gradient = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Breadcrumb trail - Enhanced */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={item.label} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
              {item.to ? (
                <Link
                  to={item.to}
                  className="text-muted-foreground hover:text-teal-600 transition-colors duration-200 dark:hover:text-teal-400"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Legacy back button (only if no breadcrumbs) */}
          {!breadcrumbs && backTo && (
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link to={backTo}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel || 'Back'}
              </Link>
            </Button>
          )}
          <div className="space-y-1">
            <h1
              className={cn(
                "text-2xl font-bold tracking-tight",
                gradient && "bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-cyan-400"
              )}
            >
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
