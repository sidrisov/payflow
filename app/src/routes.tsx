import { createBrowserRouter, Navigate, redirect } from 'react-router';
import LoadingPayflowEntryLogo from './components/LoadingPayflowEntryLogo';
import sortAndFilterFlows from './utils/sortAndFilterFlows';
import { me } from './services/user';
import ErrorBoundary from './pages/ErrorBoundary';

function convert(m: any) {
  let { loader, action, default: Component, ...rest } = m;
  return {
    ...rest,
    loader,
    action,
    Component
  };
}

export const routes = createBrowserRouter([
  {
    path: '/connect',
    lazy: () => import('./layouts/LoginWithProviders').then(convert),
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
    },
    hydrateFallbackElement: <LoadingPayflowEntryLogo />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/',
    lazy: () => import('./layouts/App').then(convert),
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
          return redirect('/connect?redirect=' + url.pathname);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        return { profile: null, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
    hydrateFallbackElement: <LoadingPayflowEntryLogo />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        lazy: () => import('./pages/Accounts').then(convert)
      },
      {
        path: 'profile',
        lazy: () => import('./pages/Profile').then(convert)
      },
      {
        path: 'advanced',
        lazy: () => import('./pages/Advanced').then(convert)
      },
      {
        path: 'settings',
        children: [
          {
            path: 'preferred-flow',
            lazy: () => import('./pages/settings/PreferredFlowPage').then(convert)
          },
          {
            path: 'tokens',
            lazy: () => import('./pages/settings/PreferredTokensPage').then(convert)
          },
          {
            path: 'farcaster/client',
            lazy: () => import('./pages/settings/FarcasterClientPage').then(convert)
          }
        ]
      },
      {
        path: 'services',
        lazy: () => import('./pages/PaymentServices').then(convert)
      },
      {
        path: 'composer',
        lazy: () => import('./pages/Composer').then(convert)
      },
      {
        path: 'invite',
        lazy: () => import('./pages/Invite').then(convert)
      },
      {
        path: '/search',
        lazy: () => import('./layouts/PublicProfile').then(convert)
      },
      {
        path: '/leaderboard',
        lazy: () => import('./layouts/Leadearboard').then(convert)
      },
      {
        path: '/payment/:refId',
        lazy: () => import('./pages/Payment').then(convert)
      },
      {
        path: '/payment/create',
        lazy: () => import('./pages/CreatePayment').then(convert)
      },
      {
        path: '/:username',
        lazy: () => import('./layouts/PublicProfile').then(convert)
      },
      {
        path: '/fid/:fid',
        lazy: () => import('./layouts/PublicProfile').then(convert)
      },
      {
        path: '/jar/:uuid',
        lazy: () => import('./pages/Jar').then(convert)
      },
      {
        path: '/~/create-payflow-wallet',
        lazy: () => import('./pages/CreatePayflowWallet').then(convert)
      },
      {
        path: '/~/create-wallet-session/:address',
        lazy: () => import('./pages/CreateWalletSession').then(convert)
      },
      {
        path: '/~/claimables',
        lazy: () => import('./pages/ClaimablesPage').then(convert)
      },
      {
        path: '/~/cast-actions',
        lazy: () => import('./pages/CastActionsPage').then(convert)
      },
      {
        path: '/~/farcaster/storage',
        lazy: () => import('./pages/Storage').then(convert)
      },
      {
        path: '/~/subscriptions',
        lazy: () => import('./pages/SubscriptionsPage').then(convert)
      },
      { path: '404', element: <ErrorBoundary /> },
      { path: '*', element: <Navigate to="/404" replace /> }
    ]
  },
  {
    path: '/~/stats',
    lazy: () => import('./pages/stats').then(convert),
    hydrateFallbackElement: <LoadingPayflowEntryLogo />
  }
]);
