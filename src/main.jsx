import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'antd/dist/reset.css'   // estilos globales de Ant Design
import './styles/global.css'   // estilos modernos personalizados
import { BrowserRouter } from 'react-router-dom'
import './utils/suppressWarnings.js'  // Suprimir warnings de compatibilidad

// Limpiar caché al iniciar
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
