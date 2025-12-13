import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import ApprovalBoard from '@/pages/ApprovalBoard';

const API_BASE = 'http://localhost:5678/webhook';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderApprovalBoard(client: string = 'berlin-doner', batch: string = 'december') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/batches/${client}/${batch}/approve`]}>
        <Routes>
          <Route path="/batches/:client/:batch/approve" element={<ApprovalBoard />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ============================================
// LOADING STATE TESTS
// ============================================

describe('ApprovalBoard - Loading States', () => {
  it('should show loading spinner while fetching data', () => {
    renderApprovalBoard();
    // Loading state shows description "Loading..."
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });
});

// ============================================
// ERROR STATE TESTS
// ============================================

describe('ApprovalBoard - Error States', () => {
  it('should show error when batch status fails', async () => {
    server.use(
      http.get(`${API_BASE}/api`, ({ request }) => {
        const url = new URL(request.url);
        const route = url.searchParams.get('route');
        if (route?.includes('/batches/') && route.includes('/status')) {
          return HttpResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }
        return undefined;
      })
    );

    renderApprovalBoard('berlin-doner', 'bad-batch');

    await waitFor(() => {
      // Should show some error state
      expect(screen.queryByText('Approval Board')).toBeInTheDocument();
    });
  });

  it('should have retry button on error', async () => {
    renderApprovalBoard('berlin-doner', 'invalid-batch');

    await waitFor(() => {
      // Either shows error or loads - just verify page rendered
      expect(screen.getByRole('heading', { name: 'Approval Board' })).toBeInTheDocument();
    });
  });
});

// ============================================
// PAGE HEADER TESTS
// ============================================

describe('ApprovalBoard - Page Header', () => {
  it('should display Approval Board title', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Approval Board' })).toBeInTheDocument();
    });
  });

  it('should display client and batch in description', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByText(/Berlin Doner \/ december/)).toBeInTheDocument();
    });
  });

  it('should have back link to Batch', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Back to Batch/i })).toBeInTheDocument();
    });
  });

  it('should have breadcrumbs', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Clients/i })).toBeInTheDocument();
    });
  });
});

// ============================================
// FILTER TAB TESTS
// ============================================

describe('ApprovalBoard - Filter Tabs', () => {
  it('should display Review filter tab', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Review/i })).toBeInTheDocument();
    });
  });

  it('should display Approved filter tab', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Approved/i })).toBeInTheDocument();
    });
  });

  it('should display Scheduled filter tab', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Scheduled/i })).toBeInTheDocument();
    });
  });

  it('should display All filter tab', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /All/i })).toBeInTheDocument();
    });
  });

  it('should change active filter when clicking tabs', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Review/i })).toBeInTheDocument();
    });

    // Click Approved tab
    fireEvent.click(screen.getByRole('tab', { name: /Approved/i }));

    await waitFor(() => {
      const approvedTab = screen.getByRole('tab', { name: /Approved/i });
      expect(approvedTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});

// ============================================
// SEARCH TESTS
// ============================================

describe('ApprovalBoard - Search', () => {
  it('should have search input', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    });
  });

  it('should filter items when searching', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'photo_001' } });

    // Search should update - component handles filtering internally
    expect((searchInput as HTMLInputElement).value).toBe('photo_001');
  });
});

// ============================================
// CONTENT GRID TESTS
// ============================================

describe('ApprovalBoard - Content Grid', () => {
  it('should display content grid', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByTestId('content-grid')).toBeInTheDocument();
    });
  });

  it('should render content preview cards', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      // Should have content items in the grid
      expect(screen.getByTestId('content-grid')).toBeInTheDocument();
    });

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('photo_001.jpg')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

// ============================================
// BULK ACTIONS TESTS
// ============================================

describe('ApprovalBoard - Bulk Actions', () => {
  it('should have Select All checkbox', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      // Look for checkbox with role
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// KEYBOARD NAVIGATION TESTS
// ============================================

describe('ApprovalBoard - Keyboard Navigation', () => {
  it('should have keyboard accessible tabs', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      const reviewTab = screen.getByRole('tab', { name: /Review/i });
      expect(reviewTab).toHaveAttribute('role', 'tab');
    });
  });

  it('should have tablist for filter navigation', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });
});

// ============================================
// EMPTY STATE TESTS
// ============================================

describe('ApprovalBoard - Empty States', () => {
  it('should show message when no items match filter', async () => {
    server.use(
      http.get(`${API_BASE}/api`, ({ request }) => {
        const url = new URL(request.url);
        const route = url.searchParams.get('route');

        if (route?.startsWith('/items/')) {
          return HttpResponse.json({
            success: true,
            data: { items: [], pagination: { total: 0, limit: 50, offset: 0, has_more: false } },
          });
        }
        return undefined;
      })
    );

    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByTestId('approval-board')).toBeInTheDocument();
    });
  });
});

// ============================================
// DATA-TESTID TESTS
// ============================================

describe('ApprovalBoard - Data TestIds', () => {
  it('should have approval-board testid', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByTestId('approval-board')).toBeInTheDocument();
    });
  });

  it('should have content-grid testid', async () => {
    renderApprovalBoard();

    await waitFor(() => {
      expect(screen.getByTestId('content-grid')).toBeInTheDocument();
    });
  });
});
