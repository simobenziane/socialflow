import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);

    // Should have the spinner with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<LoadingSpinner text="Loading data..." />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render small size', () => {
    render(<LoadingSpinner size="sm" />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('should render medium size (default)', () => {
    render(<LoadingSpinner size="md" />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('should render large size', () => {
    render(<LoadingSpinner size="lg" />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);

    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('should have centered layout', () => {
    render(<LoadingSpinner />);

    const container = document.querySelector('.flex');
    expect(container).toHaveClass('items-center', 'justify-center');
  });

  it('should render inner pulsing dot for default variant', () => {
    render(<LoadingSpinner variant="default" />);

    const pulsingDot = document.querySelector('.animate-pulse.rounded-full.bg-teal-500');
    expect(pulsingDot).toBeInTheDocument();
  });

  it('should not render inner dot for minimal variant', () => {
    render(<LoadingSpinner variant="minimal" />);

    const pulsingDot = document.querySelector('.animate-pulse.rounded-full.bg-teal-500');
    expect(pulsingDot).not.toBeInTheDocument();
  });

  it('should render text with muted styling and pulse animation', () => {
    render(<LoadingSpinner text="Loading..." />);

    const text = screen.getByText('Loading...');
    expect(text).toHaveClass('text-muted-foreground', 'animate-pulse');
  });
});
