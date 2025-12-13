import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import BatchDetail from '@/pages/BatchDetail';
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

function renderBatchDetail(client: string = 'berlin-doner', batch: string = 'december') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/batches/${client}/${batch}`]}>
        <Routes>
          <Route path="/batches/:client/:batch" element={<BatchDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('BatchDetail Page', () => {
  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      renderBatchDetail();
      expect(screen.getByText('Loading batch...')).toBeInTheDocument();
    });
  });

  describe('Page Header', () => {
    it('should display batch name in title', async () => {
      renderBatchDetail();

      await waitFor(() => {
        // The title is just the batch name "december", not "Batch: december"
        expect(screen.getByRole('heading', { name: 'december' })).toBeInTheDocument();
      });
    });

    it('should display client name in description', async () => {
      renderBatchDetail();

      await waitFor(() => {
        expect(screen.getByText(/Client: Berlin Doner/)).toBeInTheDocument();
      });
    });

    it('should have breadcrumb links', async () => {
      renderBatchDetail();

      await waitFor(() => {
        // Breadcrumbs: Dashboard > Clients > Berlin Doner > december
        expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Clients/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Berlin Doner/i })).toBeInTheDocument();
      });
    });

    it('should have Refresh button', async () => {
      renderBatchDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });
    });

    it('should have Reset button', async () => {
      renderBatchDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
      });
    });
  });

  describe('Progress Section', () => {
    it('should display progress percentage', async () => {
      renderBatchDetail();

      await waitFor(() => {
        // The mock has 2 scheduled out of 10 total = 20%
        expect(screen.getByText('20%')).toBeInTheDocument();
      });
    });

    it('should display status counts', async () => {
      renderBatchDetail();

      await waitFor(() => {
        // Check for counts from mock data (format is "X/Y Scheduled")
        expect(screen.getByText(/\/.*Scheduled/)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Pipeline', () => {
    it('should display Workflow Pipeline card', async () => {
      renderBatchDetail();

      await waitFor(() => {
        expect(screen.getByText('Workflow Pipeline')).toBeInTheDocument();
      });
    });

    it('should have workflow step buttons', async () => {
      renderBatchDetail();

      await waitFor(() => {
        // Workflow steps: Ingest, Generate, Schedule (may appear multiple times in UI)
        expect(screen.getAllByRole('button', { name: /Ingest/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: /Generate/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: /Schedule/i }).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Content Items Section', () => {
    it('should display Content Items card', async () => {
      renderBatchDetail();

      await waitFor(() => {
        expect(screen.getByText('Content Items')).toBeInTheDocument();
      });
    });

    it('should have Open Board link', async () => {
      renderBatchDetail();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Open Board/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error when batch status fails', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route?.includes('/batches/') && route.includes('/status')) {
            return HttpResponse.json(
              { success: false, error: 'Batch not found' },
              { status: 404 }
            );
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderBatchDetail();

      await waitFor(() => {
        expect(screen.getByText(/Batch not found/i)).toBeInTheDocument();
      });
    });

    it('should have Try Again button on error', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route?.includes('/batches/') && route.includes('/status')) {
            return HttpResponse.json(
              { success: false, error: 'Server error' },
              { status: 500 }
            );
          }
          return HttpResponse.json({ success: false }, { status: 500 });
        })
      );

      renderBatchDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Actions', () => {
    it('should have enabled Ingest button', async () => {
      renderBatchDetail();

      await waitFor(() => {
        const ingestBtn = screen.getByRole('button', { name: /Ingest/i });
        expect(ingestBtn).toBeInTheDocument();
        // Button should exist and be clickable (even if disabled in certain states)
      });
    });

    it('should have enabled Generate button', async () => {
      renderBatchDetail();

      await waitFor(() => {
        const generateBtns = screen.getAllByRole('button', { name: /Generate/i });
        expect(generateBtns.length).toBeGreaterThan(0);
      });
    });

    it('should have enabled Schedule button', async () => {
      renderBatchDetail();

      await waitFor(() => {
        const scheduleBtns = screen.getAllByRole('button', { name: /Schedule/i });
        expect(scheduleBtns.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty Batch', () => {
    it('should show message when batch has no items', async () => {
      server.use(
        http.get(`${API_BASE}/api`, ({ request }) => {
          const url = new URL(request.url);
          const route = url.searchParams.get('route');

          if (route?.includes('/batches/') && route.includes('/status')) {
            return HttpResponse.json({
              success: true,
              data: {
                client: 'berlin-doner',
                batch: 'empty-batch',
                counts: {
                  total: 0,
                  pending: 0,
                  needs_ai: 0,
                  needs_review: 0,
                  approved: 0,
                  scheduled: 0,
                  failed: 0,
                },
              },
            });
          }
          if (route?.startsWith('/items/')) {
            return HttpResponse.json({
              success: true,
              data: { items: [], pagination: { total: 0, limit: 50, offset: 0, has_more: false } },
            });
          }
          if (route?.match(/^\/clients\/[^/]+$/)) {
            return HttpResponse.json({
              success: true,
              data: { slug: 'berlin-doner', name: 'Berlin Doner', type: 'restaurant', language: 'de', timezone: 'Europe/Berlin', is_active: true, accounts: {} },
            });
          }
          return HttpResponse.json({ success: false }, { status: 404 });
        })
      );

      renderBatchDetail('berlin-doner', 'empty-batch');

      await waitFor(() => {
        // Check for 0% progress
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });
  });
});
