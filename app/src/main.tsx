import ReactDOM from 'react-dom/client';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';

import { RouterProvider } from 'react-router-dom';

import { appRouter } from './appRouter';
import { HelmetProvider } from 'react-helmet-async';

import { SpeedInsights } from '@vercel/speed-insights/react';
import AppProviders from './utils/providers';
import { AppSettings } from './types/AppSettingsType';
import React from 'react';

const appSettingsStorageItem = localStorage.getItem('appSettings');
const appSettingsStored = appSettingsStorageItem
  ? (JSON.parse(appSettingsStorageItem) as AppSettings)
  : null;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <AppProviders {...(appSettingsStored?.darkMode && { darkMode: appSettingsStored?.darkMode })}>
        <RouterProvider router={appRouter} />
      </AppProviders>
    </HelmetProvider>
    <SpeedInsights />
  </React.StrictMode>
);
