import { createBrowserRouter, Navigate } from 'react-router-dom';
import Page404 from './pages/Page404';
import Flows from './pages/Flows';
import Requests from './pages/Requests';
import Activity from './pages/Activity';
import Settings from './pages/Settings';

import AppWithProviders from './layouts/AppWithProviders';
import TopUp from './layouts/SendWithProviders';

export const appRoutes = ['/flows', '/requests', '/activity', '/settings'];

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppWithProviders />,
    errorElement: <Page404 />,
    children: [
      { element: <Navigate to="/flows" />, index: true },
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
  },
  {
    path: '/login',
    element: <TopUp />,
    errorElement: <Page404 />
  }
]);
