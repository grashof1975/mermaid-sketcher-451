import React, { useEffect, useRef, useState, useCallback } from 'react'
import mermaid from 'mermaid'

interface SafeMermaidRendererProps {
  code: string
  id?: string
  className?: string
  onError?: (error: Error) => void
  onSuccess?: () => void
}

interface MermaidState {
  isLoading: boolean
  error: Error | null
  rendered: boolean
}

export const SafeMermaidRenderer: React.FC<SafeMermaidRendererProps> = ({
  code,
  id = 'mermaid-diagram',
  className = '',
  onError,
  onSuccess
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<MermaidState>({
    isLoading: false,
    error: null,
    rendered: false
  })

  // Initialize Mermaid with safe configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system',
      fontSize: 14,
      // Error handling
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
      // Security settings
      htmlLabels: false,
      maxTextSize: 50000,
      maxEdges: 500,
    })
  }, [])

  const renderDiagram = useCallback(async (diagramCode: string) => {
    if (!containerRef.current || !diagramCode.trim()) {
      setState(prev => ({ ...prev, error: null, rendered: false }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Validate Mermaid syntax before rendering
      await mermaid.parse(diagramCode)
      
      // Clear previous content
      containerRef.current.innerHTML = ''
      
      // Generate unique ID to avoid conflicts
      const uniqueId = `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Render the diagram
      const { svg } = await mermaid.render(uniqueId, diagramCode)
      
      if (containerRef.current) {
        containerRef.current.innerHTML = svg
        setState({ isLoading: false, error: null, rendered: true })
        onSuccess?.()
      }
    } catch (error) {
      const mermaidError = error instanceof Error ? error : new Error(String(error))
      console.error('Mermaid rendering error:', mermaidError)
      
      setState({ isLoading: false, error: mermaidError, rendered: false })
      onError?.(mermaidError)

      // Display user-friendly error
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-48 bg-red-50 border-2 border-dashed border-red-300 rounded-lg">
            <div class="text-center p-4">
              <svg class="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <h3 class="text-sm font-medium text-red-800">Invalid Diagram Syntax</h3>
              <p class="text-xs text-red-600 mt-1">Please check your Mermaid code syntax</p>
              ${process.env.NODE_ENV === 'development' ? `
                <details class="mt-2 text-left">
                  <summary class="text-xs cursor-pointer">Error Details</summary>
                  <pre class="text-xs text-red-600 mt-1 overflow-auto max-h-20">${mermaidError.message}</pre>
                </details>
              ` : ''}
            </div>
          </div>
        `
      }
    }
  }, [id, onError, onSuccess])

  // Re-render when code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      renderDiagram(code)
    }, 100) // Small delay to debounce rapid changes

    return () => clearTimeout(timer)
  }, [code, renderDiagram])

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Rendering diagram...</p>
      </div>
    </div>
  )

  const EmptyState = () => (
    <div className="flex items-center justify-center h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center p-4">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-sm font-medium text-gray-700">No Diagram</h3>
        <p className="text-xs text-gray-500 mt-1">Start typing Mermaid code to see your diagram</p>
      </div>
    </div>
  )

  return (
    <div className={`mermaid-container ${className}`}>
      {state.isLoading && <LoadingSpinner />}
      {!state.isLoading && !code.trim() && <EmptyState />}
      <div 
        ref={containerRef}
        className={`mermaid-content ${state.isLoading ? 'hidden' : ''}`}
        style={{ minHeight: code.trim() ? 'auto' : '0' }}
      />
    </div>
  )
}

export default SafeMermaidRenderer