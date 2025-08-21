import React, { Suspense, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SafeComponent } from './components/SafeComponent'

// Global CSS imports
import './index.css'

// Lazy load components to improve initial load time
const MainLayout = React.lazy(() => import('./components/MainLayout'))

// Loading fallback for the entire app
const AppLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-lg font-semibold text-gray-700 mb-2">AI Diagram Creator</h2>
      <p className="text-gray-500">Loading application...</p>
    </div>
  </div>
)

// Error fallback for the entire app
const AppErrorFallback = ({ 
  error, 
  retry 
}: { 
  error: Error | null
  retry: () => void 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-red-50">
    <div className="max-w-lg mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
      <div className="text-red-500 mb-6">
        <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Application Error
      </h1>
      
      <p className="text-gray-600 mb-6">
        We're sorry, but something went wrong with the AI Diagram Creator. 
        Our team has been notified and is working on a fix.
      </p>

      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-6 text-left bg-gray-50 p-4 rounded">
          <summary className="cursor-pointer font-medium text-gray-700 mb-2">
            Technical Details (Development Only)
          </summary>
          <pre className="text-xs text-red-600 overflow-auto max-h-40 whitespace-pre-wrap">
            {error.message}
            {error.stack && (
              <>
                {'\n\nStack Trace:\n'}
                {error.stack}
              </>
            )}
          </pre>
        </details>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={retry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Try Again
        </button>
        <button
          onClick={() => {
            // Clear localStorage to reset app state
            localStorage.clear()
            window.location.reload()
          }}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Reset & Reload
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          If the problem persists, please{' '}
          <a 
            href="mailto:support@example.com" 
            className="text-blue-600 hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  </div>
)

function App() {
  // Global error handler for unhandled promises
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      event.preventDefault() // Prevent the default browser behavior
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <ErrorBoundary fallback={AppErrorFallback}>
      <SafeComponent 
        loadingFallback={<AppLoadingFallback />}
        name="MainApp"
      >
        <MainLayout />
      </SafeComponent>
    </ErrorBoundary>
  )
}

export default App