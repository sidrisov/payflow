import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { visualizer } from 'rollup-plugin-visualizer';
import { RuntimeCaching } from 'workbox-build';
import { defineConfig, loadEnv } from 'vite';
import { addSeconds, addMinutes, addHours, addDays, addWeeks } from 'date-fns';
import { WorkboxPlugin } from 'workbox-core/types';

// pass empty url if .env not available (for prodcution build should be poluted)
const env = loadEnv('all', process.cwd());
const API_URL_HOST = env ? env.VITE_PAYFLOW_SERVICE_API_URL.replace(/^(http|https):\/\/+/, '') : '';

const Time = {
  seconds: (n: number) => Math.floor((addSeconds(new Date(), n).getTime() - Date.now()) / 1000),
  minutes: (n: number) => Math.floor((addMinutes(new Date(), n).getTime() - Date.now()) / 1000),
  hours: (n: number) => Math.floor((addHours(new Date(), n).getTime() - Date.now()) / 1000),
  days: (n: number) => Math.floor((addDays(new Date(), n).getTime() - Date.now()) / 1000),
  weeks: (n: number) => Math.floor((addWeeks(new Date(), n).getTime() - Date.now()) / 1000)
};

function createCache(
  urlPattern: RegExp | string,
  cacheName: string,
  handler: 'StaleWhileRevalidate' | 'CacheFirst' | 'NetworkFirst',
  maxEntries: number,
  maxAgeSeconds: number,
  plugins?: WorkboxPlugin[]
): RuntimeCaching {
  return {
    urlPattern,
    method: 'GET',
    handler,
    options: {
      cacheName,
      plugins,
      expiration: {
        maxEntries,
        maxAgeSeconds
      },
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  };
}

export default defineConfig({
  // specify same port for dev as for preview
  server: { port: 4173, hmr: { overlay: false } },
  build: {
    rollupOptions: {
      output: {
        compact: true,
        minifyInternalExports: true,
        generatedCode: 'es2015',
        format: 'es',
        manualChunks: {
          // Core React dependencies
          'react-core': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          // UI and styling related
          ui: [
            '@emotion/react',
            '@emotion/styled',
            '@mui/material',
            '@mui/icons-material',
            '@mui/lab'
          ],
          viem: ['viem'],
          wagmi: ['wagmi'],
          walletconnect: ['@walletconnect/core'],
          permissionless: ['permissionless'],
          'privy-auth': ['@privy-io/react-auth'],
          'privy-wagmi': ['@privy-io/wagmi'],
          // Data fetching and state management
          data: ['@tanstack/react-query', 'axios', 'graphql', 'graphql-request'],
          // Visualization and media
          media: ['react-blockies', 'react-qr-code', 'react-icons'],
          // Third-party services
          airstack: ['@airstack/airstack-react'],
          glide: ['@paywithglide/glide-js']
        }
      }
    },
    target: 'es2020',
    minify: 'terser',
    /*     terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }, */
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  },

  plugins: [
    react(),
    nodePolyfills(),
    visualizer({ gzipSize: true, brotliSize: true }),
    VitePWA({
      devOptions: {
        enabled: true
      },
      injectRegister: 'inline',
      registerType: 'prompt',
      workbox: {
        clientsClaim: true,
        runtimeCaching: [
          //createCache(/\.js$/, 'js-cache', 'CacheFirst', 100, Time.weeks(4)),
          createCache(
            /^https:\/\/assets\.airstack\.xyz\/.*/i,
            'airstack-assets-cache',
            'CacheFirst',
            1000,
            Time.weeks(1)
          ),
          createCache(
            new RegExp(`^(http|https):\/\/${API_URL_HOST}\/api\/user\/me$`),
            'auth-cache',
            'NetworkFirst',
            1,
            Time.weeks(1)
          ),
          createCache(
            new RegExp(`^(http|https):\/\/${API_URL_HOST}\/api\/user\/me\/contacts$`),
            'contacts-cache',
            'StaleWhileRevalidate',
            1,
            Time.weeks(1)
          ),
          createCache(
            new RegExp(`^(http|https):\/\/${API_URL_HOST}\/api\/user\/`),
            'profiles-cache',
            'NetworkFirst',
            1,
            Time.weeks(1)
          ),
          createCache(
            /^https:\/\/(.*\.)?arweave\.net\/.*/i,
            'arweave-cache',
            'CacheFirst',
            1000,
            Time.weeks(1)
          ),
          createCache(
            /^https:\/\/.*\.decentralized-content\.com\/.*/i,
            'decentralized-content-cache',
            'CacheFirst',
            1000,
            Time.weeks(1)
          ),
          createCache(
            /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            'google-fonts',
            'CacheFirst',
            30,
            Time.weeks(1)
          ),
          // New cache for Highlight Creator Assets
          createCache(
            /^https:\/\/highlight-creator-assets\.highlight\.xyz\/.*/i,
            'highlight-creator-assets-cache',
            'CacheFirst',
            1000,
            Time.weeks(1)
          ),
          createCache(
            /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
            'image-cache',
            'CacheFirst',
            500,
            Time.weeks(1)
          ),
          createCache(
            /^https:\/\/api\.simplehash\.com\/api\/v0\/nfts\/.*/i,
            'simplehash-nfts-cache-v1',
            'CacheFirst',
            200,
            Time.weeks(1),
            [
              {
                cacheWillUpdate: async ({ response }) => {
                  if (!response) return null;
                  const clonedResponse = response.clone();
                  try {
                    const data = await clonedResponse.json();
                    return data && data.name ? response : null;
                  } catch (error) {
                    console.error('Error parsing SimpleHash response:', error);
                    return null;
                  }
                }
              } as WorkboxPlugin
            ]
          ),
          createCache(
            /^https:\/\/(.+\.)?lh3\.googleusercontent\.com\/.*/i,
            'google-user-content-cache',
            'CacheFirst',
            200,
            Time.weeks(1)
          ),
          createCache(
            /^https:\/\/storage\.withfabric\.xyz\/.*/i,
            'google-user-content-cache',
            'CacheFirst',
            50,
            Time.weeks(1)
          )
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Payflow',
        short_name: 'Payflow',
        description: 'Onchain Social Payments',
        theme_color: '#242424',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
