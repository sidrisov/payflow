import ReactDOM from 'react-dom/client';

import 'react-toastify/dist/ReactToastify.css';

import { RouterProvider } from 'react-router-dom';

import { appRouter } from './appRouter';
import { HelmetProvider } from 'react-helmet-async';

import AppProviders from './utils/providers';
import React from 'react';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <AppProviders>
        <RouterProvider router={appRouter} />
      </AppProviders>
    </HelmetProvider>
  </React.StrictMode>
);
