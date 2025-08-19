import React from 'react';
import { Save, Eye, Trash2, RotateCcw, ArrowUpDown, ChevronRight, ChevronDown, FolderOpen, Folder, GripVertical, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/components/ui/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'zoom-asc' | 'zoom-desc';

export interface SavedView {
  id: string;
  name: string;
  zoom: number;
  pan: { x: number; y: number };
  timestamp: number;
  parentId?: string;
  isFolder?: boolean;
  expanded?: boolean;
}

interface ViewSidebarProps {
  savedViews: SavedView[];
  onSaveView: (name: string) => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onResetView: () => void;
  onUpdateViews: (views: SavedView[]) => void;
  setSavedViews?: (views: SavedView[]) => void;
  currentZoom: number;
  currentPan: { x: number; y: number };
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ViewSidebar: React.FC<ViewSidebarProps> = ({
  savedViews,
  onSaveView,
  onLoadView,
  onDeleteView,
  onResetView,
  onUpdateViews,
  setSavedViews,
  currentZoom,
  currentPan,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [newViewName, setNewViewName] = React.useState('');
  const [sortOption, setSortOption] = React.useState<SortOption>('date-desc');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      const activeView = savedViews.find(v => v.id === activeId);
      const overView = savedViews.find(v => v.id === overId);

      if (!activeView || !overView) return;

      const updatedViews = [...savedViews];
      
      // Make the dragged view a child of the target view
      const activeIndex = updatedViews.findIndex(v => v.id === activeId);
      updatedViews[activeIndex] = { ...activeView, parentId: overId };
      
      // Expand the parent view to show the new child
      setExpandedGroups(prev => new Set([...prev, overId]));
      
      onUpdateViews(updatedViews);
    }
  };

  // Organize views into hierarchical structure
  const organizedViews = React.useMemo(() => {
    const views = [...savedViews];
    const rootViews = views.filter(view => !view.parentId);
    const groupedViews: { [key: string]: SavedView[] } = {};
    
    views.forEach(view => {
      if (view.parentId) {
        if (!groupedViews[view.parentId]) {
          groupedViews[view.parentId] = [];
        }
        groupedViews[view.parentId].push(view);
      }
    });

    // Sort based on selected option
    const sortViews = (viewsToSort: SavedView[]) => {
      switch (sortOption) {
        case 'name-asc':
          return viewsToSort.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
          return viewsToSort.sort((a, b) => b.name.localeCompare(a.name));
        case 'date-asc':
          return viewsToSort.sort((a, b) => a.timestamp - b.timestamp);
        case 'date-desc':
          return viewsToSort.sort((a, b) => b.timestamp - a.timestamp);
        case 'zoom-asc':
          return viewsToSort.sort((a, b) => a.zoom - b.zoom);
        case 'zoom-desc':
          return viewsToSort.sort((a, b) => b.zoom - a.zoom);
        default:
          return viewsToSort;
      }
    };

    const sortedRootViews = sortViews(rootViews);
    Object.keys(groupedViews).forEach(key => {
      groupedViews[key] = sortViews(groupedViews[key]);
    });

    return { rootViews: sortedRootViews, groupedViews };
  }, [savedViews, sortOption]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleSaveView = () => {
    if (!newViewName.trim()) {
      toast({
        title: "Nome richiesto",
        description: "Inserisci un nome per la vista",
        variant: "destructive",
      });
      return;
    }

    onSaveView(newViewName.trim());
    setNewViewName('');
    
    toast({
      title: "Vista salvata",
      description: `Vista "${newViewName}" salvata con successo`,
    });
  };

  const handleLoadView = (view: SavedView) => {
    onLoadView(view);
    toast({
      title: "Vista caricata",
      description: `Vista "${view.name}" caricata`,
    });
  };

  const formatZoom = (zoom: number) => `${Math.round(zoom * 100)}%`;
  const formatPan = (pan: { x: number; y: number }) => 
    `X: ${Math.round(pan.x)}, Y: ${Math.round(pan.y)}`;

  const truncateText = (text: string, maxLength: number = 20) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const [editingViewId, setEditingViewId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState<string>('');

  const SortableViewRow: React.FC<{ view: SavedView; level?: number }> = ({ view, level = 0 }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: view.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isExpanded = expandedGroups.has(view.id);
    const childViews = organizedViews.groupedViews[view.id] || [];
    const hasChildren = childViews.length > 0;
    const isEditing = editingViewId === view.id;

    const handleStartEdit = () => {
      setEditingViewId(view.id);
      setEditingName(view.name);
    };

    const handleSaveEdit = () => {
      if (editingName.trim()) {
        const updatedViews = savedViews.map(v => 
          v.id === view.id ? { ...v, name: editingName.trim() } : v
        );
        onUpdateViews(updatedViews);
      }
      setEditingViewId(null);
      setEditingName('');
    };

    const handleCancelEdit = () => {
      setEditingViewId(null);
      setEditingName('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    };

    return (
      <div ref={setNodeRef} style={style}>
        <div className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded group">
          <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: `${level * 12}px` }}>
            <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            </div>
            
            {/* Collapse/Expand button - only show if has children */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleGroup(view.id)}
                className="h-5 w-5 p-0"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            ) : (
              <div className="w-5" /> // Spacer to maintain alignment
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLoadView(view)}
              className="h-5 w-5 p-0 hover:bg-primary/10"
              title="Applica vista"
            >
              <Eye className="h-3 w-3 text-primary" />
            </Button>
            
            {isEditing ? (
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveEdit}
                className="h-6 text-xs px-1 flex-1"
                autoFocus
              />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span 
                      className="text-sm truncate flex-1 cursor-pointer hover:text-primary"
                      onClick={handleStartEdit}
                      title="Clicca per modificare"
                    >
                      {truncateText(view.name, 15)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{view.name}</p>
                      <p className="text-xs">Zoom: {formatZoom(view.zoom)}</p>
                      <p className="text-xs">Posizione: {formatPan(view.pan)}</p>
                      <p className="text-xs">
                        {new Date(view.timestamp).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <span className="text-xs text-muted-foreground">
              {formatZoom(view.zoom)}
            </span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLoadView(view)}
                  className="h-5 w-5 p-0"
                  title="Applica vista"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteView(view.id)}
                  className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                  title="Elimina vista"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {childViews.map(childView => (
              <SortableViewRow key={childView.id} view={childView} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="w-full bg-background/50 backdrop-blur-sm border-t border-border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Viste Salvate ({savedViews.length})</h3>
        </div>
        <div className="flex items-center gap-2">
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
          <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
            <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Recenti</SelectItem>
              <SelectItem value="date-asc">Vecchie</SelectItem>
              <SelectItem value="name-asc">A-Z</SelectItem>
              <SelectItem value="name-desc">Z-A</SelectItem>
              <SelectItem value="zoom-desc">Zoom ↑</SelectItem>
              <SelectItem value="zoom-asc">Zoom ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ResizablePanelGroup direction="horizontal" className="col-span-full">
          {/* Current view info */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="space-y-2 p-2">
              <Label className="text-xs font-medium">Vista Corrente</Label>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Zoom: {formatZoom(currentZoom)}</div>
                <div>Pos: {formatPan(currentPan)}</div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onResetView}
                className="w-full h-7 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />

          {/* Save new view */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="space-y-2 p-2">
              <Label className="text-xs font-medium">Salva Vista</Label>
              <div className="flex gap-1">
                <Input
                  placeholder="Nome vista..."
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveView()}
                  className="flex-1 h-7 text-xs"
                />
              <Button 
                onClick={handleSaveView} 
                size="sm" 
                className="h-7 w-7 p-0"
              >
                <Save className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Saved views list */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="space-y-2 p-2">
              <Label className="text-xs font-medium">Elenco Viste</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={organizedViews.rootViews.map(v => v.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {organizedViews.rootViews.length === 0 ? (
                      <div className="text-center text-muted-foreground text-xs py-4">
                        Nessuna vista salvata
                      </div>
                    ) : (
                      organizedViews.rootViews.map((view) => (
                        <SortableViewRow key={view.id} view={view} />
                      ))
                    )}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ViewSidebar;