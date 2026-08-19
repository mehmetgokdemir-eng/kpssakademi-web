import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { SettingsProvider } from './lib/settings.jsx'
import { serviceWorkerKaydet } from './lib/guncelleme.js'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SettingsProvider>
  </React.StrictMode>
)

if (import.meta.env.PROD) {
  window.addEventListener('load', serviceWorkerKaydet)
}
