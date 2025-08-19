import React from 'react';
import { Save, Eye, Trash2, RotateCcw, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

export type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'zoom-asc' | 'zoom-desc';

export interface SavedView {
  id: string;
  name: string;
  zoom: number;
  pan: { x: number; y: number };
  timestamp: number;
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

  // Sort views based on selected option
  const sortedViews = React.useMemo(() => {
    const views = [...savedViews];
    
    switch (sortOption) {
      case 'name-asc':
        return views.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return views.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-asc':
        return views.sort((a, b) => a.timestamp - b.timestamp);
      case 'date-desc':
        return views.sort((a, b) => b.timestamp - a.timestamp);
      case 'zoom-asc':
        return views.sort((a, b) => a.zoom - b.zoom);
      case 'zoom-desc':
        return views.sort((a, b) => b.zoom - a.zoom);
      default:
        return views;
    }
  }, [savedViews, sortOption]);

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
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedViews.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Nessuna vista salvata
            </div>
          ) : (
            sortedViews.map((view) => (
              <div 
                key={view.id} 
                className="border border-border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{view.name}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Zoom: {formatZoom(view.zoom)}</div>
                      <div>Pos: {formatPan(view.pan)}</div>
                      <div>
                        {new Date(view.timestamp).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteView(view.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadView(view)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Carica Vista
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSidebar;