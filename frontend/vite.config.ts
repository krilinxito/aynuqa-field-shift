import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import wasm from 'vite-plugin-wasm'

// Para ver la app en el celular con un túnel (ngrok): la API se pide al
// mismo sitio que sirve la app y aquí se reenvía al backend local.
const backendProxy = {
  '/api': 'http://127.0.0.1:8000',
  '/health': 'http://127.0.0.1:8000',
}
const tunnelHosts = ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io']

export default defineConfig({
  server: { proxy: backendProxy, allowedHosts: tunnelHosts },
  preview: { proxy: backendProxy, allowedHosts: tunnelHosts },
  optimizeDeps: {
    exclude: ['@journeyapps/wa-sqlite', '@powersync/web'],
  },
  build: {
    rollupOptions: {
      output: {
        // La IA local (WebLLM, ~6 MB) va aparte: solo se baja si la piden.
        manualChunks: (id) =>
          id.includes('@mlc-ai/web-llm') ? 'web-llm' : undefined,
      },
    },
  },
  worker: {
    format: 'es',
    plugins: () => [wasm() as Plugin],
  },
  plugins: [
    react(),
    wasm(),
    VitePWA({
      // La app se actualiza sola: no se le pide nada a la persona.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/aynuqa-mark.svg'],
      manifest: {
        id: '/',
        name: 'Aynuqa Field Shift',
        short_name: 'Aynuqa',
        description:
          'Ayuda para decidir la rotación de los sectores de la comunidad, con datos de la NASA.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1F4E79',
        background_color: '#FBF3E4',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/web-llm-*.js'],
        // Avisos de la llamita con la app cerrada.
        importScripts: ['llamita-sw.js'],
        // Sin señal se muestran los últimos datos guardados. El chat nunca
        // se guarda: necesita señal y lo dice.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.wasm'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'aynuqa-sqlite-wasm',
              expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // La IA local se guarda solo cuando la persona la descarga.
            urlPattern: ({ url }) => /\/assets\/web-llm-[\w-]+\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'aynuqa-ia-local',
              expiration: { maxEntries: 2 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Foto satelital del mapa (Esri World Imagery): una sola imagen,
            // guardada para verla sin señal.
            urlPattern: ({ url }) =>
              url.hostname === 'server.arcgisonline.com' &&
              url.pathname.includes('/World_Imagery/MapServer/export'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'aynuqa-satelite',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname === '/api/sectors' || url.pathname === '/health',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'aynuqa-datos',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 8 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
