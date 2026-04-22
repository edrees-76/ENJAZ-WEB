import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSyncBootstrap } from './lib/syncBootstrap'
import './i18n'
import { ErrorBoundary } from './components/ErrorBoundary'

// Initialize the Offline Sync Engine (Module-level, outside React lifecycle)
initSyncBootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">جاري التحميل...</div>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
