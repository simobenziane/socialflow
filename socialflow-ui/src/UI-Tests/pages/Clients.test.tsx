import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import Clients from '@/pages/Clients';
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

function renderClients() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Clients />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Clients Page', () => {
  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      renderClients();
      expect(screen.getByText('Loading clients...')).toBeInTheDocument();
    });
  });

  describe('Page Header', () => {
    it('should display Clients title', async () => {
      renderClients();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Clients' })).toBeInTheDocument();
      });
    });

    it('should show client count in description', async () => {
      renderClients();

      await waitFor(() => {
        // Description is now in the format "2 clients"
        expect(screen.getByText(/2 client/)).toBeInTheDocument();
      });
    });

    it('should have Dashboard breadcrumb link', async () => {
      renderClients();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
      });
    });

    it('should have New Client button', async () => {
      renderClients();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /New Client/i })).toBeInTheDocument();
      });
    });

    it('should link New Client to create page', async () => {
      renderClients();

      await waitFor(() => {
        const newClientLink = screen.getByRole('link', { name: /New Client/i });
        expect(newClientLink).toHaveAttribute('href', '/clients/new');
      });
    });
  });

  describe('Client Cards', () => {
    it('should display first client name', async () => {
      renderClients();

      await waitFor(() => {
        expect(screen.getByText('Berlin Doner')).toBeInTheDocument();
      });
    });

    it('should display second client name', async () => {
      renderClients();

      await waitFor(() => {
        expect(screen.getByText('Cafe Milan')).toBeInTheDocument();
      });
    });

    it('should display client cards as links', async () => {
      renderClients();

      await waitFor(() => {
        // ClientCard wraps entire card in Link to /clients/:slug
        const links = screen.getAllByRole('link');
        const clientLinks = links.filter((link) =>
          link.getAttribute('href')?.startsWith('/clients/') &&
          !link.getAttribute('href')?.includes('/new')
        );
        expect(clientLinks.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should link to correct client detail pages', async () => {
      renderClients();

      await waitFor(() => {
        // ClientCard wraps in Link, so look for links to client detail pages
        const berlinLink = screen.getByRole('link', { name: /Berlin Doner/i });
        const milanLink = screen.getByRole('link', { name: /Cafe Milan/i });
        expect(berlinLink).toHaveAttribute('href', '/clients/berlin-doner');
        expect(milanLink).toHaveAttribute('href', '/clients/cafe-milan');
      });
    });
  });

  describe('Account Badges', () => {
    it('should display Instagram usernames', async () => {
      renderClients();

      await waitFor(() => {
        expect(screen.getByText('berlin_doner')).toBeInTheDocument();
        expect(screen.getByText('cafe_milan')).toBeInTheDocument();
      });
    });

    it('should display TikTok username for Berlin Doner', async () => {
      renderClients();

      await waitFor(() => {
        expect(screen.getByText('berlindoner')).toBeInTheDocument();
      });
    });

    it('should show No platforms linked when no accounts', async () => {
      // Mock a client with no accounts
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route === '/clients') {
            return HttpResponse.json({
              success: true,
              count: 1,
              data: [{
                slug: 'test-client',
                name: 'Test Client',
                type: 'restaurant',
                language: 'en',
                timezone: 'Europe/London',
                is_active: true,
                accounts: {},
              }],
            });
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderClients();

      await waitFor(() => {
        expect(screen.getByText('No platforms linked')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no clients', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route === '/clients') {
            return HttpResponse.json({
              success: true,
              count: 0,
              data: [],
            });
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderClients();

      await waitFor(() => {
        expect(screen.getByText('No clients yet')).toBeInTheDocument();
      });

      expect(screen.getByText(/Create your first client/)).toBeInTheDocument();
    });

    it('should show Create Client button in empty state', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route === '/clients') {
            return HttpResponse.json({
              success: true,
              count: 0,
              data: [],
            });
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderClients();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Create Client/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error alert when API fails', async () => {
      server.use(
        http.get(`${API_BASE}/api`, () => {
          return HttpResponse.json(
            { success: false, error: 'Failed to fetch clients' },
            { status: 500 }
          );
        })
      );

      renderClients();

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch clients')).toBeInTheDocument();
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

      renderClients();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });
    });
  });
});
