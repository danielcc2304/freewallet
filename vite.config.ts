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
      '/__market/yahoo1': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__market\/yahoo1/, ''),
      },
      '/__market/yahoo2': {
        target: 'https://query2.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__market\/yahoo2/, ''),
      },
      '/__holdings/spy': {
        target: 'https://www.ssga.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/us/en/intermediary/library-content/products/fund-data/etfs/us/holdings-daily-us-en-spy.xlsx',
      },
      '/__holdings/sp500-sectors': {
        target: 'https://en.wikipedia.org',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/wiki/List_of_S%26P_500_companies',
      },
      '/__holdings/urth': {
        target: 'https://www.ishares.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/us/products/239696/ishares-msci-world-etf/latest-holdings.csv',
      },
      '/__holdings/eem': {
        target: 'https://www.ishares.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/us/products/239637/ishares-msci-emerging-markets-etf/latest-holdings.csv',
      },
    },
  },
})
