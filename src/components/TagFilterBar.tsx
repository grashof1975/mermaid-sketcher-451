import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { X, Filter } from 'lucide-react';

interface TagFilterBarProps {
  activeTags: string[];
  filterMode: 'AND' | 'OR';
  filteredCount?: number;
  totalCount?: number;
  onToggleTag: (tagName: string) => void;
  onSetFilterMode: (mode: 'AND' | 'OR') => void;
  onClearAll: () => void;
}

export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  activeTags,
  filterMode,
  filteredCount,
  totalCount,
  onToggleTag,
  onSetFilterMode,
  onClearAll
}) => {
  if (activeTags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-md border">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filtri attivi:</span>
      </div>
      
      {/* Active tags */}
      <div className="flex flex-wrap gap-1">
        {activeTags.map((tag) => (
          <Badge 
            key={tag} 
            variant="default"
            className="text-xs px-2 py-1 cursor-pointer hover:bg-primary/80"
            onClick={() => onToggleTag(tag)}
          >
            {tag}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        ))}
      </div>

      {/* Filter mode selector */}
      <ToggleGroup 
        type="single" 
        value={filterMode} 
        onValueChange={(value) => value && onSetFilterMode(value as 'AND' | 'OR')}
        className="h-7"
      >
        <ToggleGroupItem value="AND" className="text-xs px-2 h-7">
          AND
        </ToggleGroupItem>
        <ToggleGroupItem value="OR" className="text-xs px-2 h-7">
          OR
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Results counter */}
      {typeof filteredCount === 'number' && typeof totalCount === 'number' && (
        <span className="text-xs text-muted-foreground">
          {filteredCount} di {totalCount} elementi
        </span>
      )}

      {/* Clear all button */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={onClearAll}
        className="h-7 px-2 text-xs"
      >
        <X className="h-3 w-3 mr-1" />
        Pulisci tutto
      </Button>
    </div>
  );
};