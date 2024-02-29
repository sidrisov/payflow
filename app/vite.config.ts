import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { defineConfig, loadEnv } from 'vite';
const env = loadEnv('all', process.cwd());
const API_URL_HOST = env.VITE_PAYFLOW_SERVICE_API_URL.replace(/^(http|https):\/\/+/, '');

// https://vitejs.dev/config/
export default defineConfig({
  // specify same port for dev as for preview
  server: { port: 4173, hmr: { overlay: false } },
  plugins: [
    react(),
    nodePolyfills(),
    svgr({ include: '**/*.svg?react' }),
    VitePWA({
      devOptions: {
        enabled: true
      },
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
        maximumFileSizeToCacheInBytes: 6000000,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^\.]+\.blockscout\.com\/.*/i,
            method: 'GET',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'blockscout-txs-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // <== 7 days
              },
              backgroundSync: {
                name: 'blockscout-cache-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/assets\.airstack\.xyz\/image\/social\//,
            method: 'GET',
            handler: 'CacheFirst',
            options: {
              cacheName: 'airstack-assets-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 7 // <== 7 days
              },
              backgroundSync: {
                name: 'airstack-assets-cache-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/ipfs\.io\/image\/.*/i,
            method: 'GET',
            handler: 'CacheFirst',
            options: {
              cacheName: 'ipfs-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 7 // <== 7 days
              },
              backgroundSync: {
                name: 'ipfs-cache-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: new RegExp(`^(http|https):\/\/${API_URL_HOST}\/api\/user\/me$`),
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'auth-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 7 // <== 7 days // TODO: shorter?
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: new RegExp(`^(http|https):\/\/${API_URL_HOST}\/api\/user\/me\/contacts$`),
            method: 'GET',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'contacts-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 // <== 1 hour
              },
              backgroundSync: {
                name: 'contacts-cache-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: new RegExp(`^(http|https):\/\/${API_URL_HOST}\/api\/user\/`),
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'profiles-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 7 // <== 7 days
              },
              backgroundSync: {
                name: 'profiles-cache-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
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
