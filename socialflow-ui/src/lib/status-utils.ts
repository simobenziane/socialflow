import type { ContentStatus } from '@/api/types';

/**
 * Status badge configuration for content items
 */
export interface StatusBadgeConfig {
  variant: 'secondary' | 'outline' | 'destructive';
  label: string;
  className?: string;
}

/**
 * Get status badge configuration for a content status
 */
export function getStatusBadge(status: string): StatusBadgeConfig {
  switch (status) {
    case 'PENDING':
      return { variant: 'secondary', label: 'Pending' };
    case 'NEEDS_AI':
      return {
        variant: 'outline',
        label: 'Needs AI',
        className: 'text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
      };
    case 'NEEDS_REVIEW':
      return {
        variant: 'outline',
        label: 'Needs Review',
        className: 'text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
      };
    case 'APPROVED':
      return {
        variant: 'outline',
        label: 'Approved',
        className: 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      };
    case 'SCHEDULED':
      return {
        variant: 'outline',
        label: 'Scheduled',
        className: 'text-cyan-600 border-cyan-200 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
      };
    case 'BLOCKED':
      return { variant: 'destructive', label: 'Blocked' };
    case 'FAILED':
      return { variant: 'destructive', label: 'Failed' };
    default:
      return { variant: 'secondary', label: status };
  }
}

/**
 * Pipeline status configuration
 */
export const PIPELINE_STATUS_CONFIG: {
  key: string;
  label: string;
  status: ContentStatus;
}[] = [
  { key: 'pending', label: 'Pending', status: 'PENDING' },
  { key: 'needs_ai', label: 'AI', status: 'NEEDS_AI' },
  { key: 'needs_review', label: 'Review', status: 'NEEDS_REVIEW' },
  { key: 'approved', label: 'Approved', status: 'APPROVED' },
  { key: 'scheduled', label: 'Scheduled', status: 'SCHEDULED' },
];

/**
 * Workflow step configuration
 */
export const WORKFLOW_STEPS = [
  { key: 'ingest' as const, label: 'Ingest', description: 'Scan & validate media' },
  { key: 'generate' as const, label: 'AI Gen', description: 'Generate captions' },
  { key: 'schedule' as const, label: 'Schedule', description: 'Send to Late.com' },
];

/**
 * Default content status counts
 */
export const DEFAULT_STATUS_COUNTS = {
  total: 0,
  pending: 0,
  needs_ai: 0,
  needs_review: 0,
  approved: 0,
  scheduled: 0,
  failed: 0,
};

/**
 * Sanitize error messages to prevent leaking system information
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove file paths and system-specific information
    const message = error.message
      .replace(/\/[^\s]+/g, '[path]')
      .replace(/\b[A-Z]:\\[^\s]+/g, '[path]')
      .replace(/at\s+[^\s]+\s+\([^)]+\)/g, '')
      .trim();

    // Provide user-friendly message for common errors
    if (message.includes('ECONNREFUSED')) {
      return 'Unable to connect to the server. Please check if the service is running.';
    }
    if (message.includes('ETIMEDOUT')) {
      return 'Connection timed out. Please try again.';
    }
    if (message.includes('NetworkError') || message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }

    return message || 'An unexpected error occurred.';
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred.';
}
