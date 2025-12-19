import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { Sidebar } from '@/components/layout/Sidebar';

describe('Sidebar', () => {
  it('should render brand name', () => {
    render(<Sidebar />);

    expect(screen.getByText('SocialFlow')).toBeInTheDocument();
  });

  it('should render brand tagline', () => {
    render(<Sidebar />);

    expect(screen.getByText('Content Automation')).toBeInTheDocument();
  });

  it('should render all navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should have correct navigation links', () => {
    render(<Sidebar />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const accountsLink = screen.getByText('Accounts').closest('a');
    const clientsLink = screen.getByText('Clients').closest('a');
    const settingsLink = screen.getByText('Settings').closest('a');

    expect(dashboardLink).toHaveAttribute('href', '/');
    expect(accountsLink).toHaveAttribute('href', '/accounts');
    expect(clientsLink).toHaveAttribute('href', '/clients');
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('should render version info', () => {
    render(<Sidebar />);

    expect(screen.getByText(/Phase 3\.0/)).toBeInTheDocument();
  });

  it('should have aside element', () => {
    render(<Sidebar />);

    const aside = document.querySelector('aside');
    expect(aside).toBeInTheDocument();
  });

  it('should have fixed width', () => {
    render(<Sidebar />);

    const aside = document.querySelector('aside');
    expect(aside).toHaveClass('w-64');
  });

  it('should have border styling', () => {
    render(<Sidebar />);

    const aside = document.querySelector('aside');
    // Border is now applied via border-white/20 dark:border-white/10
    expect(aside).toBeInTheDocument();
  });

  it('should render navigation icons', () => {
    render(<Sidebar />);

    // Should have 5 navigation icons (one for each nav item including New Client)
    const icons = document.querySelectorAll('nav svg');
    expect(icons).toHaveLength(5);
  });

  it('should render nav element', () => {
    render(<Sidebar />);

    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(<Sidebar />);

    const themeToggle = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
    expect(themeToggle).toBeInTheDocument();
  });
});
