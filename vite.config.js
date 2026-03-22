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
        // Removed the ABTC-RS duplication to keep the install prompt perfectly clean
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      devOptions: {
        enabled: true, 
        type: 'module',
      }
    })
  ],
})