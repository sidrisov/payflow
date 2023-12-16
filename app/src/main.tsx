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
import { ToastContainer } from 'react-toastify';
import React from 'react';

import { SpeedInsights } from '@vercel/speed-insights/react';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={appRouter} />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        limit={5}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastStyle={{ borderRadius: 20, textAlign: 'center' }}
      />
    </HelmetProvider>
    <SpeedInsights />
  </React.StrictMode>
);
