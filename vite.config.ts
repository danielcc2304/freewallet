import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Finect does not expose ACAO for the browser. These Vite-only routes
      // keep local development usable without adding an application backend.
      '/__finect/api': {
        target: 'https://api.finect.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__finect\/api/, ''),
      },
      '/__finect/site': {
        target: 'https://www.finect.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__finect\/site/, ''),
      },
    },
  },
})
