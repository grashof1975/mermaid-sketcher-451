import React, { Suspense, ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface SafeComponentProps {
  children: ReactNode
  loadingFallback?: ReactNode
  errorFallback?: React.ComponentType<{error: Error | null; retry: () => void}>
  name?: string
}

const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

// Safe wrapper that handles both loading and error states
export const SafeComponent: React.FC<SafeComponentProps> = ({
  children,
  loadingFallback = <DefaultLoadingFallback />,
  errorFallback,
  name = 'Component'
}) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

// Higher-order component for wrapping components safely
export const withSafeComponent = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<SafeComponentProps, 'children'> = {}
) => {
  const SafeWrappedComponent = (props: P) => (
    <SafeComponent {...options}>
      <WrappedComponent {...props} />
    </SafeComponent>
  )
  
  SafeWrappedComponent.displayName = `SafeComponent(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
  
  return SafeWrappedComponent
}

// Hook to safely execute async operations
export const useSafeAsync = () => {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const execute = React.useCallback(async (
    asyncFn: () => Promise<any>,
    onSuccess?: (result: any) => void,
    onError?: (error: Error) => void
  ) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await asyncFn()
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      
      console.error('useSafeAsync error:', error)
      
      if (onError) {
        onError(error)
      } else {
        // Default error handling
        console.error('Unhandled async error:', error)
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = React.useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  return {
    execute,
    loading,
    error,
    reset
  }
}