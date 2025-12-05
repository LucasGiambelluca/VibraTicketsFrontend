import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acceso desde ngrok y otras conexiones externas
    
    hmr: {
      clientPort: 443 // Para que HMR funcione con HTTPS de ngrok
    },
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.io'
    ],
    proxy: {
      '/api': {
        target: 'https://vibratickets.online',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/uploads': {
        target: 'https://vibratickets.online',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
