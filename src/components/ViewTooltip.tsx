
import React from 'react';
import { Eye, MessageSquare, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Comment, ProvisionalView } from '@/types/comments';
import { SavedView } from '@/types/database';

interface ViewTooltipProps {
  view: SavedView;
  comments: Comment[];
  provisionalViews: ProvisionalView[];
  onLoadView: (view: SavedView) => void;
  onApplyProvisionalView: (viewId: string, provisionalViewId: string) => void;
  children: React.ReactNode;
}

const ViewTooltip: React.FC<ViewTooltipProps> = ({
  view,
  comments,
  provisionalViews,
  onLoadView,
  onApplyProvisionalView,
  children
}) => {
  // Get comments for this view
  const viewComments = comments.filter(comment => comment.viewId === view.id);
  
  // Get provisional views for this view (from linked comments)
  const viewProvisionalViews = provisionalViews.filter(pv => 
    viewComments.some(c => c.linkedViewId === pv.id)
  );

  const formatZoom = (zoom: number) => `${Math.round(zoom * 100)}%`;
  const formatPan = (panX: number, panY: number) => 
    `X: ${Math.round(panX)}, Y: ${Math.round(panY)}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="right" align="start">
        <div className="space-y-3">
          {/* View header */}
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h4 className="font-medium truncate">{view.name}</h4>
          </div>
          
          {/* View details */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Zoom: {formatZoom(view.zoom_level)}</div>
            <div>Pan: {formatPan(view.pan_x, view.pan_y)}</div>
            <div>Saved: {new Date(view.created_at).toLocaleString()}</div>
          </div>

          {/* Load view button */}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onLoadView(view)}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            Load View
          </Button>

          {/* Comments */}
          {viewComments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Comments ({viewComments.length})</span>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {viewComments.map(comment => (
                    <div key={comment.id} className="p-2 bg-muted/50 rounded text-xs">
                      <p className="line-clamp-2">{comment.text}</p>
                      <p className="text-muted-foreground mt-1">
                        {new Date(comment.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Provisional views */}
          {viewProvisionalViews.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-accent" />
                  <span className="font-medium text-sm">Provisional Views ({viewProvisionalViews.length})</span>
                </div>
                
                <div className="space-y-2">
                  {viewProvisionalViews.map(pv => {
                    const relatedComment = viewComments.find(c => c.linkedViewId === pv.id);
                    return (
                      <div key={pv.id} className="p-2 bg-accent/10 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{pv.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatZoom(pv.zoom)} • {formatPan(pv.pan.x, pv.pan.y)}
                            </p>
                            {relatedComment && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                "{relatedComment.text}"
                              </p>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => onApplyProvisionalView(view.id, pv.id)}
                            className="ml-2 h-7 w-7 p-0"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* No comments message */}
          {viewComments.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-2">
              No comments for this view
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ViewTooltip;
