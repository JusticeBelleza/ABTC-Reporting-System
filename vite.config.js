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
        theme_color: '#0f172A',
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
        // --- CACHE BUSTING: Forces the browser to instantly load the newest build ---
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        
        // Increase precache limit to 4MB for safety (prevents heavy chunks from being skipped)
        maximumFileSizeToCacheInBytes: 4194304, 
        
        // --- BACKGROUND SYNC CONFIGURATION ---
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
            handler: 'NetworkOnly',
            method: 'POST',
            options: {
              backgroundSync: {
                // FIXED: Unique queue name for POST requests
                name: 'abtc-offline-post-queue', 
                options: {
                  maxRetentionTime: 24 * 60, // Keep in queue for 24 hours
                },
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
            handler: 'NetworkOnly',
            method: 'PATCH',
            options: {
              backgroundSync: {
                // FIXED: Unique queue name for PATCH requests
                name: 'abtc-offline-patch-queue', 
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          }
        ]
      },
      devOptions: {
        enabled: false, 
        type: 'module',
      }
    })
  ],
  
  // --- MANUAL CHUNKING (CODE SPLITTING) ---
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy reporting and DB libraries into their own files to speed up initial load
          'vendor-excel': ['exceljs', 'file-saver'],
          'vendor-db': ['@supabase/supabase-js'],
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
    // Raise warning threshold to 1MB instead of default 500kb
    chunkSizeWarningLimit: 1000, 
  },

  worker: {
    format: 'es'
  },

  // --- VITEST CONFIGURATION ---
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  }
})