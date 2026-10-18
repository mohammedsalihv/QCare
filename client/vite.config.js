import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.1.160:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://192.168.1.160:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
