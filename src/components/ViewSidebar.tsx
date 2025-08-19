
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Eye, 
  Search, 
  Plus, 
  Folder,
  FolderOpen,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Undo,
  Redo,
  SortAsc,
  SortDesc,
  Calendar,
  Hash,
  MessageCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useViews } from '@/hooks/useViews';
import { useComments } from '@/hooks/useComments';
import { PreviewRef } from '@/components/Preview';

interface ViewSidebarProps {
  diagramId: string;
  zoom: number;
  pan: { x: number; y: number };
  onViewChange: (zoom: number, pan: { x: number; y: number }) => void;
  previewRef: React.RefObject<PreviewRef>;
}

const ViewSidebar: React.FC<ViewSidebarProps> = ({
  diagramId,
  zoom,
  pan,
  onViewChange,
  previewRef
}) => {
  const { views, createView, loadView, updateView, deleteView, createFolder } = useViews(diagramId);
  const { comments } = useComments(diagramId);
  const [viewName, setViewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'zoom'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSaveView = async () => {
    if (!viewName.trim()) return;
    
    await createView({
      name: viewName,
      zoom_level: zoom,
      pan_x: pan.x,
      pan_y: pan.y,
      is_folder: false,
      expanded: true,
      sort_order: 0
    });
    
    setViewName('');
  };

  const handleLoadView = async (view: any) => {
    await loadView(view.id);
    onViewChange(view.zoom_level, { x: view.pan_x, y: view.pan_y });
    previewRef.current?.setView(view.zoom_level, { x: view.pan_x, y: view.pan_y });
  };

  const filteredViews = views.filter(view =>
    view.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedViews = [...filteredViews].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'zoom':
        comparison = a.zoom_level - b.zoom_level;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getViewComments = (viewId: string) => {
    return comments.filter(comment => comment.linked_view_id === viewId);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Save New View */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Input
            placeholder="View name"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveView()}
          />
          <Button 
            onClick={handleSaveView}
            disabled={!viewName.trim()}
            className="w-full"
            size="sm"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Current View
          </Button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search views..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  {sortBy === 'name' && <Hash className="mr-2 h-3 w-3" />}
                  {sortBy === 'date' && <Calendar className="mr-2 h-3 w-3" />}
                  {sortBy === 'zoom' && <Eye className="mr-2 h-3 w-3" />}
                  {sortBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  <Hash className="mr-2 h-4 w-4" />
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('zoom')}>
                  <Eye className="mr-2 h-4 w-4" />
                  Zoom
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Views List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sortedViews.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No saved views yet</p>
              <p className="text-sm">Save your first view above</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedViews.map((view) => {
                const viewComments = getViewComments(view.id);
                
                return (
                  <div
                    key={view.id}
                    className="group relative flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => handleLoadView(view)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{view.name}</span>
                        {viewComments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3 text-blue-500" />
                            <Badge variant="secondary" className="text-xs">
                              {viewComments.length}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{Math.round(view.zoom_level * 100)}%</span>
                        <span>•</span>
                        <span>({view.pan_x.toFixed(0)}, {view.pan_y.toFixed(0)})</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleLoadView(view)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Load View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateView(view.id, { 
                          zoom_level: zoom, 
                          pan_x: pan.x, 
                          pan_y: pan.y 
                        })}>
                          <Save className="mr-2 h-4 w-4" />
                          Update with Current
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteView(view.id)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default ViewSidebar;
