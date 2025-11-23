import ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router';

import { routes } from './routes';

import AppProviders from './utils/providers';
import React from 'react';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={routes} />
    </AppProviders>
  </React.StrictMode>
);
