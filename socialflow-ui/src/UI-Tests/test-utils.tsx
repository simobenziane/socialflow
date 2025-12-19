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

// ============================================
// FILE TESTING UTILITIES
// ============================================

/**
 * Create a mock File object for testing file uploads
 * @param name - File name with extension
 * @param type - MIME type (e.g., 'image/jpeg', 'video/mp4')
 * @param size - File size in bytes (default: 1024)
 */
export function createMockFile(name: string, type: string, size = 1024): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

/**
 * Create multiple mock files for batch upload testing
 * @param count - Number of files to create
 * @param prefix - File name prefix (default: 'photo')
 * @param type - MIME type (default: 'image/jpeg')
 */
export function createMockFiles(
  count: number,
  prefix = 'photo',
  type = 'image/jpeg'
): File[] {
  const ext = type.startsWith('image/') ? 'jpg' : 'mp4';
  return Array.from({ length: count }, (_, i) =>
    createMockFile(`${prefix}_${i + 1}.${ext}`, type)
  );
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };
