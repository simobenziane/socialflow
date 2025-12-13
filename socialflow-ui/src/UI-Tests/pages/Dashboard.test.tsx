import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import Dashboard from '@/pages/Dashboard';
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

function renderDashboard() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Dashboard', () => {
  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      renderDashboard();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });
  });

  describe('Stats Cards', () => {
    it('should display client count', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Clients')).toBeInTheDocument();
      });

      // Check for the specific text
      expect(screen.getByText('active clients')).toBeInTheDocument();
    });

    it('should display batches count', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Batches')).toBeInTheDocument();
      });

      expect(screen.getByText('content batches')).toBeInTheDocument();
    });

    it('should display content count', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      expect(screen.getByText('total items')).toBeInTheDocument();
    });

    it('should display alerts count', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Alerts')).toBeInTheDocument();
      });

      expect(screen.getByText('need attention')).toBeInTheDocument();
    });
  });

  describe('Account Health Section', () => {
    it('should display Account Health card', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Account Health')).toBeInTheDocument();
      });
    });

    it('should display healthy badge', async () => {
      renderDashboard();

      await waitFor(() => {
        // Look for the healthy badge specifically (e.g., "1 healthy")
        expect(screen.getByText(/\d+ healthy/)).toBeInTheDocument();
      });
    });

    it('should display warning accounts', async () => {
      renderDashboard();

      await waitFor(() => {
        // The mock data has a warning account (berlindoner)
        expect(screen.getByText('berlindoner')).toBeInTheDocument();
      });

      expect(screen.getByText(/Expires in/)).toBeInTheDocument();
    });

    it('should display Sync button', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should display Quick Actions card', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });

    it('should have New Client button with correct link', async () => {
      renderDashboard();

      await waitFor(() => {
        const newClientLink = screen.getByRole('link', { name: /New Client/i });
        expect(newClientLink).toHaveAttribute('href', '/clients/new');
      });
    });

    it('should have View Accounts button with correct link', async () => {
      renderDashboard();

      await waitFor(() => {
        const viewAccountsLink = screen.getByRole('link', { name: /View Accounts/i });
        expect(viewAccountsLink).toHaveAttribute('href', '/accounts');
      });
    });

    it('should have View Clients button with correct link', async () => {
      renderDashboard();

      await waitFor(() => {
        const viewClientsLink = screen.getByRole('link', { name: /View Clients/i });
        expect(viewClientsLink).toHaveAttribute('href', '/clients');
      });
    });
  });

  describe('External Tools', () => {
    it('should display External Tools card', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('External Tools')).toBeInTheDocument();
      });
    });

    it('should have n8n Dashboard link', async () => {
      renderDashboard();

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /n8n Dashboard/i });
        expect(link).toHaveAttribute('href', 'http://localhost:5678');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });

    it('should have Late.com link', async () => {
      renderDashboard();

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Late\.com/i });
        expect(link).toHaveAttribute('href', 'https://app.getlate.dev');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Page Header', () => {
    it('should display Dashboard title', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      });
    });

    it('should have Refresh button', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error alert when API fails', async () => {
      server.use(
        http.get(`${API_BASE}/api`, () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        })
      );

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
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

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });
    });
  });

  describe('Sync Functionality', () => {
    it('should trigger sync when Sync is clicked', async () => {
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

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Sync'));

      await waitFor(() => {
        expect(syncCalled).toBe(true);
      });
    });
  });
});
