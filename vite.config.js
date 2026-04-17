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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // --- ADDED: Increase precache limit to 4MB for safety ---
        maximumFileSizeToCacheInBytes: 4194304, 
        
        // --- BACKGROUND SYNC CONFIGURATION ---
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
            handler: 'NetworkOnly',
            method: 'POST',
            options: {
              backgroundSync: {
                name: 'abtc-offline-queue',
                options: {
                  maxRetentionTime: 24 * 60,
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
                name: 'abtc-offline-queue',
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
  
  // --- OPTION 2: MANUAL CHUNKING (CODE SPLITTING) ---
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy reporting and DB libraries into their own files
          'vendor-excel': ['exceljs', 'file-saver'],
          'vendor-db': ['@supabase/supabase-js'],
          // Optional: group core react icons if used heavily
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
    // Optional: raise warning threshold to 1MB instead of default 500kb
    chunkSizeWarningLimit: 1000, 
  },

  worker: {
    format: 'es'
  },

  // --- ADDED: VITEST CONFIGURATION ---
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  }
})