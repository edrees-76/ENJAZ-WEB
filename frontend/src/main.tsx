import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSyncBootstrap } from './lib/syncBootstrap'

// Initialize the Offline Sync Engine (Module-level, outside React lifecycle)
initSyncBootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
