import ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router';

import { routes } from './routes';
import { HelmetProvider } from 'react-helmet-async';

import AppProviders from './utils/providers';
import React from 'react';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <AppProviders>
        <RouterProvider router={routes} />
      </AppProviders>
    </HelmetProvider>
  </React.StrictMode>
);
