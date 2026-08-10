import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'optimus-logo.png'],
      manifest: {
        name: 'OPTIMUS Shipping System',
        short_name: 'OPTIMUS',
        description: 'OPTIMUS shipping portal — manifests, eDO/CRO, yard & ops',
        theme_color: '#0B3D5C',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'optimus-logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'optimus-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // API lives on Railway (cross-origin). Do not cache /api via SW — it breaks CORS after failed deploys.
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
