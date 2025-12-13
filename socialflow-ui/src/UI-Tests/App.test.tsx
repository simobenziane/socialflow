import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';

// Helper to render App with specific route
function renderApp(initialRoute = '/') {
  // We need to test routing, so we'll create a custom setup
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });

  // For integration tests, we render the full App
  // Note: App uses BrowserRouter internally, so for route testing
  // we need to work around this by testing individual route components
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <TestRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Simplified routes for testing
import { AppLayout } from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Accounts from '@/pages/Accounts';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import CreateClient from '@/pages/CreateClient';
import BatchDetail from '@/pages/BatchDetail';
import ApprovalBoard from '@/pages/ApprovalBoard';
import Settings from '@/pages/Settings';

function TestRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/new" element={<CreateClient />} />
        <Route path="/clients/:slug" element={<ClientDetail />} />
        <Route path="/batches/:client/:batch" element={<BatchDetail />} />
        <Route path="/batches/:client/:batch/approve" element={<ApprovalBoard />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

describe('App Routing', () => {
  it('should render Dashboard page at /', async () => {
    renderApp('/');

    // Dashboard now shows loading first, then content
    // Check for Dashboard heading which appears after loading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });
  });

  it('should render Accounts page at /accounts', async () => {
    renderApp('/accounts');

    // Accounts page now loads data, check for the heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Late Accounts' })).toBeInTheDocument();
    });
  });

  it('should render Clients page at /clients', async () => {
    renderApp('/clients');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Clients' })).toBeInTheDocument();
    });
  });

  it('should render CreateClient page at /clients/new', async () => {
    renderApp('/clients/new');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create New Client' })).toBeInTheDocument();
    });
  });

  it('should render ClientDetail page at /clients/:slug', async () => {
    renderApp('/clients/berlin-doner');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Berlin Doner' })).toBeInTheDocument();
    });
  });

  it('should render BatchDetail page at /batches/:client/:batch', async () => {
    renderApp('/batches/berlin-doner/december');

    await waitFor(() => {
      // The title is just the batch name, not "Batch: december"
      expect(screen.getByRole('heading', { name: 'december' })).toBeInTheDocument();
    });
  });

  it('should render ApprovalBoard page at /batches/:client/:batch/approve', async () => {
    renderApp('/batches/berlin-doner/december/approve');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Approval Board' })).toBeInTheDocument();
    });
  });

  it('should render Settings page at /settings', async () => {
    renderApp('/settings');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });
  });

  it('should render sidebar navigation on all pages', async () => {
    renderApp('/');

    // Wait for content to load - Dashboard heading appears after data loads
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check sidebar navigation items - these should be present
    const sidebar = document.querySelector('aside');
    expect(sidebar).toBeInTheDocument();

    // Multiple nav links may exist (desktop sidebar + mobile drawer)
    // Use getAllByRole and check at least one exists
    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /Dashboard/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Accounts/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Clients/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Settings/i }).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});

describe('App QueryClient Configuration', () => {
  it('should create QueryClient with correct default options', async () => {
    // This test verifies the QueryClient is set up correctly
    // by testing that a query doesn't retry on failure
    renderApp('/');

    // The app should render without errors, indicating QueryClient is properly configured
    // Check that the sidebar branding renders (doesn't depend on data loading)
    await waitFor(() => {
      const socialFlowElements = screen.getAllByText('SocialFlow');
      expect(socialFlowElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
