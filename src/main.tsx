import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Global error handling
const handleGlobalError = (error: Error, errorInfo?: string) => {
  console.error('Global error caught:', error, errorInfo)
  
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, { extra: errorInfo })
  }
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  handleGlobalError(
    new Error(event.reason || 'Unhandled promise rejection'),
    `Promise rejection: ${event.reason}`
  )
  event.preventDefault()
})

// Handle global errors
window.addEventListener('error', (event) => {
  handleGlobalError(
    event.error || new Error(event.message),
    `Global error: ${event.filename}:${event.lineno}:${event.colno}`
  )
})

// Enhanced React error handling
const originalConsoleError = console.error
console.error = (...args: any[]) => {
  // Call original console.error
  originalConsoleError.apply(console, args)
  
  // Check if it's a React error
  const message = args[0]
  if (typeof message === 'string' && message.includes('React')) {
    handleGlobalError(
      new Error(message),
      'React error intercepted'
    )
  }
}

// Safe root creation with error handling
const createRoot = () => {
  try {
    const rootElement = document.getElementById('root')
    
    if (!rootElement) {
      throw new Error('Root element not found. Make sure there is an element with id="root" in your HTML.')
    }

    const root = ReactDOM.createRoot(rootElement)
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )

    console.log('✅ React app mounted successfully')
    
  } catch (error) {
    console.error('❌ Failed to mount React app:', error)
    
    // Fallback: Show a basic error message
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fef2f2;
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        ">
          <div style="
            max-width: 500px;
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          ">
            <div style="color: #dc2626; margin-bottom: 20px;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="margin: 0 auto;">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #111;">
              Failed to Load Application
            </h1>
            <p style="color: #666; margin-bottom: 24px;">
              We're sorry, but the AI Diagram Creator failed to initialize. This might be due to a browser compatibility issue or a temporary problem.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <button 
                onclick="window.location.reload()" 
                style="
                  background: #2563eb;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 500;
                "
              >
                Reload Page
              </button>
              <button 
                onclick="localStorage.clear(); window.location.reload()" 
                style="
                  background: #6b7280;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 500;
                "
              >
                Clear Data & Reload
              </button>
            </div>
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px;">
                Error: ${error instanceof Error ? error.message : String(error)}
              </p>
            </div>
          </div>
        </div>
      `
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createRoot)
} else {
  createRoot()
}