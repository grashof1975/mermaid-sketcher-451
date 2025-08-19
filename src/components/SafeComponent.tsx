
import React, { Suspense } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface SafeComponentProps {
  children: React.ReactNode
  name?: string
  loadingFallback?: React.ReactNode
  errorFallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

const DefaultLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="mt-2 text-sm text-gray-500">Loading...</p>
    </div>
  </div>
)

/**
 * SafeComponent wraps children with both Error Boundary and Suspense
 * to provide comprehensive error and loading state management
 */
export const SafeComponent: React.FC<SafeComponentProps> = ({
  children,
  name = 'SafeComponent',
  loadingFallback = <DefaultLoadingFallback />,
  errorFallback
}) => {
  return (
    <ErrorBoundary name={name} fallback={errorFallback}>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default SafeComponent
