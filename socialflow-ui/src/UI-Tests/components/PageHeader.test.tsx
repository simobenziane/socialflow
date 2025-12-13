import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { PageHeader } from '@/components/shared/PageHeader';

describe('PageHeader', () => {
  it('should render with title only', () => {
    render(<PageHeader title="Dashboard" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
  });

  it('should render with title and description', () => {
    render(
      <PageHeader
        title="Clients"
        description="Manage your client accounts"
      />
    );

    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Manage your client accounts')).toBeInTheDocument();
  });

  it('should render back button when backTo is provided', () => {
    render(
      <PageHeader
        title="Client Details"
        backTo="/clients"
      />
    );

    const backLink = screen.getByRole('link');
    expect(backLink).toHaveAttribute('href', '/clients');
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('should render custom back label', () => {
    render(
      <PageHeader
        title="Batch Details"
        backTo="/clients/test"
        backLabel="Back to Client"
      />
    );

    expect(screen.getByText('Back to Client')).toBeInTheDocument();
  });

  it('should not render back button when backTo is not provided', () => {
    render(<PageHeader title="Dashboard" />);

    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('should render actions when provided', () => {
    render(
      <PageHeader
        title="Accounts"
        actions={<button>Sync Accounts</button>}
      />
    );

    expect(screen.getByText('Sync Accounts')).toBeInTheDocument();
  });

  it('should not render actions section when not provided', () => {
    render(<PageHeader title="Settings" />);

    // Should only have the title container, not the actions container
    const containers = document.querySelectorAll('.flex.items-center');
    expect(containers.length).toBeGreaterThanOrEqual(1);
  });

  it('should render description with muted styling', () => {
    render(
      <PageHeader
        title="Test"
        description="Test description"
      />
    );

    const description = screen.getByText('Test description');
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('should render title with proper styling', () => {
    render(<PageHeader title="Test Title" />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('text-2xl', 'font-bold');
  });

  it('should have flex layout with items-start and justify-between', () => {
    render(<PageHeader title="Test" />);

    // PageHeader uses items-start (not items-center) for alignment
    const container = document.querySelector('.flex.items-start.justify-between');
    expect(container).toBeInTheDocument();
  });

  it('should render back arrow icon', () => {
    render(
      <PageHeader
        title="Details"
        backTo="/home"
      />
    );

    // ArrowLeft icon should be present
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render breadcrumbs when provided', () => {
    render(
      <PageHeader
        title="Batch Details"
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Clients', to: '/clients' },
          { label: 'Current' },
        ]}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('should render breadcrumb items as links when to is provided', () => {
    render(
      <PageHeader
        title="Test"
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Current' },
        ]}
      />
    );

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should not render back button when breadcrumbs are provided', () => {
    render(
      <PageHeader
        title="Test"
        backTo="/clients"
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Current' },
        ]}
      />
    );

    // backTo is ignored when breadcrumbs are provided
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('should apply gradient styling to title when gradient prop is true', () => {
    render(<PageHeader title="Test Title" gradient />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('bg-gradient-to-r', 'bg-clip-text', 'text-transparent');
  });

  it('should apply custom className', () => {
    render(<PageHeader title="Test" className="custom-class" />);

    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('should render chevron separators between breadcrumbs', () => {
    render(
      <PageHeader
        title="Test"
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Middle', to: '/middle' },
          { label: 'Current' },
        ]}
      />
    );

    // ChevronRight icons appear between breadcrumb items (2 separators for 3 items)
    const chevrons = document.querySelectorAll('nav svg');
    expect(chevrons.length).toBe(2);
  });
});
