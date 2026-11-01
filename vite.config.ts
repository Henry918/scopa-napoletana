import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/scopa-napoletane/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/scopa.svg'],
      manifest: {
        id: './',
        name: 'Scopa Napoletane Scorekeeper',
        short_name: 'Scopa Score',
        description: 'A scorekeeper for physical Scopa Napoletane games.',
        theme_color: '#102c24',
        background_color: '#f3efe4',
        display: 'standalone',
        scope: './',
        start_url: './',
        icons: [{ src: 'icons/scopa.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,jpg,jpeg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
})