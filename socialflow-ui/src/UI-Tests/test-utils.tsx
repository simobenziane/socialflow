import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a new QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

// Wrapper with QueryClient and BrowserRouter
function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// Wrapper with only QueryClient (no router)
export function QueryWrapper({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Custom render that wraps with all providers
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// ============================================
// VIEWPORT TESTING UTILITIES
// ============================================

/**
 * Common viewport sizes for responsive testing
 */
export const VIEWPORTS = {
  mobile: 320,
  mobileMedium: 375,
  mobileLarge: 480,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1280,
  desktopWide: 1440,
  desktop4K: 2560,
} as const;

/**
 * Set the viewport size for testing
 * @param width - Viewport width in pixels
 * @param height - Viewport height in pixels (default: 800)
 */
export function setViewport(width: number, height: number = 800) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    writable: true,
    configurable: true,
  });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Reset viewport to default desktop size
 */
export function resetViewport() {
  setViewport(VIEWPORTS.desktop, 768);
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };
