import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/shared/EmptyState';
import { FileQuestion, Users } from 'lucide-react';

describe('EmptyState', () => {
  it('should render with required props', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="No items found"
        description="There are no items to display"
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
  });

  it('should render the icon', () => {
    render(
      <EmptyState
        icon={Users}
        title="No users"
        description="No users available"
      />
    );

    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-8', 'w-8');
  });

  it('should render action when provided', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="No items"
        description="Add an item to get started"
        action={<button>Add Item</button>}
      />
    );

    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('should not render action when not provided', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="No items"
        description="No items available"
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should have centered layout', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="Test"
        description="Test description"
      />
    );

    const container = document.querySelector('.flex');
    expect(container).toHaveClass('flex-col', 'items-center', 'justify-center', 'text-center');
  });

  it('should have icon container with gradient background', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="Test"
        description="Test description"
      />
    );

    // Icon container uses rounded-2xl with gradient background
    const iconContainer = document.querySelector('.rounded-2xl');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('bg-gradient-to-br');
  });

  it('should render title with proper styling', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="Empty State Title"
        description="Description text"
      />
    );

    const title = screen.getByText('Empty State Title');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-lg', 'font-semibold');
  });

  it('should render description with muted text', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="Title"
        description="This is the description"
      />
    );

    const description = screen.getByText('This is the description');
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('should have decorative glow effect', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="Test"
        description="Test description"
      />
    );

    // Background glow element
    const glow = document.querySelector('.blur-xl');
    expect(glow).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="Test"
        description="Test description"
        className="custom-class"
      />
    );

    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('should have fade-in animation', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="Test"
        description="Test description"
      />
    );

    const container = document.querySelector('.animate-fade-in');
    expect(container).toBeInTheDocument();
  });
});
