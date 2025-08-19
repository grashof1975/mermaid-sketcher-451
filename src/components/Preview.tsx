
import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import mermaid from 'mermaid';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewProps {
  code: string;
  className?: string;
  onViewChange?: (zoom: number, pan: { x: number; y: number }) => void;
}

export interface PreviewRef {
  setView: (zoom: number, pan: { x: number; y: number }) => void;
  resetView: () => void;
  getView: () => { zoom: number; pan: { x: number; y: number } };
}

const Preview = forwardRef<PreviewRef, PreviewProps>(({ code, className, onViewChange }, ref) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef<number>(0);
  
  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    setView: (newZoom: number, newPan: { x: number; y: number }) => {
      setZoom(newZoom);
      setPan(newPan);
    },
    resetView: () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      onViewChange?.(1, { x: 0, y: 0 });
    },
    getView: () => ({ zoom, pan })
  }), [zoom, pan, onViewChange]);
  
  useEffect(() => {
    // Initialize mermaid with better configuration
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true
        },
        class: {
          useMaxWidth: true,
          htmlLabels: true
        },
        sequence: {
          useMaxWidth: true,
          wrap: true
        },
        gantt: {
          useMaxWidth: true
        },
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#e5e7eb',
          lineColor: '#6b7280',
          sectionBkgColor: '#f9fafb',
          altSectionBkgColor: '#ffffff',
          gridColor: '#e5e7eb',
          secondaryColor: '#f1f5f9',
          tertiaryColor: '#f8fafc'
        }
      });
      console.log('Mermaid initialized successfully');
    } catch (initError) {
      console.error('Failed to initialize Mermaid:', initError);
    }
  }, []);
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (!code?.trim()) {
        setSvg('');
        setError(null);
        setLoading(false);
        return;
      }

      // Increment render ID to handle race conditions
      const currentRenderId = ++renderIdRef.current;

      try {
        setLoading(true);
        setError(null);
        
        console.log('Attempting to render diagram with code:', code);
        
        // Clean the code - remove extra whitespace and ensure proper formatting
        const cleanCode = code.trim();
        
        // Generate unique ID for this render
        const diagramId = `mermaid-diagram-${currentRenderId}`;
        
        // Use mermaid.parse to validate syntax first
        const parseResult = await mermaid.parse(cleanCode);
        console.log('Mermaid parse successful:', parseResult);
        
        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(diagramId, cleanCode);
        
        // Check if this is still the current render (avoid race conditions)
        if (currentRenderId === renderIdRef.current) {
          console.log('Setting rendered SVG');
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        
        // Check if this is still the current render
        if (currentRenderId === renderIdRef.current) {
          let errorMessage = 'Failed to render diagram';
          
          if (err instanceof Error) {
            if (err.message.includes('Parse error')) {
              errorMessage = `Syntax error in diagram: ${err.message}`;
            } else if (err.message.includes('No diagram type')) {
              errorMessage = 'Invalid diagram type. Please check your diagram syntax.';
            } else {
              errorMessage = err.message;
            }
          }
          
          setError(errorMessage);
          setSvg('');
        }
      } finally {
        // Only update loading if this is still the current render
        if (currentRenderId === renderIdRef.current) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to debounce rapid changes
    const timeoutId = setTimeout(renderDiagram, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [code]);

  // Zoom and pan handlers
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5);

    // Calculate new pan to zoom towards mouse cursor
    const zoomRatio = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
    const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
    onViewChange?.(newZoom, { x: newPanX, y: newPanY });
  }, [zoom, pan, onViewChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setPan(prevPan => {
      const newPan = {
        x: prevPan.x + deltaX,
        y: prevPan.y + deltaY
      };
      onViewChange?.(zoom, newPan);
      return newPan;
    });

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos, zoom, onViewChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onViewChange?.(1, { x: 0, y: 0 });
  }, [onViewChange]);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={cn("h-full w-full overflow-hidden bg-white dark:bg-slate-950", className)}>
      <div 
        ref={containerRef} 
        className="diagram-container min-h-full flex items-center justify-center relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onDoubleClick={resetView}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm animate-fade-in z-10">
            <div className="text-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Rendering diagram...</p>
            </div>
          </div>
        )}
        
        {error && !loading && (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg animate-fade-in max-w-lg mx-4">
            <h3 className="text-red-600 dark:text-red-400 font-medium mb-2">Diagram Error</h3>
            <pre className="text-red-500 dark:text-red-300 text-sm whitespace-pre-wrap font-mono">{error}</pre>
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800/30">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Debug Info:</p>
              <p className="text-xs text-red-500 dark:text-red-400">
                Code length: {code?.length || 0} characters
              </p>
              <p className="text-xs text-red-500 dark:text-red-400">
                First line: {code?.split('\n')[0] || 'empty'}
              </p>
            </div>
          </div>
        )}
        
        {!loading && !error && svg ? (
          <div 
            ref={contentRef}
            className="animate-scale-in mermaid-container"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            dangerouslySetInnerHTML={{ __html: svg }} 
          />
        ) : (
          !loading && !error && (
            <div className="text-center text-slate-400 dark:text-slate-500 animate-fade-in p-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v3m2 4h10M7 7h3m0 0v3m0-3h3m-3 0v3"/>
              </svg>
              <h3 className="text-lg font-medium mb-2">Your Diagram Will Appear Here</h3>
              <p className="text-sm mb-4">Enter Mermaid code in the editor to see your diagram</p>
              <div className="text-xs space-y-1 max-w-xs mx-auto">
                <p>• Mouse wheel to zoom</p>
                <p>• Drag to pan</p>
                <p>• Double-click to reset view</p>
              </div>
            </div>
          )
        )}
        
        {/* Zoom indicator */}
        {zoom !== 1 && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>
    </div>
  );
});

Preview.displayName = 'Preview';

export default Preview;
