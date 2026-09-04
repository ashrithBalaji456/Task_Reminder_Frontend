import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

registerSW({
  onNeedRefresh() {
    console.log('[PWA] New content available, refresh recommended.');
  },
  onOfflineReady() {
    console.log('[PWA] App is ready for offline usage.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
