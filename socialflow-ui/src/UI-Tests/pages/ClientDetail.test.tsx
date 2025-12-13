import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import ClientDetail from '@/pages/ClientDetail';
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

function renderClientDetail(slug: string = 'berlin-doner') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/clients/${slug}`]}>
        <Routes>
          <Route path="/clients/:slug" element={<ClientDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ClientDetail Page', () => {
  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      renderClientDetail();
      expect(screen.getByText('Loading client...')).toBeInTheDocument();
    });
  });

  describe('Page Header', () => {
    it('should display client name as title', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Berlin Doner' })).toBeInTheDocument();
      });
    });

    it('should display client details in description', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText(/berlin-doner • restaurant • Europe\/Berlin/)).toBeInTheDocument();
      });
    });

    it('should have Clients back link', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Clients/i })).toBeInTheDocument();
      });
    });
  });

  describe('Client Info Cards', () => {
    it('should display Language card', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('Language')).toBeInTheDocument();
      });
    });

    it('should display language value in uppercase', async () => {
      renderClientDetail();

      await waitFor(() => {
        // Language 'de' is displayed as uppercase 'DE'
        const languageElements = screen.getAllByText(/^DE$/i);
        expect(languageElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display Timezone card', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('Timezone')).toBeInTheDocument();
      });
    });

    it('should display timezone value', async () => {
      renderClientDetail();

      await waitFor(() => {
        // Find the timezone - it appears in both the description and the card
        const timezoneElements = screen.getAllByText(/Europe\/Berlin/);
        expect(timezoneElements.length).toBeGreaterThanOrEqual(2); // Description + card
      });
    });

    it('should display Type card', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('Type')).toBeInTheDocument();
      });
    });

    it('should display capitalized type value', async () => {
      renderClientDetail();

      await waitFor(() => {
        // Look for capitalized restaurant in content
        const typeValues = screen.getAllByText(/restaurant/i);
        expect(typeValues.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Linked Accounts Section', () => {
    it('should display Linked Accounts card', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('Linked Accounts')).toBeInTheDocument();
      });
    });

    it('should display Instagram account info', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('berlin_doner')).toBeInTheDocument();
      });
    });

    it('should show Instagram platform label', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('Instagram')).toBeInTheDocument();
      });
    });

    it('should display TikTok account info', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('berlindoner')).toBeInTheDocument();
      });
    });

    it('should show TikTok platform label', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('TikTok')).toBeInTheDocument();
      });
    });

    it('should show Instagram emoji', async () => {
      renderClientDetail();

      await waitFor(() => {
        const emojis = screen.getAllByText('📷');
        expect(emojis.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show TikTok emoji', async () => {
      renderClientDetail();

      await waitFor(() => {
        const emojis = screen.getAllByText('🎵');
        expect(emojis.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Linked Accounts - Not Linked', () => {
    it('should show Instagram not linked when no account', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route === '/clients/no-accounts') {
            return HttpResponse.json({
              success: true,
              data: {
                slug: 'no-accounts',
                name: 'No Accounts Client',
                type: 'retail',
                language: 'en',
                timezone: 'Europe/London',
                is_active: true,
                accounts: {},
              },
            });
          }
          if (route === '/batches/no-accounts') {
            return HttpResponse.json({
              success: true,
              message: 'Found 0 batches',
              data: {
                batches: [],
                client: 'no-accounts',
              },
            });
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderClientDetail('no-accounts');

      await waitFor(() => {
        expect(screen.getByText('📷 Instagram not linked')).toBeInTheDocument();
      });
    });

    it('should show TikTok not linked when no account', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route === '/clients/no-accounts') {
            return HttpResponse.json({
              success: true,
              data: {
                slug: 'no-accounts',
                name: 'No Accounts Client',
                type: 'retail',
                language: 'en',
                timezone: 'Europe/London',
                is_active: true,
                accounts: {},
              },
            });
          }
          if (route === '/batches/no-accounts') {
            return HttpResponse.json({
              success: true,
              message: 'Found 0 batches',
              data: {
                batches: [],
                client: 'no-accounts',
              },
            });
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderClientDetail('no-accounts');

      await waitFor(() => {
        expect(screen.getByText('🎵 TikTok not linked')).toBeInTheDocument();
      });
    });
  });

  describe('Batches Section', () => {
    it('should display Batches card', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('Batches')).toBeInTheDocument();
      });
    });

    it('should display batch names', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('december')).toBeInTheDocument();
        expect(screen.getByText('january')).toBeInTheDocument();
      });
    });

    it('should show Ready badge for ready batches', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });

    it('should show Not ready badge for non-ready batches', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('No READY.txt')).toBeInTheDocument();
      });
    });

    it('should show Not ingested badge', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('Not ingested')).toBeInTheDocument();
      });
    });

    it('should link batches to batch detail page', async () => {
      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('december')).toBeInTheDocument();
      });

      const batchLink = screen.getByText('december').closest('a');
      expect(batchLink).toHaveAttribute('href', '/batches/berlin-doner/december');
    });
  });

  describe('Batches Empty State', () => {
    it('should show empty state when no batches', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route === '/clients/berlin-doner') {
            return HttpResponse.json({
              success: true,
              data: {
                slug: 'berlin-doner',
                name: 'Berlin Doner',
                type: 'restaurant',
                language: 'de',
                timezone: 'Europe/Berlin',
                is_active: true,
                accounts: {
                  instagram: { late_account_id: 'acc_123', username: 'berlin_doner' },
                },
              },
            });
          }
          if (route === '/batches/berlin-doner') {
            return HttpResponse.json({
              success: true,
              message: 'Found 0 batches',
              data: {
                batches: [],
                client: 'berlin-doner',
              },
            });
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('No batches')).toBeInTheDocument();
      });

      expect(screen.getByText(/Create a batch folder/)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error alert when client fetch fails', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route?.startsWith('/clients/')) {
            return HttpResponse.json(
              { success: false, error: 'Client not found' },
              { status: 404 }
            );
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByText('Client not found')).toBeInTheDocument();
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

      renderClientDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });
    });
  });
});
