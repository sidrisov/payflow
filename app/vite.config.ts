import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig({
  // specify same port for dev as for preview
  server: { port: 4173 },
  plugins: [
    react(),
    svgr({ include: '**/*.svg?react' }),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^\.]+\.blockscout\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'blockscout-txs-cache',
              expiration: {
                maxEntries: 100,
                // TODO: make 2 mins for now (since pageInfo might be stale), add backgrount sync later
                maxAgeSeconds: 60 * 2 // <== 2 mins,
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Payflow',
        short_name: 'Payflow',
        description: 'Onchain Social Payments',
        theme_color: '#ffffff',
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
