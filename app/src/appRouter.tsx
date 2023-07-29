import { createBrowserRouter, Navigate } from 'react-router-dom';
import Page404 from './pages/Page404';
import Flows from './pages/Flows';
import Requests from './pages/Requests';
import Activity from './pages/Activity';
import Settings from './pages/Settings';

import TopUp from './layouts/SendWithProviders';
import Accounts from './pages/Accounts';
import Login from './layouts/LoginWithProviders';
import AppWithProviders from './layouts/AppWithProviders';

export const appRoutes = ['/accounts', '/flows', '/requests', '/activity', '/settings'];

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
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
      { path: 'activity', element: <Activity /> },
      { path: 'settings', element: <Settings /> },
      { path: '404', element: <Page404 /> },
      { path: '*', element: <Navigate to="/404" replace /> }
    ]
  },
  {
    path: '/send/:uuid',
    element: <TopUp />,
    errorElement: <Page404 />
  }
]);
