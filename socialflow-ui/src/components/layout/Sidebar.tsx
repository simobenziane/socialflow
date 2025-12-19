import { NavLink, useLocation, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  X,
  FolderOpen,
  CheckSquare,
  Workflow,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useClient } from '@/hooks';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/onboarding', icon: PlusCircle, label: 'New Client' },
  { to: '/accounts', icon: Users, label: 'Accounts' },
  { to: '/clients', icon: Building2, label: 'Clients' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Extract route context from current path
 */
function useRouteContext() {
  const location = useLocation();
  const params = useParams<{ slug?: string; client?: string; batch?: string }>();
  const path = location.pathname;

  // Determine the current context
  const isClientRoute = path.startsWith('/clients/') && params.slug;
  const isBatchRoute = path.startsWith('/batches/') && params.client && params.batch;
  const isApprovalRoute = isBatchRoute && path.endsWith('/approve');

  return {
    clientSlug: isClientRoute ? params.slug : isBatchRoute ? params.client : null,
    batchName: isBatchRoute ? params.batch : null,
    isApprovalRoute,
    isBatchRoute,
    isClientRoute: isClientRoute || isBatchRoute,
  };
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const context = useRouteContext();

  // Fetch client data when we have a client context
  const clientQuery = useClient(context.clientSlug || '');
  const clientName = clientQuery.data?.data?.name || context.clientSlug || '';

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Glass Effect */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 p-4 flex flex-col',
          'bg-white/80 backdrop-blur-xl border-r border-white/20',
          'shadow-[4px_0_24px_rgba(0,0,0,0.04)]',
          'transition-transform duration-300 ease-out',
          'dark:bg-slate-900/80 dark:border-white/10',
          'md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-700 shadow-md">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gradient">SocialFlow</h1>
              <p className="text-xs text-muted-foreground">Content Automation</p>
            </div>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const isClientsItem = item.to === '/clients';
            const showClientHierarchy = isClientsItem && context.isClientRoute;

            return (
              <div key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive && !showClientHierarchy
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-700 text-white shadow-md'
                        : showClientHierarchy
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                        : 'text-muted-foreground hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/20 dark:hover:text-teal-400'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>

                {/* Hierarchical nested items under Clients */}
                {showClientHierarchy && (
                  <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-teal-200 pl-3 dark:border-teal-800">
                    {/* Client level */}
                    <NavLink
                      to={`/clients/${context.clientSlug}`}
                      end
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                          isActive && !context.isBatchRoute
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-700 text-white shadow-sm'
                            : context.isBatchRoute
                            ? 'text-muted-foreground'
                            : 'hover:bg-teal-50 text-muted-foreground hover:text-teal-600 dark:hover:bg-teal-900/20 dark:hover:text-teal-400'
                        )
                      }
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="truncate">{clientName}</span>
                    </NavLink>

                    {/* Batch level (if in batch or approval context) */}
                    {context.isBatchRoute && context.batchName && (
                      <div className="ml-3 space-y-1 border-l-2 border-teal-200 pl-3 dark:border-teal-800">
                        <NavLink
                          to={`/batches/${context.clientSlug}/${context.batchName}`}
                          end
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                              isActive && !context.isApprovalRoute
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-700 text-white shadow-sm'
                                : context.isApprovalRoute
                                ? 'text-muted-foreground'
                                : 'hover:bg-teal-50 text-muted-foreground hover:text-teal-600 dark:hover:bg-teal-900/20 dark:hover:text-teal-400'
                            )
                          }
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span className="truncate">{context.batchName}</span>
                        </NavLink>

                        {/* Approval level */}
                        {context.isApprovalRoute && (
                          <div className="ml-3 border-l-2 border-teal-200 pl-3 dark:border-teal-800">
                            <NavLink
                              to={`/batches/${context.clientSlug}/${context.batchName}/approve`}
                              onClick={onClose}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                  isActive
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-700 text-white shadow-sm'
                                    : 'hover:bg-teal-50 text-muted-foreground hover:text-teal-600 dark:hover:bg-teal-900/20 dark:hover:text-teal-400'
                                )
                              }
                            >
                              <CheckSquare className="h-3.5 w-3.5" />
                              <span>Approval</span>
                            </NavLink>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Phase 3.0</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
