import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { assertPublicSupabaseEnvironment } from './src/services/supabaseConfig'
import { globalAgent } from 'node:https'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  assertPublicSupabaseEnvironment({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env })
  return {
  plugins: [react()],
  server: {
    proxy: {
      '/__market/google': {
        agent: process.env.NODE_USE_ENV_PROXY === '1' ? globalAgent : undefined,
        target: 'https://www.google.com', changeOrigin: true, secure: true,
        rewrite: (path) => path.replace(/^\/__market\/google/, ''),
      },
      '/__market/coingecko': {
        agent: process.env.NODE_USE_ENV_PROXY === '1' ? globalAgent : undefined,
        target: 'https://api.coingecko.com', changeOrigin: true, secure: true,
        rewrite: (path) => path.replace(/^\/__market\/coingecko/, ''),
      },
      // Finect does not expose ACAO for the browser. These Vite-only routes
      // keep local development usable without adding an application backend.
      '/__finect/api': {
        agent: process.env.NODE_USE_ENV_PROXY === '1' ? globalAgent : undefined,
        target: 'https://api.finect.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__finect\/api/, ''),
      },
      '/__finect/site': {
        agent: process.env.NODE_USE_ENV_PROXY === '1' ? globalAgent : undefined,
        target: 'https://www.finect.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__finect\/site/, ''),
      },
      '/__market/yahoo1': {
        agent: process.env.NODE_USE_ENV_PROXY === '1' ? globalAgent : undefined,
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__market\/yahoo1/, ''),
      },
      '/__market/yahoo-site': {
        agent: process.env.NODE_USE_ENV_PROXY === '1' ? globalAgent : undefined,
        target: 'https://finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__market\/yahoo-site/, ''),
      },
      '/__market/yahoo2': {
        agent: process.env.NODE_USE_ENV_PROXY === '1' ? globalAgent : undefined,
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
      '/__holdings/ndq': {
        target: 'https://www.betashares.com.au',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/files/csv/NDQ_Portfolio_Holdings.csv',
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
  }
})
