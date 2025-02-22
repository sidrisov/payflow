import React from 'react';
import ReactDOMServer from 'react-dom/server';
import AppProviders from './utils/providers';
import AsyncHelmet from 'react-helmet-async';
import { routes } from './routes';
import { RouterProvider } from 'react-router';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

export function render() {
  const emotionCache = createCache({ key: 'payflow' });

  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <CacheProvider value={emotionCache}>
        <AsyncHelmet.HelmetProvider>
          <AppProviders>
            <RouterProvider router={routes} />
          </AppProviders>
        </AsyncHelmet.HelmetProvider>
      </CacheProvider>
    </React.StrictMode>
  );
  return { html };
}
