import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}))
}

// Empêche le zoom par double-tap sur iPad pendant le jeu.
let lastTouch = 0
document.addEventListener('touchend', (e) => {
  const now = Date.now()
  if (now - lastTouch < 300 && !(e.target as HTMLElement).closest('input,select,textarea')) e.preventDefault()
  lastTouch = now
}, { passive: false })
