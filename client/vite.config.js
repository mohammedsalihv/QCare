import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'QCARE_')
  const apiTarget = env.QCARE_API_TARGET || 'http://192.168.1.160:5000'

  return {
    plugins: [react(), tailwindcss(), viteStaticCopy({
      targets: ['cmaps', 'standard_fonts', 'wasm'].map(folder => ({
        src: `node_modules/pdfjs-dist/${folder}/*`,
        dest: `pdf-resources/${folder}`,
        rename: { stripBase: true },
      })),
    })],
    server: {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/socket.io': { target: apiTarget, changeOrigin: true, ws: true },
        '/uploads': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
