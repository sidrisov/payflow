import { createBrowserRouter, Navigate } from 'react-router-dom';
import Accounts from './pages/Accounts';
import Page404 from './pages/Page404';

import AppWithProviders from './layouts/AppWithProviders';
import LoginWithProviders from './layouts/LoginWithProviders';
import Profile from './pages/Profile';
import Invite from './pages/Invite';
import Leaderboard from './layouts/Leadearboard';
import Advanced from './pages/Advanced';
import PublicProfile from './layouts/PublicProfile';
import Jar from './pages/Jar';
import Actions from './pages/Actions';

export const appRoutes = ['/home', '/flows', '/requests', '/settings'];

export const appRouter = createBrowserRouter([
  {
    path: '/connect',
    element: <LoginWithProviders />,
    errorElement: <Page404 />
  },
  {
    path: '/',
    element: <AppWithProviders />,
    errorElement: <Page404 />,
    children: [
      { element: <Navigate to="/home" />, index: true },
      {
        path: 'home',
        element: <Accounts />
      },
      {
        path: 'profile',
        element: <Profile />
      },
      {
        path: 'advanced',
        element: <Advanced />
      },
      {
        path: 'actions',
        element: <Actions />
      },
      {
        path: 'invite',
        element: <Invite />
      },
      { path: '/search', element: <PublicProfile />, errorElement: <Page404 /> },
      { path: '/leaderboard', element: <Leaderboard />, errorElement: <Page404 /> },
      {
        path: '/:username',
        element: <PublicProfile />,
        errorElement: <Page404 />
      },
      {
        path: '/fid/:fid',
        element: <PublicProfile />,
        errorElement: <Page404 />
      },
      {
        path: '/jar/:uuid',
        element: <Jar />,
        errorElement: <Page404 />
      },
      /*
      {
        path: 'flows',
        element: <Flows />
      },
             { path: 'requests', element: <Requests /> },
      { path: 'settings', element: <Settings /> }, */
      { path: '404', element: <Page404 /> },
      { path: '*', element: <Navigate to="/404" replace /> }
    ]
  }
  /*{
    path: '/jar/:uuid',
    element: <SendWithProviders />,
    errorElement: <Page404 />
  },
  {
    path: '/request/:uuid',
    element: <PaymentRequestWithProviders />,
    errorElement: <Page404 />
  }, */
]);
