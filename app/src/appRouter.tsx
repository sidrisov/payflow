import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoadingPayflowEntryLogo from './components/LoadingPayflowEntryLogo';

// Dynamically import all pages
const LazyLoginWithProviders = lazy(() => import('./layouts/LoginWithProviders'));
const LazyAppWithProviders = lazy(() => import('./layouts/AppWithProviders'));
const LazyAccounts = lazy(() => import('./pages/Accounts'));
const LazyProfile = lazy(() => import('./pages/Profile'));
const LazyInvite = lazy(() => import('./pages/Invite'));
const LazyLeaderboard = lazy(() => import('./layouts/Leadearboard'));
const LazyAdvanced = lazy(() => import('./pages/Advanced'));
const LazyPublicProfile = lazy(() => import('./layouts/PublicProfile'));
const LazyJar = lazy(() => import('./pages/Jar'));
const LazyActions = lazy(() => import('./pages/Actions'));
const LazyComposer = lazy(() => import('./pages/Composer'));
const LazyPayment = lazy(() => import('./pages/Payment'));
const LazyUseful = lazy(() => import('./pages/Useful'));
const LazyPage404 = lazy(() => import('./pages/Page404'));

// Wrapper component for lazy-loaded components
const LazyWrapper = ({
  component: Component,
  ...props
}: {
  component: React.ComponentType<any>;
}) => (
  <Suspense fallback={<LoadingPayflowEntryLogo />}>
    <Component {...props} />
  </Suspense>
);

export const appRoutes = ['/home', '/flows', '/requests', '/settings'];

export const appRouter = createBrowserRouter([
  {
    path: '/connect',
    element: <LazyWrapper component={LazyLoginWithProviders} />,
    errorElement: <LazyWrapper component={LazyPage404} />
  },
  {
    path: '/',
    element: <LazyWrapper component={LazyAppWithProviders} />,
    errorElement: <LazyWrapper component={LazyPage404} />,
    children: [
      { element: <LazyWrapper component={LazyAccounts} />, index: true },
      { path: 'profile', element: <LazyWrapper component={LazyProfile} /> },
      { path: 'advanced', element: <LazyWrapper component={LazyAdvanced} /> },
      { path: 'actions', element: <LazyWrapper component={LazyActions} /> },
      { path: 'useful', element: <LazyWrapper component={LazyUseful} /> },
      { path: 'composer', element: <LazyWrapper component={LazyComposer} /> },
      { path: 'invite', element: <LazyWrapper component={LazyInvite} /> },
      {
        path: '/search',
        element: <LazyWrapper component={LazyPublicProfile} />,
        errorElement: <LazyWrapper component={LazyPage404} />
      },
      {
        path: '/leaderboard',
        element: <LazyWrapper component={LazyLeaderboard} />,
        errorElement: <LazyWrapper component={LazyPage404} />
      },
      {
        path: '/payment/:refId',
        element: <LazyWrapper component={LazyPayment} />,
        errorElement: <LazyWrapper component={LazyPage404} />
      },
      {
        path: '/:username',
        element: <LazyWrapper component={LazyPublicProfile} />,
        errorElement: <LazyWrapper component={LazyPage404} />
      },
      {
        path: '/fid/:fid',
        element: <LazyWrapper component={LazyPublicProfile} />,
        errorElement: <LazyWrapper component={LazyPage404} />
      },
      {
        path: '/jar/:uuid',
        element: <LazyWrapper component={LazyJar} />,
        errorElement: <LazyWrapper component={LazyPage404} />
      },
      { path: '404', element: <LazyWrapper component={LazyPage404} /> },
      { path: '*', element: <Navigate to="/404" replace /> }
    ]
  }
]);
