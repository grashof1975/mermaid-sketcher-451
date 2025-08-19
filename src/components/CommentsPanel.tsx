
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  Eye,
  Link as LinkIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useComments } from '@/hooks/useComments';
import { useViews } from '@/hooks/useViews';
import { PreviewRef } from '@/components/Preview';

interface CommentsPanelProps {
  diagramId: string;
  previewRef: React.RefObject<PreviewRef>;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  diagramId,
  previewRef
}) => {
  const { comments, createComment, updateComment, deleteComment } = useComments(diagramId);
  const { views } = useViews(diagramId);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleCreateComment = async () => {
    if (!newCommentText.trim()) return;
    
    await createComment({
      text: newCommentText,
      is_resolved: false
    });
    
    setNewCommentText('');
  };

  const handleEditComment = (comment: any) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async () => {
    if (!editingComment || !editText.trim()) return;
    
    await updateComment(editingComment, { text: editText });
    setEditingComment(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  const handleToggleResolved = async (comment: any) => {
    await updateComment(comment.id, { is_resolved: !comment.is_resolved });
  };

  const handleLinkToView = async (comment: any, viewId: string) => {
    await updateComment(comment.id, { linked_view_id: viewId });
  };

  const handleLoadLinkedView = (viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view && previewRef.current) {
      previewRef.current.setView(view.zoom_level, { x: view.pan_x, y: view.pan_y });
    }
  };

  const getLinkedView = (viewId: string | null) => {
    return viewId ? views.find(v => v.id === viewId) : null;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Add New Comment */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="min-h-[60px] resize-none"
          />
          <Button 
            onClick={handleCreateComment}
            disabled={!newCommentText.trim()}
            className="w-full"
            size="sm"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Add Comment
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Add your first comment above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const linkedView = getLinkedView(comment.linked_view_id);
                const isEditing = editingComment === comment.id;
                
                return (
                  <div
                    key={comment.id}
                    className={cn(
                      "group p-3 rounded-lg border",
                      comment.is_resolved 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.profile?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {comment.profile?.username || 'Unknown User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                          {comment.is_resolved && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[60px] resize-none"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEdit}>
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleCancelEdit}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                              {comment.text}
                            </p>
                            
                            {linkedView && (
                              <div 
                                className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                onClick={() => handleLoadLinkedView(linkedView.id)}
                              >
                                <Eye className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-blue-600 font-medium">
                                  {linkedView.name}
                                </span>
                                <span className="text-xs text-blue-500">
                                  {Math.round(linkedView.zoom_level * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {!isEditing && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleResolved(comment)}>
                              <Check className="mr-2 h-4 w-4" />
                              {comment.is_resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                            </DropdownMenuItem>
                            
                            {views.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled className="text-xs font-medium">
                                  Link to View:
                                </DropdownMenuItem>
                                {views.slice(0, 5).map((view) => (
                                  <DropdownMenuItem 
                                    key={view.id}
                                    onClick={() => handleLinkToView(comment, view.id)}
                                  >
                                    <LinkIcon className="mr-2 h-3 w-3" />
                                    <span className="truncate">{view.name}</span>
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommentsPanel;
