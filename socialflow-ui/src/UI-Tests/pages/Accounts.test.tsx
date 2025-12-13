import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import Accounts from '@/pages/Accounts';
import { server } from '../mocks/server';

const API_BASE = 'http://localhost:5678/webhook';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderAccounts() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Accounts />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Accounts Page', () => {
  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      renderAccounts();
      expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
    });
  });

  describe('Page Header', () => {
    it('should display Late Accounts title', async () => {
      renderAccounts();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Late Accounts' })).toBeInTheDocument();
      });
    });

    it('should have Dashboard back link', async () => {
      renderAccounts();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
      });
    });

    it('should have Sync Now button', async () => {
      renderAccounts();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Sync Now/i })).toBeInTheDocument();
      });
    });

    it('should display last synced timestamp', async () => {
      renderAccounts();

      await waitFor(() => {
        expect(screen.getByText(/Last synced:/)).toBeInTheDocument();
      });
    });
  });

  describe('Account Grouping', () => {
    it('should display Instagram section header', async () => {
      renderAccounts();

      await waitFor(() => {
        expect(screen.getByText(/Instagram \(2\)/)).toBeInTheDocument();
      });
    });

    it('should display TikTok section header', async () => {
      renderAccounts();

      await waitFor(() => {
        expect(screen.getByText(/TikTok \(1\)/)).toBeInTheDocument();
      });
    });

    it('should show Instagram emoji in section header', async () => {
      renderAccounts();

      await waitFor(() => {
        const instagramSection = screen.getByText(/Instagram/);
        expect(instagramSection.parentElement?.textContent).toContain('📷');
      });
    });

    it('should show TikTok emoji in section header', async () => {
      renderAccounts();

      await waitFor(() => {
        expect(screen.getByText(/TikTok \(1\)/)).toBeInTheDocument();
      });

      // Check for emoji in the page
      const tiktokEmojis = screen.getAllByText('🎵');
      expect(tiktokEmojis.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Account Cards', () => {
    it('should display Instagram account username', async () => {
      renderAccounts();

      await waitFor(() => {
        expect(screen.getByText('berlin_doner')).toBeInTheDocument();
      });
    });

    it('should display TikTok account username', async () => {
      renderAccounts();

      await waitFor(() => {
        expect(screen.getByText('berlindoner')).toBeInTheDocument();
      });
    });

    it('should display health badges', async () => {
      renderAccounts();

      await waitFor(() => {
        const healthyBadges = screen.getAllByText('Healthy');
        const warningBadges = screen.getAllByText('Warning');

        expect(healthyBadges.length).toBeGreaterThan(0);
        expect(warningBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Sync Functionality', () => {
    it('should trigger sync when Sync Now is clicked', async () => {
      let syncCalled = false;
      server.use(
        // Sync now calls the direct webhook /w0-sync
        http.post(`${API_BASE}/w0-sync`, () => {
          syncCalled = true;
          return HttpResponse.json({
            success: true,
            workflow: 'W0-Sync',
          });
        })
      );

      renderAccounts();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Sync Now/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Sync Now/i }));

      await waitFor(() => {
        expect(syncCalled).toBe(true);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no accounts', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route === '/late/accounts') {
            return HttpResponse.json({
              success: true,
              accounts: [],
              profiles: [],
              synced_at: '2024-01-15T09:00:00Z',
            });
          }
          if (route === '/clients') {
            return HttpResponse.json({
              success: true,
              count: 0,
              clients: [],
            });
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderAccounts();

      await waitFor(() => {
        expect(screen.getByText('No accounts found')).toBeInTheDocument();
      });

      expect(screen.getByText('Sync with Late.com to see your connected accounts')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sync Accounts/i })).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error alert when API fails', async () => {
      server.use(
        http.get(`${API_BASE}/api`, () => {
          return HttpResponse.json(
            { success: false, error: 'Failed to fetch accounts' },
            { status: 500 }
          );
        })
      );

      renderAccounts();

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch accounts')).toBeInTheDocument();
      });
    });

    it('should have Try Again button on error', async () => {
      server.use(
        http.get(`${API_BASE}/api`, () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        })
      );

      renderAccounts();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });
    });
  });
});
