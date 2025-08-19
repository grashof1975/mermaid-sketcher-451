import React from 'react';
import { Save, Eye, Trash2, RotateCcw, ArrowUpDown, ChevronRight, ChevronDown, FolderOpen, Folder, GripVertical, ChevronUp, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
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
  const [dragOverParent, setDragOverParent] = React.useState<string | null>(null);
  const [selectedViewId, setSelectedViewId] = React.useState<string | null>(null);
  
  // History per undo/redo
  const [history, setHistory] = React.useState<SavedView[][]>([savedViews]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = React.useState(0);

  // Funzioni per la gestione della history
  const pushToHistory = React.useCallback((newViews: SavedView[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentHistoryIndex + 1);
      newHistory.push([...newViews]);
      return newHistory.slice(-50); // Mantieni solo le ultime 50 operazioni
    });
    setCurrentHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [currentHistoryIndex]);

  const undo = React.useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const previousState = history[newIndex];
      setCurrentHistoryIndex(newIndex);
      onUpdateViews([...previousState]);
      toast({
        title: "Annullato",
        description: "Operazione annullata",
      });
    }
  }, [currentHistoryIndex, history, onUpdateViews]);

  const redo = React.useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      const nextState = history[newIndex];
      setCurrentHistoryIndex(newIndex);
      onUpdateViews([...nextState]);
      toast({
        title: "Ripristinato",
        description: "Operazione ripristinata",
      });
    }
  }, [currentHistoryIndex, history, onUpdateViews]);

  // Listener per scorciatoie da tastiera
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          undo();
        } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Aggiorna la history quando savedViews cambia dall'esterno
  React.useEffect(() => {
    if (history.length === 1 || JSON.stringify(history[currentHistoryIndex]) !== JSON.stringify(savedViews)) {
      setHistory([savedViews]);
      setCurrentHistoryIndex(0);
    }
  }, [savedViews]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    
    if (!over || !active) {
      setDragOverParent(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId !== overId) {
      const delta = event.delta;
      const isRightwardMovement = delta.x > 20;
      
      if (isRightwardMovement) {
        setDragOverParent(overId);
      } else {
        setDragOverParent(null);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragOverParent(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      const activeView = savedViews.find(v => v.id === activeId);
      const overView = savedViews.find(v => v.id === overId);

      if (!activeView || !overView) return;

      const updatedViews = [...savedViews];
      
      // Get the drag position data
      const delta = event.delta;
      const isRightwardMovement = delta.x > 20; // Movimento verso destra
      
      if (isRightwardMovement) {
        // Movimento verso destra = nidificazione (rendere child)
        const activeIndex = updatedViews.findIndex(v => v.id === activeId);
        updatedViews[activeIndex] = { ...activeView, parentId: overId };
        
        // Expand the parent view to show the new child
        setExpandedGroups(prev => new Set([...prev, overId]));
        
        toast({
          title: "Vista nidificata",
          description: `"${activeView.name}" è stata spostata sotto "${overView.name}"`,
        });
      } else {
        // Movimento normale = riordinamento
        const oldIndex = savedViews.findIndex(v => v.id === activeId);
        const newIndex = savedViews.findIndex(v => v.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedViews = arrayMove(savedViews, oldIndex, newIndex);
          pushToHistory(reorderedViews);
          onUpdateViews(reorderedViews);
          return;
        }
      }
      
      pushToHistory(updatedViews);
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

  // Handler per le frecce direzionali - ora usa la vista selezionata
  const handleMoveView = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (!selectedViewId) {
      toast({
        title: "Nessuna vista selezionata",
        description: "Seleziona una vista prima di usare le frecce",
        variant: "destructive",
      });
      return;
    }
    
    console.log('handleMoveView called:', { viewId: selectedViewId, direction, savedViews: savedViews.length });
    
    const updatedViews = [...savedViews];
    const viewIndex = updatedViews.findIndex(v => v.id === selectedViewId);
    const view = updatedViews[viewIndex];
    
    console.log('Found view:', { view, viewIndex });
    
    if (!view) {
      console.log('No view found, returning');
      return;
    }

    // Funzione per ottenere tutti i figli di una vista (ricorsiva)
    const getAllChildren = (parentId: string): SavedView[] => {
      const children = updatedViews.filter(v => v.parentId === parentId);
      const allDescendants: SavedView[] = [...children];
      children.forEach(child => {
        allDescendants.push(...getAllChildren(child.id));
      });
      return allDescendants;
    };

    switch (direction) {
      case 'right': {
        // Nidifica sotto la vista superiore (trova la vista precedente nello stesso livello)
        const sameLevel = updatedViews.filter(v => v.parentId === view.parentId);
        const currentIndexInLevel = sameLevel.findIndex(v => v.id === selectedViewId);
        if (currentIndexInLevel > 0) {
          const parentView = sameLevel[currentIndexInLevel - 1];
          updatedViews[viewIndex] = { ...view, parentId: parentView.id };
          setExpandedGroups(prev => new Set([...prev, parentView.id]));
          toast({
            title: "Vista nidificata",
            description: `"${view.name}" spostata sotto "${parentView.name}"`,
          });
        } else {
          toast({
            title: "Operazione non possibile",
            description: "Non c'è una vista precedente per la nidificazione",
            variant: "destructive",
          });
          return;
        }
        break;
      }
      case 'left': {
        // Sposta al livello superiore (de-nidifica)
        if (view.parentId) {
          const parentView = updatedViews.find(v => v.id === view.parentId);
          updatedViews[viewIndex] = { ...view, parentId: parentView?.parentId };
          toast({
            title: "Vista de-nidificata",
            description: `"${view.name}" spostata al livello superiore`,
          });
        } else {
          toast({
            title: "Operazione non possibile",
            description: "La vista è già al livello radice",
            variant: "destructive",
          });
          return;
        }
        break;
      }
      case 'up': {
        // Sposta verso l'alto nello stesso livello
        const sameLevel = updatedViews.filter(v => v.parentId === view.parentId);
        const currentIndexInLevel = sameLevel.findIndex(v => v.id === selectedViewId);
        
        if (currentIndexInLevel > 0) {
          const targetView = sameLevel[currentIndexInLevel - 1];
          
          // Trova tutti gli elementi del gruppo corrente (vista + figli)
          const currentGroup = [view, ...getAllChildren(view.id)];
          const targetGroup = [targetView, ...getAllChildren(targetView.id)];
          
          // Trova le posizioni nell'array originale
          const currentStart = updatedViews.findIndex(v => v.id === view.id);
          const targetStart = updatedViews.findIndex(v => v.id === targetView.id);
          
          // Rimuovi entrambi i gruppi
          const withoutGroups = updatedViews.filter(v => 
            ![...currentGroup, ...targetGroup].some(gv => gv.id === v.id)
          );
          
          // Inserisci nell'ordine corretto
          const insertPos = Math.min(currentStart, targetStart);
           withoutGroups.splice(insertPos, 0, ...currentGroup, ...targetGroup);
           
           pushToHistory(withoutGroups);
           onUpdateViews(withoutGroups);
           toast({
             title: "Vista spostata",
             description: `"${view.name}" spostata verso l'alto`,
           });
           return;
        } else {
          toast({
            title: "Operazione non possibile",
            description: "La vista è già in cima al suo livello",
            variant: "destructive",
          });
          return;
        }
        break;
      }
      case 'down': {
        // Sposta verso il basso nello stesso livello
        const sameLevel = updatedViews.filter(v => v.parentId === view.parentId);
        const currentIndexInLevel = sameLevel.findIndex(v => v.id === selectedViewId);
        
        if (currentIndexInLevel < sameLevel.length - 1) {
          const targetView = sameLevel[currentIndexInLevel + 1];
          
          // Trova tutti gli elementi del gruppo corrente (vista + figli)
          const currentGroup = [view, ...getAllChildren(view.id)];
          const targetGroup = [targetView, ...getAllChildren(targetView.id)];
          
          // Trova le posizioni nell'array originale
          const currentStart = updatedViews.findIndex(v => v.id === view.id);
          const targetStart = updatedViews.findIndex(v => v.id === targetView.id);
          
          // Rimuovi entrambi i gruppi
          const withoutGroups = updatedViews.filter(v => 
            ![...currentGroup, ...targetGroup].some(gv => gv.id === v.id)
          );
          
          // Inserisci nell'ordine corretto
          const insertPos = Math.min(currentStart, targetStart);
          withoutGroups.splice(insertPos, 0, ...targetGroup, ...currentGroup);
          
          pushToHistory(withoutGroups);
          onUpdateViews(withoutGroups);
          toast({
            title: "Vista spostata",
            description: `"${view.name}" spostata verso il basso`,
          });
          return;
        } else {
          toast({
            title: "Operazione non possibile",
            description: "La vista è già in fondo al suo livello",
            variant: "destructive",
          });
          return;
        }
         break;
       }
     }
     
     pushToHistory(updatedViews);
     onUpdateViews(updatedViews);
   };

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
        <div className={`flex items-center gap-2 p-1 rounded group ${
          selectedViewId === view.id 
            ? 'bg-primary/10 border border-primary/50 shadow-sm' 
            : dragOverParent === view.id 
              ? 'bg-primary/20 border-2 border-primary border-dashed font-bold' 
              : 'hover:bg-muted/50'
        }`}>
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
              onClick={() => {
                setSelectedViewId(view.id);
                handleLoadView(view);
              }}
              className={`h-5 w-5 p-0 hover:bg-primary/10 ${
                selectedViewId === view.id ? 'bg-primary/20 border border-primary' : ''
              }`}
              title="Seleziona e applica vista"
            >
              <Eye className="h-3 w-3 text-primary" />
            </Button>
            
            {/* Frecce direzionali */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveView('left')}
                className="h-4 w-4 p-0 hover:bg-secondary/50"
                title="Sposta a livello superiore"
                disabled={!view.parentId}
              >
                <ArrowLeft className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveView('right')}
                className="h-4 w-4 p-0 hover:bg-secondary/50"
                title="Nidifica sotto vista precedente"
              >
                <ArrowRight className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveView('up')}
                className="h-4 w-4 p-0 hover:bg-secondary/50"
                title="Sposta su"
              >
                <ArrowUp className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveView('down')}
                className="h-4 w-4 p-0 hover:bg-secondary/50"
                title="Sposta giù"
              >
                <ArrowDown className="h-2.5 w-2.5" />
              </Button>
            </div>
            
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
                  onDragOver={handleDragOver}
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