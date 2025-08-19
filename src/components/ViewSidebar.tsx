
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
import ViewTooltip from '@/components/ViewTooltip';
import QuickCommentModal from '@/components/QuickCommentModal';
import { SavedView } from '@/types/database';

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
  const { views, saveView, updateView, deleteView } = useViews(diagramId);
  const { comments, addComment } = useComments(diagramId);
  const [viewName, setViewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'zoom'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const handleSaveView = async () => {
    if (!viewName.trim()) return;
    
    await saveView({
      name: viewName,
      zoom_level: isCreatingFolder ? 1 : zoom,
      pan_x: isCreatingFolder ? 0 : pan.x,
      pan_y: isCreatingFolder ? 0 : pan.y,
      is_folder: isCreatingFolder,
      parent_id: selectedParent
    });
    
    setViewName('');
    setIsCreatingFolder(false);
    setSelectedParent(null);
  };

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleLoadView = async (view: any) => {
    onViewChange(view.zoom_level, { x: view.pan_x, y: view.pan_y });
    previewRef.current?.setView(view.zoom_level, { x: view.pan_x, y: view.pan_y });
  };

  // Recursive function to render view tree
  const renderViewItem = (view: SavedView, level: number = 0) => {
    const isFolder = view.is_folder;
    const isExpanded = expandedFolders.has(view.id);
    const viewComments = getViewComments(view.id);
    const hasChildren = view.children && view.children.length > 0;

    if (searchTerm && !view.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    return (
      <div key={view.id}>
        <div
          className={cn(
            "group relative flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer",
            level > 0 && "ml-4 border-l border-slate-200 dark:border-slate-700"
          )}
          onClick={() => isFolder ? toggleFolder(view.id) : handleLoadView(view)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isFolder ? (
                <>
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  )}
                </>
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="font-medium truncate">{view.name}</span>
              {!isFolder && viewComments.length > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 text-blue-500" />
                  <Badge variant="secondary" className="text-xs">
                    {viewComments.length}
                  </Badge>
                </div>
              )}
            </div>
            {!isFolder && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{Math.round(view.zoom_level * 100)}%</span>
                <span>•</span>
                <span>({view.pan_x.toFixed(0)}, {view.pan_y.toFixed(0)})</span>
              </div>
            )}
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
              {!isFolder && (
                <>
                  <DropdownMenuItem onClick={() => handleLoadView(view)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Load View
                  </DropdownMenuItem>
                  <QuickCommentModal view={view} onAddComment={addComment}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Add Comment
                    </DropdownMenuItem>
                  </QuickCommentModal>
                  <DropdownMenuItem onClick={() => updateView(view.id, { 
                    zoom_level: zoom, 
                    pan_x: pan.x, 
                    pan_y: pan.y 
                  })}>
                    <Save className="mr-2 h-4 w-4" />
                    Update with Current
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {isFolder && (
                <>
                  <DropdownMenuItem onClick={() => setSelectedParent(view.id)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add View to Folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                onClick={() => deleteView(view.id)}
                className="text-red-600"
              >
                Delete {isFolder ? 'Folder' : 'View'}
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        {/* Render children if folder is expanded */}
        {isFolder && isExpanded && hasChildren && (
          <div className="ml-2">
            {view.children!.map(child => renderViewItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredViews = views.filter(view =>
    view.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getViewComments = (viewId: string) => {
    return comments.filter(comment => comment.linked_view_id === viewId);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Save New View */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Input
            placeholder={isCreatingFolder ? "Folder name" : selectedParent ? "View name (in folder)" : "View name"}
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveView()}
          />
          {selectedParent && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Folder className="h-3 w-3" />
              Adding to: {views.find(v => v.id === selectedParent)?.name}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedParent(null)}
                className="h-4 w-4 p-0 ml-1"
              >
                ×
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveView}
              disabled={!viewName.trim()}
              className="flex-1"
              size="sm"
            >
              <Save className="mr-2 h-4 w-4" />
              {isCreatingFolder ? 'Create Folder' : 'Save View'}
            </Button>
            <Button 
              onClick={handleCreateFolder}
              variant="outline"
              size="sm"
              disabled={isCreatingFolder}
            >
              <Folder className="h-4 w-4" />
            </Button>
          </div>
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
          {filteredViews.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No saved views yet</p>
              <p className="text-sm">Save your first view above</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredViews.map((view) => renderViewItem(view))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ViewSidebar;
