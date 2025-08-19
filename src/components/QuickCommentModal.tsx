import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Send } from 'lucide-react';
import { SavedView } from '@/types/database';

interface QuickCommentModalProps {
  view: SavedView;
  onAddComment: (text: string, linkedViewId?: string) => Promise<any>;
  children: React.ReactNode;
}

const QuickCommentModal: React.FC<QuickCommentModalProps> = ({
  view,
  onAddComment,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(commentText, view.id);
      setCommentText('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comment on "{view.name}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Zoom: {Math.round(view.zoom_level * 100)}%</p>
            <p>Position: ({view.pan_x.toFixed(0)}, {view.pan_y.toFixed(0)})</p>
          </div>
          
          <Textarea
            placeholder="Add your comment about this view..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            className="resize-none"
          />
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCommentModal;