// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://web-escola.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Remove headers que podem causar problemas de CORS
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            // Adiciona headers que o backend pode esperar
            proxyReq.setHeader('Accept', '*/*');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
          });
        },
      },
    },
  },
})