
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Safe root creation with error handling
function createSafeRoot() {
  try {
    const container = document.getElementById('root')
    
    if (!container) {
      throw new Error('Root container not found')
    }

    const root = createRoot(container)
    return root
  } catch (error) {
    console.error('Failed to create React root:', error)
    
    // Fallback: render error message directly to DOM
    document.body.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #fef2f2 0%, #fce7e7 100%);
        font-family: system-ui, -apple-system, sans-serif;
        padding: 20px;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
        ">
          <h1 style="color: #dc2626; margin-bottom: 20px;">⚠️ Application Error</h1>
          <p style="color: #666; margin-bottom: 20px;">
            Failed to initialize the AI Diagram Creator. Please refresh the page.
          </p>
          <button onclick="window.location.reload()" style="
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          ">🔄 Refresh Page</button>
        </div>
      </div>
    `
    return null
  }
}

// Initialize app with comprehensive error handling
try {
  const root = createSafeRoot()
  
  if (root) {
    root.render(
      <React.StrictMode>
        <ErrorBoundary name="Root">
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    )
  }
} catch (error) {
  console.error('Critical error during app initialization:', error)
}

// Additional safety net for any uncaught errors during module loading
window.addEventListener('error', (event) => {
  console.error('Window error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})
