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
    // Initialize mermaid with simple, working configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true
      },
      class: {
        useMaxWidth: false
      },
      sequence: {
        useMaxWidth: false
      },
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#e5e7eb',
        lineColor: '#6b7280',
        sectionBkgColor: '#f9fafb',
        altSectionBkgColor: '#ffffff',
        gridColor: '#e5e7eb'
      }
    });
    console.log('Mermaid initialized');
  }, []);
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (!code?.trim()) {
        setSvg('');
        setError(null);
        setLoading(false);
        return;
      }

      const currentRenderId = ++renderIdRef.current;
      console.log(`Starting render ${currentRenderId} with code:`, code);

      try {
        setLoading(true);
        setError(null);
        
        // Clean the code
        const cleanCode = code.trim();
        console.log('Clean code:', cleanCode);
        
        // Generate unique ID
        const diagramId = `diagram-${currentRenderId}-${Date.now()}`;
        
        // Test if mermaid can parse the code
        try {
          await mermaid.parse(cleanCode);
          console.log('Mermaid parse successful');
        } catch (parseError) {
          console.error('Parse error:', parseError);
          throw new Error(`Syntax error: ${parseError instanceof Error ? parseError.message : 'Invalid diagram syntax'}`);
        }
        
        // Render the diagram
        const result = await mermaid.render(diagramId, cleanCode);
        console.log('Mermaid render successful');
        
        // Check if this is still the current render
        if (currentRenderId === renderIdRef.current) {
          setSvg(result.svg);
          console.log('SVG set successfully');
        }
      } catch (err) {
        console.error('Rendering error:', err);
        
        if (currentRenderId === renderIdRef.current) {
          let errorMessage = 'Failed to render diagram';
          
          if (err instanceof Error) {
            if (err.message.includes('Parse error') || err.message.includes('Syntax error')) {
              errorMessage = `Syntax error: ${err.message}`;
            } else if (err.message.includes('Lexical error')) {
              errorMessage = `Invalid diagram syntax: ${err.message}`;
            } else {
              errorMessage = err.message;
            }
          }
          
          setError(errorMessage);
          setSvg('');
        }
      } finally {
        if (currentRenderId === renderIdRef.current) {
          setLoading(false);
        }
      }
    };

    // Debounce the rendering
    const timeoutId = setTimeout(renderDiagram, 300);
    return () => clearTimeout(timeoutId);
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
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Rendering diagram...</p>
            </div>
          </div>
        )}
        
        {error && !loading && (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg max-w-lg mx-4">
            <h3 className="text-red-600 dark:text-red-400 font-medium mb-2">Diagram Error</h3>
            <p className="text-red-500 dark:text-red-300 text-sm mb-3">{error}</p>
            <div className="text-xs text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded">
              <p>Code preview: {code?.substring(0, 100)}...</p>
            </div>
          </div>
        )}
        
        {!loading && !error && svg ? (
          <div 
            ref={contentRef}
            className="mermaid-container"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            dangerouslySetInnerHTML={{ __html: svg }} 
          />
        ) : (
          !loading && !error && (
            <div className="text-center text-slate-400 dark:text-slate-500 p-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v3m2 4h10M7 7h3m0 0v3m0-3h3m-3 0v3"/>
              </svg>
              <h3 className="text-lg font-medium mb-2">Your Diagram Will Appear Here</h3>
              <p className="text-sm">Enter Mermaid code to see your diagram</p>
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
