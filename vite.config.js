import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import packageInfo from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['images/pho-logo.png', 'images/dog-icon.png'],
      manifest: {
        name: `ABTC Reporting System v${packageInfo.version}`,
        short_name: `ABTC v${packageInfo.version}`,
        description: 'Provincial Rabies Registry and Reporting System',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: '/images/dog-icon.png',
            sizes: 'any',
            type: 'image/png'
          },
          {
            src: '/images/pho-logo.png',
            sizes: 'any',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // --- ADDED: BACKGROUND SYNC CONFIGURATION ---
        runtimeCaching: [
          {
            // Match any request going to your Supabase REST API
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
            handler: 'NetworkOnly', // Only try to use the network for database writes
            method: 'POST', // Specifically queue POST (insert) requests
            options: {
              backgroundSync: {
                name: 'abtc-offline-queue', // Name of the IndexedDB queue Workbox creates
                options: {
                  maxRetentionTime: 24 * 60, // Keep in queue for up to 24 hours
                },
              },
            },
          },
          {
            // Also match PATCH (update) requests for when they edit drafts
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
            handler: 'NetworkOnly',
            method: 'PATCH',
            options: {
              backgroundSync: {
                name: 'abtc-offline-queue',
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          }
        ]
      },
      // --- TURN THIS OFF FOR LOCAL DEVELOPMENT ---
      devOptions: {
        enabled: false, 
        type: 'module',
      }
    })
  ],
  // --- Fix for Web Worker build formatting ---
  worker: {
    format: 'es'
  }
})