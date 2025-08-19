
import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary'
import SafeComponent from './components/SafeComponent'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  useEffect(() => {
    // Global error handlers
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      event.preventDefault() // Prevent the default browser behavior
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
    }

    // Add global error listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <ErrorBoundary name="App">
      <SafeComponent name="AppContainer">
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={
                  <SafeComponent name="Index">
                    <Index />
                  </SafeComponent>
                } />
                <Route path="*" element={
                  <SafeComponent name="NotFound">
                    <NotFound />
                  </SafeComponent>
                } />
              </Routes>
              <Toaster />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </SafeComponent>
    </ErrorBoundary>
  )
}

export default App
