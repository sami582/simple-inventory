// src/main.jsx
import './i18n' // <-- IMPORTANT: initialize i18n before app renders
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { InventoryProvider } from './contexts/InventoryContext'
import './styles/index.css' // adjust if your global CSS path differs

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <InventoryProvider>
          <App />
        </InventoryProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
