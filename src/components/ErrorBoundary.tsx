import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{error: Error | null; retry: () => void}>
}

const DefaultErrorFallback = ({ 
  error, 
  retry 
}: { 
  error: Error | null
  retry: () => void 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Oops! Something went wrong
      </h1>
      <p className="text-gray-600 mb-4">
        The application encountered an unexpected error.
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
            Error Details (Development)
          </summary>
          <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
      <div className="flex gap-3 justify-center">
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
)

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In production, send to error tracking service (e.g., Sentry)
    console.error('Production Error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  }

  private retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error} 
          retry={this.retry}
        />
      )
    }

    return this.props.children
  }
}

// Hook for functional components error handling
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: string) => {
    console.error('useErrorHandler:', error, errorInfo)
    
    // In a real app, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error service
    }
  }
}