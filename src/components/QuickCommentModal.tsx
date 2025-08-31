import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, MessageSquare, X, GripVertical } from 'lucide-react';

interface QuickCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (viewName: string, comment: string) => void;
  currentZoom: number;
  currentPan: { x: number; y: number };
  selectedComponentText?: string;
  viewNameTemplate?: string;
  existingViews?: Array<{ name: string; id: string }>;
}

export const QuickCommentModal: React.FC<QuickCommentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentZoom,
  currentPan,
  selectedComponentText,
  viewNameTemplate = "v.01",
  existingViews = []
}) => {
  const [viewName, setViewName] = useState('');
  const [comment, setComment] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const barRef = useRef<HTMLDivElement>(null);

  // Function to get the next incremental identifier
  const getNextIdentifier = (template: string, existingViews: Array<{ name: string; id: string }>) => {
    // Extract the base pattern (e.g., "v." from "v.01")
    const match = template.match(/^(.+?)(\d+)$/);
    if (!match) {
      return template; // If no number pattern, return as is
    }
    
    const [, prefix, numberStr] = match;
    const baseNumber = parseInt(numberStr, 10);
    const numberLength = numberStr.length;
    
    // Find all existing views that match this pattern
    const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)`);
    const existingNumbers = existingViews
      .map(view => {
        const match = view.name.match(pattern);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    // Find the highest existing number and increment
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : baseNumber - 1;
    const nextNumber = maxNumber + 1;
    
    // Pad with zeros to maintain the original length
    const paddedNumber = nextNumber.toString().padStart(numberLength, '0');
    
    return `${prefix}${paddedNumber}`;
  };

  // Load position and size from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('quickCommentModal-position');
    const savedSize = localStorage.getItem('quickCommentModal-size');
    
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        // Default center position if parsing fails
        setPosition({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 });
      }
    } else {
      // Default center position
      const defaultX = Math.max(window.innerWidth / 2 - 200, 0);
      const defaultY = Math.max(window.innerHeight / 2 - 150, 0);
      setPosition({ x: defaultX, y: defaultY });
    }

    if (savedSize) {
      try {
        const parsed = JSON.parse(savedSize);
        setSize(parsed);
      } catch (e) {
        // Keep default size if parsing fails
      }
    }
  }, [isOpen]);

  // Save position and size to localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('quickCommentModal-position', JSON.stringify(position));
    }
  }, [position, isOpen]);

  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('quickCommentModal-size', JSON.stringify(size));
    }
  }, [size, isOpen]);

  // Initialize comment with selected component text when modal opens
  useEffect(() => {
    if (isOpen && selectedComponentText) {
      const initialComment = `${selectedComponentText}\n    • `;
      setComment(initialComment);
      const nextIdentifier = getNextIdentifier(viewNameTemplate, existingViews);
      setViewName(`${nextIdentifier} - ${selectedComponentText}`); // Combine incremental template with component text
    } else if (isOpen && !selectedComponentText) {
      setComment('');
      const nextIdentifier = getNextIdentifier(viewNameTemplate, existingViews);
      setViewName(nextIdentifier); // Fallback to incremental template if no component text
    }
  }, [isOpen, selectedComponentText, viewNameTemplate, existingViews]);

  const handleSave = () => {
    if (viewName.trim()) {
      // Permettiamo di salvare anche senza commento
      onSave(viewName.trim(), comment.trim() || '');
      setViewName('');
      setComment('');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!barRef.current) return;
    
    setIsDragging(true);
    const rect = barRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within screen bounds
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    // Resize from bottom-right corner
    const newWidth = Math.max(300, resizeStart.width + deltaX); // Min width 300px
    const newHeight = Math.max(200, resizeStart.height + deltaY); // Min height 200px
    
    // Keep within screen bounds
    const maxWidth = window.innerWidth - position.x;
    const maxHeight = window.innerHeight - position.y;
    
    setSize({
      width: Math.min(newWidth, maxWidth),
      height: Math.min(newHeight, maxHeight)
    });
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart]);

  if (!isOpen) return null;

  return (
    <div 
      ref={barRef}
      className="fixed z-30"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
      onKeyDown={handleKeyPress}
      tabIndex={-1}
    >
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg h-full flex flex-col">
        {/* Header - Draggable area */}
        <div 
          className="flex items-center justify-between p-3 border-b cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-semibold">Salva Vista</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Description */}
          <div className="text-xs text-muted-foreground">
            {selectedComponentText 
              ? `Salva una vista focalizzata sul componente "${selectedComponentText}" con commento opzionale.`
              : "Salva la vista corrente del diagramma con commento opzionale."
            }
          </div>

          {/* Current view info */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            <strong>Vista corrente:</strong> Zoom {currentZoom.toFixed(1)}x, 
            Pan ({currentPan.x.toFixed(0)}, {currentPan.y.toFixed(0)})
          </div>

          {/* View name input */}
          <div className="space-y-2">
            <Label htmlFor="viewName" className="text-sm font-medium">
              Nome della vista
            </Label>
            <Input
              id="viewName"
              placeholder="es. Dettaglio flusso principale"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              className="text-sm"
              autoFocus
            />
          </div>

          {/* Comment input */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Commento <span className="text-muted-foreground">(opzionale)</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Descrivi cosa è interessante in questa vista (opzionale)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-sm min-h-16 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="p-3 border-t">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Ctrl+Enter per salvare, Esc per chiudere
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Annulla
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!viewName.trim()}
                className="flex items-center gap-1"
              >
                <Save className="h-3 w-3" />
                Salva
              </Button>
            </div>
          </div>
        </div>

        {/* Resize handle */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-muted-foreground/50 rounded-sm"></div>
        </div>
      </div>
    </div>
  );
};