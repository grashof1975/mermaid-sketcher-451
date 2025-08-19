
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
  name?: string
}

const DefaultFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        🔧 Something went wrong
      </h2>
      
      <p className="text-gray-600 mb-6">
        The application encountered an error, but we've contained it safely.
      </p>
      
      {error && (
        <details className="text-left bg-gray-50 rounded p-3 mb-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs text-gray-600 overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={resetError}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          🔃 Reload Page
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        AI Diagram Creator • Error contained safely
      </p>
    </div>
  </div>
)

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`ErrorBoundary (${this.props.name || 'Unknown'}) caught an error:`, error, errorInfo)
    
    this.setState({ error, errorInfo })
    
    // Log to external service in production
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Basic error logging
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        boundaryName: this.props.name || 'Unknown'
      }
      
      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry, LogRocket, etc.
        console.warn('Error logged:', errorData)
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  private resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    if (prevState.hasError && !this.state.hasError) {
      // Reset successful, clear any pending timeouts
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId)
        this.resetTimeoutId = null
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

export default ErrorBoundary
