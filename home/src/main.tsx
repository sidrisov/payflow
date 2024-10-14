import React from 'react';
import ReactDOM from 'react-dom/client';

import Home from './layouts/Home';
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <Home />
    </HelmetProvider>
  </React.StrictMode>
);
