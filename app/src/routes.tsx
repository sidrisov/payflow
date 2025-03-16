/* import { createBrowserRouter, Navigate } from 'react-router';
import Page404 from './pages/Page404';
import LoadingPayflowEntryLogo from './components/LoadingPayflowEntryLogo';

function convert(m: any) {
  let { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader,
    action: clientAction,
    Component
  };
}

export const routes = createBrowserRouter([
  {
    path: '/connect',
    lazy: () => import('./layouts/LoginWithProviders').then(convert),
    errorElement: <Page404 />,
    hydrateFallbackElement: <LoadingPayflowEntryLogo />
  },
  {
    path: '/',
    lazy: () => import('./layouts/App').then(convert),
    errorElement: <Page404 />,
    hydrateFallbackElement: <LoadingPayflowEntryLogo />,
    children: [
      {
        index: true,
        lazy: () => import('./pages/Accounts').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: 'profile',
        lazy: () => import('./pages/Profile').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: 'notifications',
        lazy: () => import('./pages/Storage').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: 'advanced',
        lazy: () => import('./pages/Advanced').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: 'settings',
        children: [
          {
            path: 'preferred-flow',
            lazy: () => import('./pages/settings/PreferredFlowPage').then(convert),
            hydrateFallbackElement: <LoadingPayflowEntryLogo />
          },
          {
            path: 'tokens',
            lazy: () => import('./pages/settings/PreferredTokensPage').then(convert),
            hydrateFallbackElement: <LoadingPayflowEntryLogo />
          },
          {
            path: 'farcaster/client',
            lazy: () => import('./pages/settings/FarcasterClientPage').then(convert),
            hydrateFallbackElement: <LoadingPayflowEntryLogo />
          }
        ]
      },
      {
        path: 'services',
        lazy: () => import('./pages/PaymentServices').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: 'composer',
        lazy: () => import('./pages/Composer').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: 'invite',
        lazy: () => import('./pages/Invite').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/search',
        lazy: () => import('./layouts/PublicProfile').then(convert),
        errorElement: <Page404 />,
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/leaderboard',
        lazy: () => import('./layouts/Leadearboard').then(convert),
        errorElement: <Page404 />,
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/payment/:refId',
        lazy: () => import('./pages/Payment').then(convert),
        errorElement: <Page404 />,
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/payment/create',
        lazy: () => import('./pages/CreatePayment').then(convert),
        errorElement: <Page404 />,
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/:username',
        lazy: () => import('./layouts/PublicProfile').then(convert),
        errorElement: <Page404 />,
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/fid/:fid',
        lazy: () => import('./layouts/PublicProfile').then(convert),
        errorElement: <Page404 />,
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/jar/:uuid',
        lazy: () => import('./pages/Jar').then(convert),
        errorElement: <Page404 />,
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/~/create-payflow-wallet',
        lazy: () => import('./pages/CreatePayflowWallet').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/~/create-wallet-session/:address',
        lazy: () => import('./pages/CreateWalletSession').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/~/claimables',
        lazy: () => import('./pages/ClaimablesPage').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/~/cast-actions',
        lazy: () => import('./pages/CastActionsPage').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/farcaster/storage',
        lazy: () => import('./pages/Storage').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/~/farcaster/storage',
        lazy: () => import('./pages/Storage').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/~/subscriptions',
        lazy: () => import('./pages/SubscriptionsPage').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '404',
        lazy: () => import('./pages/Page404').then(convert),
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      { path: '*', element: <Navigate to="/404" replace /> }
    ]
  },
  {
    path: '/~/stats',
    lazy: () => import('./pages/stats').then(convert),
    hydrateFallbackElement: <LoadingPayflowEntryLogo />
  }
]);
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import LoadingPayflowEntryLogo from './components/LoadingPayflowEntryLogo';
import sortAndFilterFlows from './utils/sortAndFilterFlows';
import { me } from './services/user';
import Page404 from './pages/Page404';

// Dynamically import all pages
const LazyLoginWithProviders = lazy(() => import('./layouts/LoginWithProviders'));
const LazyApp = lazy(() => import('./layouts/App'));
const LazyAccounts = lazy(() => import('./pages/Accounts'));
const LazyProfile = lazy(() => import('./pages/Profile'));
const LazyInvite = lazy(() => import('./pages/Invite'));
const LazyLeaderboard = lazy(() => import('./layouts/Leadearboard'));
const LazyAdvanced = lazy(() => import('./pages/Advanced'));
const LazyPublicProfile = lazy(() => import('./layouts/PublicProfile'));
const LazyJar = lazy(() => import('./pages/Jar'));
const LazyCastActionsPage = lazy(() => import('./pages/CastActionsPage'));
const LazyComposer = lazy(() => import('./pages/Composer'));
const LazyCreatePayment = lazy(() => import('./pages/CreatePayment'));
const LazyPayment = lazy(() => import('./pages/Payment'));
const LazyServices = lazy(() => import('./pages/PaymentServices'));
const LazyPreferredFlow = lazy(() => import('./pages/settings/PreferredFlowPage'));
const LazyPreferredTokens = lazy(() => import('./pages/settings/PreferredTokensPage'));
const LazyFarcasterClientPage = lazy(() => import('./pages/settings/FarcasterClientPage'));
const LazyStorage = lazy(() => import('./pages/Storage'));
const LazyStats = lazy(() => import('./pages/stats'));
const LazyCreatePayflowWallet = lazy(() => import('./pages/CreatePayflowWallet'));
const LazyCreateWalletSession = lazy(() => import('./pages/CreateWalletSession'));
const LazySubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));
const LazyClaimablesPage = lazy(() => import('./pages/ClaimablesPage'));
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

export const routes = createBrowserRouter([
  {
    path: '/connect',
    element: <LazyWrapper component={LazyLoginWithProviders} />,
    errorElement: <Page404 />,
    loader: async ({ request }) => {
      try {
        const url = new URL(request.url);
        const accessToken = url.searchParams.get('access_token');
        const profile = await me(accessToken ?? undefined);

        return { profile };
      } catch (error) {
        console.error('Failed to load profile:', error);
        return { profile: null, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  },
  {
    path: '/',
    element: <LazyWrapper component={LazyApp} />,
    errorElement: <Page404 />,
    loader: async ({ request }) => {
      try {
        const url = new URL(request.url);
        const accessToken = url.searchParams.get('access_token');
        const profile = await me(accessToken ?? undefined);

        if (profile) {
          if (profile.flows) {
            profile.flows = sortAndFilterFlows(profile.flows);
          }
          return { profile };
        } else {
          return { redirect: '/connect' };
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        return { profile: null, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
    children: [
      { element: <LazyWrapper component={LazyAccounts} />, index: true },
      { path: 'profile', element: <LazyWrapper component={LazyProfile} /> },
      { path: 'notifications', element: <LazyWrapper component={LazyStorage} /> },
      { path: 'advanced', element: <LazyWrapper component={LazyAdvanced} /> },
      {
        path: 'settings',
        children: [
          { path: 'preferred-flow', element: <LazyWrapper component={LazyPreferredFlow} /> },
          { path: 'tokens', element: <LazyWrapper component={LazyPreferredTokens} /> },
          { path: 'farcaster/client', element: <LazyWrapper component={LazyFarcasterClientPage} /> }
        ]
      },
      { path: 'services', element: <LazyWrapper component={LazyServices} /> },
      { path: 'composer', element: <LazyWrapper component={LazyComposer} /> },
      { path: 'invite', element: <LazyWrapper component={LazyInvite} /> },
      {
        path: '/search',
        element: <LazyWrapper component={LazyPublicProfile} />,
        errorElement: <Page404 />
      },
      {
        path: '/leaderboard',
        element: <LazyWrapper component={LazyLeaderboard} />,
        errorElement: <Page404 />
      },
      {
        path: '/payment/:refId',
        element: <LazyWrapper component={LazyPayment} />,
        errorElement: <Page404 />
      },
      {
        path: '/payment/create',
        element: <LazyWrapper component={LazyCreatePayment} />,
        errorElement: <Page404 />
      },
      {
        path: '/:username',
        element: <LazyWrapper component={LazyPublicProfile} />,
        errorElement: <Page404 />
      },
      {
        path: '/fid/:fid',
        element: <LazyWrapper component={LazyPublicProfile} />,
        errorElement: <Page404 />
      },
      {
        path: '/jar/:uuid',
        element: <LazyWrapper component={LazyJar} />,
        errorElement: <Page404 />
      },
      {
        path: '/~/create-payflow-wallet',
        element: <LazyWrapper component={LazyCreatePayflowWallet} />
      },
      {
        path: '/~/create-wallet-session/:address',
        element: <LazyWrapper component={LazyCreateWalletSession} />
      },
      {
        path: '/~/claimables',
        element: <LazyWrapper component={LazyClaimablesPage} />
      },
      {
        path: '/~/cast-actions',
        element: <LazyWrapper component={LazyCastActionsPage} />
      },
      {
        path: '/~/farcaster/storage',
        lazy: async () => {
          const { default: Component, storageLoader } = await import('./pages/Storage');
          return {
            Component,
            loader: storageLoader
          };
        },
        errorElement: <Page404 />,
        hydrateFallbackElement: <LoadingPayflowEntryLogo />
      },
      {
        path: '/~/subscriptions',
        element: <LazyWrapper component={LazySubscriptionsPage} />
      },
      { path: '404', element: <Page404 /> },
      { path: '*', element: <Navigate to="/404" replace /> }
    ]
  },
  {
    path: '/~/stats',
    element: <LazyWrapper component={LazyStats} />
  }
]);
