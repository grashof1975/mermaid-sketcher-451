import React from 'react';
import { Save, Eye, Trash2, RotateCcw, ArrowUpDown, ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/components/ui/use-toast';

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
  currentZoom: number;
  currentPan: { x: number; y: number };
}

const ViewSidebar: React.FC<ViewSidebarProps> = ({
  savedViews,
  onSaveView,
  onLoadView,
  onDeleteView,
  onResetView,
  currentZoom,
  currentPan
}) => {
  const [newViewName, setNewViewName] = React.useState('');
  const [sortOption, setSortOption] = React.useState<SortOption>('date-desc');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

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

  const ViewRow: React.FC<{ view: SavedView; level?: number; hasChildren?: boolean }> = ({ 
    view, 
    level = 0, 
    hasChildren = false 
  }) => {
    const isExpanded = expandedGroups.has(view.id);
    const childViews = organizedViews.groupedViews[view.id] || [];

    if (view.isFolder) {
      return (
        <div>
          <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(view.id)}>
            <CollapsibleTrigger asChild>
              <div 
                className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                style={{ paddingLeft: `${(level + 1) * 12}px` }}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium truncate flex-1">
                        {truncateText(view.name)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{view.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteView(view.id);
                  }}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {childViews.map(childView => (
                <ViewRow key={childView.id} view={childView} level={level + 1} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded group"
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium truncate">
                  {truncateText(view.name)}
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
          <span className="text-xs text-muted-foreground">
            {formatZoom(view.zoom)}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLoadView(view)}
            className="h-6 w-6 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteView(view.id)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-l border-border p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Viste Salvate</h3>
      </div>
      
      <Separator />
      
      {/* Current view info */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Vista Corrente</Label>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Zoom: {formatZoom(currentZoom)}</div>
          <div>Posizione: {formatPan(currentPan)}</div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onResetView}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Vista
        </Button>
      </div>
      
      <Separator />
      
      {/* Save new view */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Salva Vista Corrente</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Nome vista..."
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveView()}
            className="flex-1"
          />
          <Button onClick={handleSaveView} size="sm">
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Saved views list */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Viste Salvate ({savedViews.length})
          </Label>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Più recenti</SelectItem>
                <SelectItem value="date-asc">Più vecchie</SelectItem>
                <SelectItem value="name-asc">Nome A-Z</SelectItem>
                <SelectItem value="name-desc">Nome Z-A</SelectItem>
                <SelectItem value="zoom-desc">Zoom alto</SelectItem>
                <SelectItem value="zoom-asc">Zoom basso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {organizedViews.rootViews.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Nessuna vista salvata
            </div>
          ) : (
            organizedViews.rootViews.map((view) => (
              <ViewRow key={view.id} view={view} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSidebar;