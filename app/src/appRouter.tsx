import { createBrowserRouter, Navigate } from 'react-router-dom';
import Accounts from './pages/Accounts';
import Flows from './pages/Flows';
import Requests from './pages/Requests';
import Widgets from './pages/Widgets';
import Settings from './pages/Settings';
import Page404 from './pages/Page404';

import AppWithProviders from './layouts/AppWithProviders';
import SendWithProviders from './layouts/SendWithProviders';
import PaymentRequestWithProviders from './layouts/PaymentRequestWithProviders';
import Tipping from './pages/Tipping';
import Links from './pages/Links';
import Profile from './pages/Profile';

export const appRoutes = ['/accounts', '/flows', '/requests', '/links', '/tipping', '/settings'];

export const appRouter = createBrowserRouter([
  /*   {
      path: '/login',
      element: <Login />,
      errorElement: <Page404 />
    }, */
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
      { path: 'links', element: <Links /> },
      { path: 'tipping', element: <Tipping /> },
      /*       { path: 'widgets', element: <Widgets /> },
       */
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
    path: '/p/:userId',
    element: <Profile />,
    errorElement: <Page404 />
  }
]);
