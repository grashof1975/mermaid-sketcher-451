import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Globe, Trash2, Plus, Tag, Save, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { TagsEditor } from './TagsEditor';

interface Diagram {
  id: string;
  title: string;
  mermaid_code: string;
  description?: string;
  is_public: boolean;
  version: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface DiagramsListProps {
  currentDiagram: Diagram | null;
  onLoadDiagram: (diagram: Diagram) => void;
  onCreateNew: () => void;
  onSave: () => void;
  onDiagramsChange: (diagrams: Diagram[]) => void;
  onUpdateDiagram?: (diagram: Diagram) => void;
  hasUnsavedChanges?: boolean;
}

export const DiagramsList: React.FC<DiagramsListProps> = ({ 
  currentDiagram, 
  onLoadDiagram, 
  onCreateNew,
  onSave,
  onDiagramsChange,
  onUpdateDiagram,
  hasUnsavedChanges = false
}) => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDiagrams();
    } else {
      setDiagrams([]);
    }
  }, [user]);

  const loadDiagrams = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diagrams')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);
      
      if (error) {
        toast({
          title: "Errore",
          description: "Impossibile caricare i diagrammi",
          variant: "destructive",
        });
      } else {
        setDiagrams(data || []);
        onDiagramsChange(data || []);
      }
    } catch (error) {
      console.error('Error loading diagrams:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDiagram = async (diagramId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('diagrams')
        .delete()
        .eq('id', diagramId)
        .eq('user_id', user?.id);
      
      if (error) {
        toast({
          title: "Errore",
          description: "Impossibile eliminare il diagramma",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Successo",
          description: "Diagramma eliminato",
        });
        await loadDiagrams();
      }
    } catch (error) {
      console.error('Error deleting diagram:', error);
    }
  };

  const updateDiagramTags = async (diagramId: string, tags: string[]) => {
    try {
      const { data, error } = await supabase
        .from('diagrams')
        .update({ tags })
        .eq('id', diagramId)
        .eq('user_id', user?.id)
        .select()
        .single();
      
      if (error) {
        toast({
          title: "Errore",
          description: "Impossibile aggiornare i tag",
          variant: "destructive",
        });
      } else if (data) {
        setDiagrams(prev => prev.map(d => d.id === diagramId ? data : d));
        onDiagramsChange(diagrams.map(d => d.id === diagramId ? data : d));
        if (onUpdateDiagram) onUpdateDiagram(data);
        toast({
          title: "Successo",
          description: "Tag aggiornati",
        });
      }
    } catch (error) {
      console.error('Error updating tags:', error);
    }
    setEditingTags(null);
  };

  const updateDiagramTitle = async (diagramId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingTitle(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('diagrams')
        .update({ title: newTitle.trim() })
        .eq('id', diagramId)
        .eq('user_id', user?.id)
        .select()
        .single();
      
      if (error) {
        toast({
          title: "Errore",
          description: "Impossibile aggiornare il titolo",
          variant: "destructive",
        });
      } else if (data) {
        setDiagrams(prev => prev.map(d => d.id === diagramId ? data : d));
        onDiagramsChange(diagrams.map(d => d.id === diagramId ? data : d));
        if (onUpdateDiagram) onUpdateDiagram(data);
        toast({
          title: "Successo",
          description: "Titolo aggiornato",
        });
      }
    } catch (error) {
      console.error('Error updating title:', error);
    }
    setEditingTitle(null);
  };

  const handleTitleClick = (e: React.MouseEvent, diagram: Diagram) => {
    e.stopPropagation();
    setEditingTitle(diagram.id);
    setEditingTitleValue(diagram.title);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent, diagramId: string) => {
    if (e.key === 'Enter') {
      updateDiagramTitle(diagramId, editingTitleValue);
    } else if (e.key === 'Escape') {
      setEditingTitle(null);
      setEditingTitleValue('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get all unique tags from diagrams for the filter
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    diagrams.forEach(diagram => {
      diagram.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [diagrams]);

  // Filter diagrams based on selected tag
  const filteredDiagrams = useMemo(() => {
    if (!selectedTagFilter) return diagrams;
    return diagrams.filter(diagram => 
      diagram.tags.includes(selectedTagFilter)
    );
  }, [diagrams, selectedTagFilter]);

  if (!user) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Accedi per vedere i tuoi diagrammi</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">I Miei Diagrammi</h3>
        </div>
        
        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedTagFilter} onValueChange={setSelectedTagFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Filtra per tag..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti i diagrammi</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>
                      <Badge variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTagFilter && (
                <Button
                  onClick={() => setSelectedTagFilter('')}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            onClick={onCreateNew}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Diagramma
          </Button>
          <Button 
            variant={hasUnsavedChanges ? "default" : "outline"} 
            size="sm" 
            onClick={onSave}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {hasUnsavedChanges ? "Salva*" : "Salva"}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <TooltipProvider>
          <div className="p-2">
            {loading ? (
              <div className="text-center text-muted-foreground text-sm p-4">
                Caricamento...
              </div>
            ) : filteredDiagrams.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {selectedTagFilter 
                    ? `Nessun diagramma con il tag "${selectedTagFilter}"`
                    : "Nessun diagramma salvato"
                  }
                </p>
                {!selectedTagFilter && (
                  <Button 
                    onClick={onCreateNew}
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                  >
                    Crea il primo diagramma
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredDiagrams.map(diagram => (
                  <div
                    key={diagram.id}
                    className={`group relative flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-accent/50 ${
                      currentDiagram?.id === diagram.id 
                        ? 'bg-accent border border-primary/20' 
                        : 'hover:bg-accent/30'
                    }`}
                  >
                    {/* Main content */}
                    <div 
                      onClick={() => onLoadDiagram(diagram)}
                      className="flex-1 min-w-0 flex items-center gap-2"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              {editingTitle === diagram.id ? (
                                <Input
                                  value={editingTitleValue}
                                  onChange={(e) => setEditingTitleValue(e.target.value)}
                                  onKeyDown={(e) => handleTitleKeyPress(e, diagram.id)}
                                  onBlur={() => updateDiagramTitle(diagram.id, editingTitleValue)}
                                  className="h-5 text-xs font-medium px-1 py-0 border-none bg-transparent focus:bg-background focus:border-border"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span 
                                  className="text-xs font-medium truncate cursor-pointer hover:text-primary transition-colors"
                                  onClick={(e) => handleTitleClick(e, diagram)}
                                  title="Clicca per modificare il titolo"
                                >
                                  {diagram.title}
                                </span>
                              )}
                              {diagram.is_public && (
                                <Globe className="h-2.5 w-2.5 text-blue-500 flex-shrink-0" />
                              )}
                              {/* Tags sempre visibili */}
                              {diagram.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {diagram.tags.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs px-1 py-0 h-4">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {diagram.tags.length > 2 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                          +{diagram.tags.length - 2}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                          {diagram.tags.slice(2).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <div className="font-medium">{diagram.title}</div>
                              {diagram.description && (
                                <div className="text-xs opacity-80">{diagram.description}</div>
                              )}
                              <div className="text-xs opacity-60">
                                {formatDate(diagram.updated_at)}
                                {diagram.version > 1 && ` • v${diagram.version}`}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {new Date(diagram.updated_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Tags editor section */}
                    <div className="flex items-center gap-1 min-w-0">
                      {editingTags === diagram.id ? (
                        <div onClick={(e) => e.stopPropagation()} className="min-w-32">
                          <TagsEditor
                            tags={diagram.tags}
                            onChange={(tags) => updateDiagramTags(diagram.id, tags)}
                            maxTags={3}
                            availableTags={allTags}
                          />
                        </div>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTags(diagram.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <Tag className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Action buttons */}
                    <Button
                      onClick={(e) => deleteDiagram(diagram.id, e)}
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipProvider>
      </ScrollArea>
    </div>
  );
};