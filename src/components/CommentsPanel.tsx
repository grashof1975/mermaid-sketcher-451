import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Eye, Link, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Comment, ProvisionalView } from '@/types/comments';
import { SavedView } from '@/components/ViewSidebar';
import { toast } from '@/hooks/use-toast';

interface CommentsPanelProps {
  comments: Comment[];
  provisionalViews: ProvisionalView[];
  savedViews: SavedView[];
  currentView: { zoom: number; pan: { x: number; y: number } };
  onAddComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  onDeleteComment: (id: string) => void;
  onCreateProvisionalView: (commentId: string, viewName: string) => void;
  onLoadView: (view: SavedView | ProvisionalView) => void;
  onUnlinkView: (commentId: string) => void;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  comments,
  provisionalViews,
  savedViews,
  currentView,
  onAddComment,
  onDeleteComment,
  onCreateProvisionalView,
  onLoadView,
  onUnlinkView,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const handleAddComment = () => {
    if (!newCommentText.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un testo per il commento",
        variant: "destructive",
      });
      return;
    }

    onAddComment({
      text: newCommentText.trim(),
    });

    setNewCommentText('');
    setIsAddingComment(false);
    
    toast({
      title: "Commento aggiunto",
      description: "Il commento è stato salvato",
    });
  };

  const handleCreateProvisionalView = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const viewName = `Vista per: ${comment.text.substring(0, 30)}${comment.text.length > 30 ? '...' : ''}`;
    onCreateProvisionalView(commentId, viewName);
    
    toast({
      title: "Vista provvisoria creata",
      description: `Vista "${viewName}" collegata al commento`,
    });
  };

  const getLinkedView = (comment: Comment): SavedView | ProvisionalView | null => {
    if (!comment.linkedViewId) return null;
    
    if (comment.isProvisional) {
      return provisionalViews.find(v => v.id === comment.linkedViewId) || null;
    } else {
      return savedViews.find(v => v.id === comment.linkedViewId) || null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Commenti</h3>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingComment(!isAddingComment)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo
        </Button>
      </div>

      {isAddingComment && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="comment-text">Testo del commento</Label>
                <Textarea
                  id="comment-text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Scrivi il tuo commento..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingComment(false);
                    setNewCommentText('');
                  }}
                >
                  Annulla
                </Button>
                <Button size="sm" onClick={handleAddComment}>
                  Salva
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nessun commento ancora</p>
            <p className="text-sm">Aggiungi il primo commento al tuo diagramma</p>
          </div>
        ) : (
          comments.map((comment) => {
            const linkedView = getLinkedView(comment);
            
            return (
              <Card key={comment.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(comment.timestamp)}
                        </span>
                        {linkedView && (
                          <Badge variant={comment.isProvisional ? "outline" : "secondary"} className="text-xs">
                            {comment.isProvisional ? "Vista provvisoria" : "Vista salvata"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteComment(comment.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    {linkedView ? (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onLoadView(linkedView)}
                                className="flex-1"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {linkedView.name}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Carica questa vista</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onUnlinkView(comment.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Scollega vista dal commento</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateProvisionalView(comment.id)}
                              className="flex-1"
                            >
                              <Link className="h-4 w-4 mr-2" />
                              Crea vista provvisoria
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Crea una vista provvisoria con la posizione e zoom attuali</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentsPanel;