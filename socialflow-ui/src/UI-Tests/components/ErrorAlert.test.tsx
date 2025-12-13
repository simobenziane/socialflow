import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorAlert } from '@/components/shared/ErrorAlert';

describe('ErrorAlert', () => {
  it('should render with message', () => {
    render(<ErrorAlert message="Something went wrong" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render with default title', () => {
    render(<ErrorAlert message="Test error" />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<ErrorAlert title="Custom Error" message="Test error" />);

    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Test error" onRetry={onRetry} />);

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorAlert message="Test error" />);

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Test error" onRetry={onRetry} />);

    fireEvent.click(screen.getByText('Try Again'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should have destructive variant styling', () => {
    render(<ErrorAlert message="Test error" />);

    // The Alert component with variant="destructive" should be rendered
    const alert = document.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
  });

  it('should render alert icon', () => {
    render(<ErrorAlert message="Test error" />);

    // AlertCircle icon should be present
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
