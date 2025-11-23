import React from 'react';
import ReactDOMServer from 'react-dom/server';
import AppProviders from './utils/providers';
import { routes } from './routes';
import { RouterProvider } from 'react-router';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

export function render() {
  const emotionCache = createCache({ key: 'payflow' });

  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <CacheProvider value={emotionCache}>
        <AppProviders>
          <RouterProvider router={routes} />
        </AppProviders>
      </CacheProvider>
    </React.StrictMode>
  );
  return { html };
}
