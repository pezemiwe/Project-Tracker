import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Toaster } from './components/ui/toaster';
import { Announcer } from './components/ui/announcer';
import { LoadingState } from './components/ui/loading-state';
import { ErrorBoundary } from './components/error-boundary';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const ObjectivesPage = lazy(() => import('./pages/ObjectivesPage').then(m => ({ default: m.ObjectivesPage })));
const ObjectiveDetailPage = lazy(() => import('./pages/ObjectiveDetailPage').then(m => ({ default: m.ObjectiveDetailPage })));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then(m => ({ default: m.ApprovalsPage })));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const ImportExportPage = lazy(() => import('./pages/ImportExportPage').then(m => ({ default: m.ImportExportPage })));
const SpendAnalysisPage = lazy(() => import('./pages/SpendAnalysisPage').then(m => ({ default: m.SpendAnalysisPage })));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingState size="lg" message="Loading application..." />
    </div>
  );
}

function RootComponent() {
  useSessionTimeout();
  return (
    <>
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <Layout>
        <main id="main-content" role="main">
          <Outlet />
        </main>
      </Layout>

      {/* Accessibility announcements */}
      <Announcer />

      {/* Toast notifications */}
      <Toaster />
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPage />
    </Suspense>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <ErrorBoundary level="page">
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Suspense>
    </ErrorBoundary>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ProtectedRoute allowedRoles={['Admin']}>
        <UsersPage />
      </ProtectedRoute>
    </Suspense>
  ),
});

const objectivesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/objectives',
  component: () => (
    <ErrorBoundary level="page">
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <ObjectivesPage />
        </ProtectedRoute>
      </Suspense>
    </ErrorBoundary>
  ),
});

const objectiveDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/objectives/$id',
  component: () => (
    <ErrorBoundary level="page">
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <ObjectiveDetailPage />
        </ProtectedRoute>
      </Suspense>
    </ErrorBoundary>
  ),
});

const activitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activities',
  validateSearch: (search: Record<string, unknown>) => ({
    activityId: (search.activityId as string) || undefined,
  }),
  component: () => (
    <ErrorBoundary level="page">
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <ActivitiesPage />
        </ProtectedRoute>
      </Suspense>
    </ErrorBoundary>
  ),
});

const approvalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/approvals',
  component: () => (
    <ErrorBoundary level="page">
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <ApprovalsPage />
        </ProtectedRoute>
      </Suspense>
    </ErrorBoundary>
  ),
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ProtectedRoute allowedRoles={['Admin', 'Auditor']}>
        <AuditPage />
      </ProtectedRoute>
    </Suspense>
  ),
});

const importExportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/import-export',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ProtectedRoute allowedRoles={['Admin']}>
        <ImportExportPage />
      </ProtectedRoute>
    </Suspense>
  ),
});

const spendAnalysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spend-analysis',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ProtectedRoute>
        <SpendAnalysisPage />
      </ProtectedRoute>
    </Suspense>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminSettingsPage />
      </ProtectedRoute>
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([loginRoute, dashboardRoute, usersRoute, objectivesRoute, objectiveDetailRoute, activitiesRoute, approvalsRoute, auditRoute, importExportRoute, spendAnalysisRoute, settingsRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <ErrorBoundary level="app">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
