import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { GlassPanel } from '@/components/ui/glass-panel';
import { useBatchStatus, useClient, useContentItems, useApproveItem, useRejectItem, useUpdateItemCaption, useApproveBatchItems } from '@/hooks';
import { ErrorAlert, EmptyState, PageHeader } from '@/components/shared';
import { SkeletonContentGrid } from '@/components/ui/skeleton';
import { ContentPreviewCard } from '@/components/ContentPreviewCard';
import type { ContentItem } from '@/api/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Eye,
  CheckCircle,
  Calendar,
  ArrowLeft,
  CheckCheck,
  Search,
  X,
} from 'lucide-react';

type FilterTab = 'review' | 'approved' | 'scheduled' | 'all';

export default function ApprovalBoard() {
  const { client, batch } = useParams<{ client: string; batch: string }>();
  const clientData = useClient(client || '');
  const batchStatus = useBatchStatus(client || '', batch || '');
  const contentItems = useContentItems(client, batch);
  const { toast } = useToast();

  // UI state
  const [activeFilter, setActiveFilter] = useState<FilterTab>('review');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Mutations
  const approveItemMutation = useApproveItem();
  const rejectItemMutation = useRejectItem();
  const updateCaptionMutation = useUpdateItemCaption();
  const approveBatchMutation = useApproveBatchItems();

  // Note: toast is stable (from useToast hook), so we don't need it in deps
  // This prevents unnecessary re-creation of callbacks that would break React.memo
  const handleApprove = useCallback((item: ContentItem) => {
    if (approveItemMutation.isPending) return;
    const id = item.id ?? item.content_id;
    if (id == null) {
      toast({
        title: 'Error',
        description: 'Unable to identify item. Missing ID.',
        variant: 'destructive',
      });
      return;
    }
    approveItemMutation.mutate(id, {
      onSuccess: (response) => {
        toast({
          title: 'Item Approved',
          description: response.message || `"${item.file}" has been approved.`,
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to approve item.',
          variant: 'destructive',
        });
      },
    });
  }, [approveItemMutation]);

  const handleReject = useCallback((item: ContentItem) => {
    if (rejectItemMutation.isPending) return;
    const id = item.id ?? item.content_id;
    if (id == null) {
      toast({
        title: 'Error',
        description: 'Unable to identify item. Missing ID.',
        variant: 'destructive',
      });
      return;
    }
    rejectItemMutation.mutate(
      { id, reason: 'Rejected from approval board' },
      {
        onSuccess: (response) => {
          toast({
            title: 'Item Rejected',
            description: response.message || `"${item.file}" has been rejected.`,
          });
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to reject item.',
            variant: 'destructive',
          });
        },
      }
    );
  }, [rejectItemMutation]);

  const handleEditCaption = useCallback((item: ContentItem, newCaption: string) => {
    const id = item.id ?? item.content_id;
    if (id == null) {
      toast({
        title: 'Error',
        description: 'Unable to identify item. Missing ID.',
        variant: 'destructive',
      });
      return;
    }
    updateCaptionMutation.mutate(
      { id, captions: { caption_ig: newCaption } },
      {
        onSuccess: (response) => {
          toast({
            title: 'Caption Updated',
            description: response.message || 'Caption has been updated.',
          });
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to update caption.',
            variant: 'destructive',
          });
        },
      }
    );
  }, [updateCaptionMutation]);

  // Bulk selection handlers
  const toggleSelection = (id: string | number | undefined) => {
    if (id == null) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = (items: ContentItem[]) => {
    const ids = items
      .map((item) => item.id ?? item.content_id)
      .filter((id): id is string | number => id != null);
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkApprove = () => {
    if (approveBatchMutation.isPending) return;
    const ids = Array.from(selectedIds);
    approveBatchMutation.mutate(ids, {
      onSuccess: (response) => {
        toast({
          title: 'Bulk Approve Complete',
          description: response.message || `Approved ${response.data.approved} items.`,
        });
        clearSelection();
      },
      onError: (error) => {
        toast({
          title: 'Bulk Approve Failed',
          description: error.message || 'Failed to approve selected items.',
          variant: 'destructive',
        });
      },
    });
  };

  // Get items from API response - must be before useMemo to satisfy hook rules
  const items = contentItems.data?.data?.items || [];

  // Cache lowercase search text to avoid repeated .toLowerCase() calls on every keystroke
  const itemsWithSearchCache = useMemo(() =>
    items.map(item => ({
      ...item,
      _searchText: `${item.file_name || item.file || ''} ${item.caption_ig || ''}`.toLowerCase()
    }))
  , [items]);

  // Single-pass categorization - avoids 3 separate filter operations
  // Uses cached items with _searchText for efficient filtering
  type ItemWithSearch = ContentItem & { _searchText: string };
  const { needsReviewItems, approvedItems, scheduledItems } = useMemo(() => {
    const result = {
      needsReviewItems: [] as ItemWithSearch[],
      approvedItems: [] as ItemWithSearch[],
      scheduledItems: [] as ItemWithSearch[],
    };

    for (const item of itemsWithSearchCache) {
      if (!item) continue;
      switch (item.status) {
        case 'NEEDS_REVIEW':
          result.needsReviewItems.push(item);
          break;
        case 'APPROVED':
          result.approvedItems.push(item);
          break;
        case 'SCHEDULED':
          result.scheduledItems.push(item);
          break;
      }
    }

    return result;
  }, [itemsWithSearchCache]);

  // Get displayed items based on filter and search
  // Uses cached _searchText to avoid repeated toLowerCase() calls on every keystroke
  const displayedItems = useMemo(() => {
    // Select base items based on filter
    let filtered: ItemWithSearch[];
    switch (activeFilter) {
      case 'review':
        filtered = needsReviewItems;
        break;
      case 'approved':
        filtered = approvedItems;
        break;
      case 'scheduled':
        filtered = scheduledItems;
        break;
      case 'all':
      default:
        filtered = itemsWithSearchCache;
    }

    // Apply search filter using cached lowercase text (O(n) instead of O(n*m))
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(item => item._searchText.includes(query));
    }

    return filtered;
  }, [activeFilter, searchQuery, itemsWithSearchCache, needsReviewItems, approvedItems, scheduledItems]);

  // Use ref to avoid re-attaching keyboard listener on displayedItems changes
  const displayedItemsRef = useRef(displayedItems);
  displayedItemsRef.current = displayedItems;

  // Keyboard shortcuts for approval workflow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
      }
      // Ctrl/Cmd + A to select all visible items (only in review filter)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && activeFilter === 'review') {
        e.preventDefault();
        const ids = displayedItemsRef.current
          .filter((item) => item.status === 'NEEDS_REVIEW')
          .map((item) => item.id ?? item.content_id)
          .filter((id): id is string | number => id != null);
        setSelectedIds(new Set(ids));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilter]);

  // Show skeleton loading state while any query is loading
  if (clientData.isLoading || batchStatus.isLoading || contentItems.isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Approval Board"
          description="Loading..."
          breadcrumbs={[
            { label: 'Dashboard', to: '/' },
            { label: 'Clients', to: '/clients' },
            { label: client || 'Client', to: `/clients/${client}` },
            { label: batch || 'Batch', to: `/batches/${client}/${batch}` },
            { label: 'Approval' },
          ]}
        />
        <SkeletonContentGrid count={8} />
      </div>
    );
  }

  // Handle errors
  if (clientData.error) {
    return (
      <ErrorAlert
        message={`Failed to load client: ${clientData.error.message}`}
        onRetry={() => clientData.refetch()}
      />
    );
  }

  if (batchStatus.error) {
    return (
      <ErrorAlert
        message={`Failed to load batch status: ${batchStatus.error.message}`}
        onRetry={() => batchStatus.refetch()}
      />
    );
  }

  if (contentItems.error) {
    return (
      <ErrorAlert
        message={`Failed to load content items: ${contentItems.error.message}`}
        onRetry={() => contentItems.refetch()}
      />
    );
  }

  // Safe default counts object with validated numeric values
  const rawCounts = batchStatus.data?.data?.counts;
  const counts = {
    total: typeof rawCounts?.total === 'number' ? rawCounts.total : 0,
    pending: typeof rawCounts?.pending === 'number' ? rawCounts.pending : 0,
    needs_ai: typeof rawCounts?.needs_ai === 'number' ? rawCounts.needs_ai : 0,
    needs_review: typeof rawCounts?.needs_review === 'number' ? rawCounts.needs_review : 0,
    approved: typeof rawCounts?.approved === 'number' ? rawCounts.approved : 0,
    scheduled: typeof rawCounts?.scheduled === 'number' ? rawCounts.scheduled : 0,
    failed: typeof rawCounts?.failed === 'number' ? rawCounts.failed : 0,
  };

  // Handle empty/null client name gracefully
  const clientName = clientData.data?.data?.name || client || 'Unknown Client';

  // Filter pill configuration
  const FILTER_PILLS: { key: FilterTab; label: string; icon: typeof Eye; count: number }[] = [
    { key: 'review', label: 'Review', icon: Eye, count: needsReviewItems.length },
    { key: 'approved', label: 'Approved', icon: CheckCircle, count: approvedItems.length },
    { key: 'scheduled', label: 'Scheduled', icon: Calendar, count: scheduledItems.length },
    { key: 'all', label: 'All', icon: Eye, count: items.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="approval-board">
      <PageHeader
        title="Approval Board"
        description={`${clientName} / ${batch || 'Unknown Batch'}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Clients', to: '/clients' },
          { label: clientName, to: `/clients/${client}` },
          { label: batch || 'Batch', to: `/batches/${client}/${batch}` },
          { label: 'Approval' },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={`/batches/${client}/${batch}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Batch
            </Link>
          </Button>
        }
      />

      {/* Filter Bar - Glass Panel */}
      <GlassPanel className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 flex-1" role="tablist" aria-label="Filter content by status">
            {FILTER_PILLS.map((pill) => {
              const isActive = activeFilter === pill.key;
              const Icon = pill.icon;
              return (
                <button
                  key={pill.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="content-grid"
                  onClick={() => setActiveFilter(pill.key)}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-700 text-white shadow-md'
                      : 'bg-white/50 text-muted-foreground hover:bg-white hover:text-foreground border border-border/50 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {pill.label}
                  <Badge
                    variant={isActive ? 'secondary' : 'outline'}
                    className={cn('ml-1 text-xs', isActive && 'bg-white/20 text-white border-0')}
                  >
                    {pill.count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 bg-white/50 border-border/50 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* Selection Bar */}
      {activeFilter === 'review' && displayedItems.length > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-2 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-3">
            <Checkbox
              id="select-all"
              aria-label="Select all items for bulk action"
              checked={selectedIds.size === displayedItems.length && displayedItems.length > 0}
              onCheckedChange={(checked: boolean | 'indeterminate') => {
                if (checked === true) {
                  selectAll(displayedItems);
                } else {
                  clearSelection();
                }
              }}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All ({displayedItems.length})
            </label>
          </div>
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'None selected'}
          </span>
        </div>
      )}

      {/* Content Grid */}
      {displayedItems.length === 0 ? (
        <EmptyState
          icon={activeFilter === 'review' ? Eye : activeFilter === 'approved' ? CheckCircle : Calendar}
          title={
            searchQuery
              ? 'No matches found'
              : activeFilter === 'review'
              ? 'No items to review'
              : activeFilter === 'approved'
              ? 'No approved items'
              : activeFilter === 'scheduled'
              ? 'No scheduled items'
              : 'No items'
          }
          description={
            searchQuery
              ? `No items match "${searchQuery}". Try a different search term.`
              : activeFilter === 'review'
              ? 'All content has been reviewed. Run AI generation (W2) to create more content.'
              : activeFilter === 'approved'
              ? 'Approve content from the review filter to see it here.'
              : activeFilter === 'scheduled'
              ? 'Run the scheduling workflow (W3) to send approved content to Late.com.'
              : 'No items in this batch.'
          }
          action={
            searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            ) : activeFilter !== 'all' ? (
              <Button variant="outline" onClick={() => setActiveFilter('all')}>
                View All Items
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div id="content-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch" role="tabpanel" data-testid="content-grid">
          {displayedItems.map((item) => {
            const itemId = item.id ?? item.content_id;
            const isSelected = itemId != null && selectedIds.has(itemId);
            const canSelect = item.status === 'NEEDS_REVIEW';

            return (
              <div key={item.content_id} className="relative group">
                {/* Selection Checkbox - Only for review items */}
                {canSelect && (
                  <div
                    className={cn(
                      'absolute top-3 left-3 z-10 transition-opacity',
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(itemId)}
                      className="bg-white/90 backdrop-blur-sm shadow-sm border-white/50"
                      aria-label={`Select ${item.file_name || item.file || 'item'} for bulk action`}
                    />
                  </div>
                )}
                <ContentPreviewCard
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEditCaption={handleEditCaption}
                  disabled={approveItemMutation.isPending || rejectItemMutation.isPending || approveBatchMutation.isPending}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <GlassPanel className="px-6 py-3 shadow-lg">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm font-medium">
                {selectedIds.size} selected
              </Badge>
              <Button
                onClick={handleBulkApprove}
                disabled={approveBatchMutation.isPending}
                className="shadow-md"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                {approveBatchMutation.isPending ? 'Approving...' : 'Approve All'}
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Schedule CTA for approved items */}
      {counts.approved > 0 && activeFilter !== 'review' && (
        <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-900/20 dark:to-cyan-900/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50">
                <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="font-medium">{counts.approved} items ready to schedule</p>
                <p className="text-sm text-muted-foreground">Go to batch to run W3 scheduling</p>
              </div>
            </div>
            <Button asChild>
              <Link to={`/batches/${client}/${batch}`}>
                <Calendar className="mr-2 h-4 w-4" />
                Go to Batch
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
