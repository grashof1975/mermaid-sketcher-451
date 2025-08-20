import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Globe, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  onDiagramsChange: (diagrams: Diagram[]) => void;
}

export const DiagramsList: React.FC<DiagramsListProps> = ({ 
  currentDiagram, 
  onLoadDiagram, 
  onCreateNew,
  onDiagramsChange 
}) => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">I Miei Diagrammi</h3>
          <Button
            onClick={onCreateNew}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-center text-muted-foreground text-sm">
              Caricamento...
            </div>
          ) : diagrams.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun diagramma salvato</p>
              <Button 
                onClick={onCreateNew}
                size="sm" 
                variant="outline" 
                className="mt-2"
              >
                Crea il primo diagramma
              </Button>
            </div>
          ) : (
            diagrams.map(diagram => (
              <div
                key={diagram.id}
                onClick={() => onLoadDiagram(diagram)}
                className={`group p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                  currentDiagram?.id === diagram.id 
                    ? 'bg-accent border-primary' 
                    : 'bg-card hover:border-accent-foreground/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="font-medium text-sm truncate">
                        {diagram.title}
                      </h4>
                      {diagram.is_public && (
                        <Globe className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    {diagram.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {diagram.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {diagram.tags.length > 0 && (
                          <div className="flex gap-1">
                            {diagram.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {diagram.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{diagram.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={(e) => deleteDiagram(diagram.id, e)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(diagram.updated_at)}
                      {diagram.version > 1 && ` • v${diagram.version}`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};