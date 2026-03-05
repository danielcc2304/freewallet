import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'
import { PortfolioProvider } from './context/PortfolioContext'

const CHUNK_RELOAD_KEY = 'freewallet_chunk_reload_once'

function isChunkLoadFailure(message: string): boolean {
  return (
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')
  )
}

function reloadOnceForChunkError() {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    window.location.reload()
  } catch {
    window.location.reload()
  }
}

window.addEventListener('error', (event) => {
  const msg = event?.message || ''
  if (isChunkLoadFailure(msg)) {
    reloadOnceForChunkError()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason
  const msg = typeof reason === 'string' ? reason : reason?.message || ''
  if (isChunkLoadFailure(msg)) {
    reloadOnceForChunkError()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PortfolioProvider>
        <App />
      </PortfolioProvider>
    </ThemeProvider>
  </StrictMode>,
)
