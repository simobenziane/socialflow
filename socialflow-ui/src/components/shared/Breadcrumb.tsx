import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  to?: string; // Optional - last item has no link
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb navigation component.
 * Shows path like: Dashboard / Clients / ClientName / BatchName
 * All items except the last are clickable links.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.to || item.label} className="flex items-center">
              {/* Separator (not before first item) */}
              {!isFirst && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" aria-hidden="true" />
              )}

              {/* Link or text */}
              {isLast || !item.to ? (
                <span
                  className="text-foreground font-medium truncate max-w-[200px]"
                  aria-current={isLast ? 'page' : undefined}
                  title={item.label}
                >
                  {isFirst && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
                  title={item.label}
                >
                  {isFirst && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
