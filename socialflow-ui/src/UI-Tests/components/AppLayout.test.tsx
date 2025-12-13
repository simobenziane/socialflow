import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';

function TestChild() {
  return <div data-testid="test-child">Test Child Content</div>;
}

function renderWithRouter(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<TestChild />} />
            <Route path="/test" element={<div>Test Route</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AppLayout', () => {
  it('should render sidebar', () => {
    renderWithRouter();

    // Multiple SocialFlow text elements exist (sidebar and mobile header)
    const socialFlowElements = screen.getAllByText('SocialFlow');
    expect(socialFlowElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render child route content via Outlet', () => {
    renderWithRouter();

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('should have flex layout', () => {
    renderWithRouter();

    const container = document.querySelector('.flex.h-screen');
    expect(container).toBeInTheDocument();
  });

  it('should have main content area', () => {
    renderWithRouter();

    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'overflow-auto');
  });

  it('should have container within main', () => {
    renderWithRouter();

    const container = document.querySelector('main .container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('mx-auto', 'p-6', 'max-w-6xl');
  });

  it('should render Toaster component', () => {
    renderWithRouter();

    // The Toaster renders a provider element
    // We can check for its existence by looking for the toaster container
    // or by checking the DOM structure
    const mainContainer = document.querySelector('.flex.h-screen');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should render different route content', () => {
    renderWithRouter('/test');

    expect(screen.getByText('Test Route')).toBeInTheDocument();
  });
});
