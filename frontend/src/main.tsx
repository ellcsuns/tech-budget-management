import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Restore saved font size
const savedFontSize = localStorage.getItem('app_font_size');
if (savedFontSize) {
  const scales: Record<string, number> = { xs: 0.8, sm: 0.9, md: 1.0, lg: 1.1, xl: 1.2 };
  const scale = scales[savedFontSize] || 1.0;
  document.documentElement.style.fontSize = `${scale * 16}px`;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
