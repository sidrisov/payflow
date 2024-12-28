import React from 'react';
import ReactDOMServer from 'react-dom/server';
import AppProviders from './utils/providers';
import AsyncHelmet from 'react-helmet-async';
import { appRouter } from './appRouter';
import { RouterProvider } from 'react-router-dom';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

export function render() {
  const emotionCache = createCache({ key: 'payflow' });

  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <CacheProvider value={emotionCache}>
        <AsyncHelmet.HelmetProvider>
          <AppProviders>
            <RouterProvider router={appRouter} />
          </AppProviders>
        </AsyncHelmet.HelmetProvider>
      </CacheProvider>
    </React.StrictMode>
  );
  return { html };
}
