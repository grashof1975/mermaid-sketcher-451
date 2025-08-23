import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Save, MessageSquare, X } from 'lucide-react';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyPress}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Salva Vista
          </DialogTitle>
          <DialogDescription>
            {selectedComponentText 
              ? `Salva una vista focalizzata sul componente "${selectedComponentText}" con commento opzionale.`
              : "Salva la vista corrente del diagramma con commento opzionale."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
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
              className="text-sm min-h-20 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
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
      </DialogContent>
    </Dialog>
  );
};