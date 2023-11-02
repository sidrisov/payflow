import { createBrowserRouter, Navigate } from 'react-router-dom';
import Accounts from './pages/Accounts';
import Flows from './pages/Flows';
import Requests from './pages/Requests';
import Settings from './pages/Settings';
import Page404 from './pages/Page404';

import AppWithProviders from './layouts/AppWithProviders';
import SendWithProviders from './layouts/SendWithProviders';
import PaymentRequestWithProviders from './layouts/PaymentRequestWithProviders';
import ProfileWithProviders from './layouts/ProfileWithProviders';
import LoginWithProviders from './layouts/LoginWithProviders';

export const appRoutes = ['/accounts', '/flows', '/requests', '/settings'];

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
      { element: <Navigate to="/accounts" />, index: true },
      {
        path: 'accounts',
        element: <Accounts />
      },
      {
        path: 'flows',
        element: <Flows />
      },
      { path: 'requests', element: <Requests /> },
      { path: 'settings', element: <Settings /> },
      { path: '404', element: <Page404 /> },
      { path: '*', element: <Navigate to="/404" replace /> }
    ]
  },
  {
    path: '/send/:uuid',
    element: <SendWithProviders />,
    errorElement: <Page404 />
  },
  {
    path: '/request/:uuid',
    element: <PaymentRequestWithProviders />,
    errorElement: <Page404 />
  },
  {
    path: '/:username',
    element: <ProfileWithProviders />,
    errorElement: <Page404 />
  }
]);
