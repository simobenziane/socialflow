import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout';
import { ErrorBoundary, LoadingSpinner } from '@/components/shared';

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Accounts = lazy(() => import('@/pages/Accounts'));
const Clients = lazy(() => import('@/pages/Clients'));
const ClientDetail = lazy(() => import('@/pages/ClientDetail'));
const CreateClient = lazy(() => import('@/pages/CreateClient'));
const BatchDetail = lazy(() => import('@/pages/BatchDetail'));
const ApprovalBoard = lazy(() => import('@/pages/ApprovalBoard'));
const Settings = lazy(() => import('@/pages/Settings'));
const AgentSettings = lazy(() => import('@/pages/AgentSettings'));
const CreateBatch = lazy(() => import('@/pages/CreateBatch'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner text="Loading..." />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/new" element={<CreateClient />} />
                <Route path="/clients/:slug" element={<ClientDetail />} />
                <Route path="/batches/:client/:batch" element={<BatchDetail />} />
                <Route path="/batches/:client/:batch/approve" element={<ApprovalBoard />} />
                <Route path="/batches/:client/new" element={<CreateBatch />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/agents" element={<AgentSettings />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
