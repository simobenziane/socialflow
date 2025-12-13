import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientCard } from '@/components/ClientCard';
import type { Client } from '@/api/types';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const mockClientWithBoth: Client = {
  slug: 'berlin-doner',
  name: 'Berlin Doner',
  type: 'restaurant',
  language: 'de',
  timezone: 'Europe/Berlin',
  is_active: true,
  accounts: {
    instagram: { late_account_id: 'acc_123', username: 'berlin_doner' },
    tiktok: { late_account_id: 'acc_456', username: 'berlindoner' },
  },
  schedule: { feed_time: '12:00', story_time: '18:00' },
};

const mockClientInstagramOnly: Client = {
  slug: 'cafe-milan',
  name: 'Cafe Milan',
  type: 'cafe',
  language: 'it',
  timezone: 'Europe/Rome',
  is_active: true,
  accounts: {
    instagram: { late_account_id: 'acc_789', username: 'cafe_milan' },
  },
};

const mockClientNoAccounts: Client = {
  slug: 'new-business',
  name: 'New Business',
  type: 'retail',
  language: 'en',
  timezone: 'Europe/London',
  is_active: true,
  accounts: {},
};

function renderClientCard(client: Client) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ClientCard client={client} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ClientCard', () => {
  describe('Basic Rendering', () => {
    it('should render client name', () => {
      renderClientCard(mockClientWithBoth);
      expect(screen.getByText('Berlin Doner')).toBeInTheDocument();
    });

    it('should render client slug', () => {
      renderClientCard(mockClientWithBoth);
      expect(screen.getByText(/berlin-doner/)).toBeInTheDocument();
    });

    it('should render client initials in header', () => {
      renderClientCard(mockClientWithBoth);
      // Berlin Doner -> BD
      expect(screen.getByText('BD')).toBeInTheDocument();
    });

    it('should render initials for single word name', () => {
      renderClientCard(mockClientNoAccounts);
      // New Business -> NB
      expect(screen.getByText('NB')).toBeInTheDocument();
    });
  });

  describe('Card Link', () => {
    it('should wrap entire card in link to client detail', () => {
      renderClientCard(mockClientWithBoth);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/clients/berlin-doner');
    });

    it('should link to correct client detail page', () => {
      renderClientCard(mockClientInstagramOnly);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/clients/cafe-milan');
    });
  });

  describe('Account Badges - Both Platforms', () => {
    it('should show Instagram account badge when linked', () => {
      renderClientCard(mockClientWithBoth);
      expect(screen.getByText('berlin_doner')).toBeInTheDocument();
    });

    it('should show TikTok account badge when linked', () => {
      renderClientCard(mockClientWithBoth);
      expect(screen.getByText('berlindoner')).toBeInTheDocument();
    });

    it('should show Instagram icon (lucide icon)', () => {
      renderClientCard(mockClientWithBoth);
      // Instagram icon is an SVG from lucide-react
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });

    it('should show TikTok abbreviation', () => {
      renderClientCard(mockClientWithBoth);
      expect(screen.getByText('TT')).toBeInTheDocument();
    });
  });

  describe('Account Badges - Instagram Only', () => {
    it('should show Instagram username', () => {
      renderClientCard(mockClientInstagramOnly);
      expect(screen.getByText('cafe_milan')).toBeInTheDocument();
    });

    it('should not show TikTok badge when not linked', () => {
      renderClientCard(mockClientInstagramOnly);
      expect(screen.queryByText('TT')).not.toBeInTheDocument();
    });
  });

  describe('Account Badges - No Accounts', () => {
    it('should show No platforms linked message', () => {
      renderClientCard(mockClientNoAccounts);
      expect(screen.getByText('No platforms linked')).toBeInTheDocument();
    });

    it('should not show platform badges when none linked', () => {
      renderClientCard(mockClientNoAccounts);
      expect(screen.queryByText('TT')).not.toBeInTheDocument();
    });
  });

  describe('Card Structure', () => {
    it('should render as a Card with interactive variant', () => {
      renderClientCard(mockClientWithBoth);
      // The card has group and cursor-pointer classes
      const card = document.querySelector('.group.cursor-pointer');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Delete Button', () => {
    it('should have delete button with aria-label', () => {
      renderClientCard(mockClientWithBoth);
      const deleteButton = screen.getByRole('button', { name: /delete berlin doner/i });
      expect(deleteButton).toBeInTheDocument();
    });
  });
});
