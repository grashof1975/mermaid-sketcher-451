
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
    // Initialize mermaid with custom config
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
    });
  }, []);
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (!code.trim()) {
        setSvg('');
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Add a small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const { svg } = await mermaid.render('mermaid-diagram', code);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        setSvg('');
      } finally {
        setLoading(false);
      }
    };

    renderDiagram();
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
    <div className={cn("h-full w-full overflow-hidden", className)}>
      <div 
        ref={containerRef} 
        className="diagram-container min-h-full flex items-center justify-center relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onDoubleClick={resetView}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm animate-fade-in z-10">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        )}
        
        {error && !loading && (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg animate-fade-in">
            <h3 className="text-red-600 dark:text-red-400 font-medium mb-2">Error</h3>
            <pre className="text-red-500 dark:text-red-300 text-sm whitespace-pre-wrap font-mono">{error}</pre>
          </div>
        )}
        
        {!loading && !error && svg ? (
          <div 
            ref={contentRef}
            className="animate-scale-in"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            dangerouslySetInnerHTML={{ __html: svg }} 
          />
        ) : (
          !loading && !error && (
            <div className="text-center text-slate-400 dark:text-slate-500 animate-fade-in">
              <p>Your diagram will appear here</p>
              <p className="text-xs mt-2">Usa la rotellina del mouse per zoomare • Trascina per spostare • Doppio click per resettare</p>
            </div>
          )
        )}
        
        {/* Zoom indicator */}
        {zoom !== 1 && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>
    </div>
  );
});

Preview.displayName = 'Preview';

export default Preview;
