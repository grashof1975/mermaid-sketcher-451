import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Editor from '@/components/Editor';
import Preview, { PreviewRef } from '@/components/Preview';
import AIPrompt from '@/components/AIPrompt';
import ViewSidebar, { SavedView } from '@/components/ViewSidebar';
import CommentsPanel from '@/components/CommentsPanel';
import { DiagramsList } from '@/components/DiagramsList';
import { Comment, ProvisionalView } from '@/types/comments';
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { saveAs } from 'file-saver';
import { debounce } from 'lodash';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[Alternative Action]
    C --> E[Result]
    D --> E`;

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
  user_id?: string;
}

interface UserPreferences {
  theme_preference: string;
  toast_notifications_enabled: boolean;
  keyboard_shortcuts_enabled: boolean;
  auto_save_interval: number;
  default_zoom_level: number;
  ui_layout_config: any;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  
  // Original state (kept identical)
  const [code, setCode] = useState<string>(DEFAULT_DIAGRAM);
  const [prompt, setPrompt] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [provisionalViews, setProvisionalViews] = useState<ProvisionalView[]>([]);
  const [currentView, setCurrentView] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showFooterPanel, setShowFooterPanel] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("views");
  const [pendingCommentViewId, setPendingCommentViewId] = useState<string | null>(null);
  const previewRef = useRef<PreviewRef>(null);

  // New database state
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme_preference: 'system',
    toast_notifications_enabled: true,
    keyboard_shortcuts_enabled: true,
    auto_save_interval: 30,
    default_zoom_level: 1.00,
    ui_layout_config: {}
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Database functions
  const loadUserPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
      } else if (data) {
        setUserPreferences(data);
        
        // Apply theme preference
        if (data.theme_preference === 'dark') {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
        } else if (data.theme_preference === 'light') {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
        }
      } else {
        // Create default preferences
        await saveUserPreferences(userPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const saveUserPreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) return;
    
    try {
      const updatedPrefs = { ...userPreferences, ...preferences };
      
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updatedPrefs
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving preferences:', error);
      } else if (data) {
        setUserPreferences(data);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const saveDiagram = async (title?: string, diagramCode?: string, description?: string) => {
    if (!user || !diagramCode?.trim()) return;

    try {
      const diagramData = {
        user_id: user.id,
        title: title || currentDiagram?.title || 'Untitled Diagram',
        mermaid_code: diagramCode,
        description: description || currentDiagram?.description,
        tags: currentDiagram?.tags || [],
        version: (currentDiagram?.version || 0) + 1,
        is_public: currentDiagram?.is_public || false
      };

      if (currentDiagram?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('diagrams')
          .update(diagramData)
          .eq('id', currentDiagram.id)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) {
          throw error;
        } else if (data) {
          setCurrentDiagram(data);
          setHasUnsavedChanges(false);
        }
      } else {
        // Create new
        const { data, error } = await supabase
          .from('diagrams')
          .insert(diagramData)
          .select()
          .single();
        
        if (error) {
          throw error;
        } else if (data) {
          setCurrentDiagram(data);
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error('Error saving diagram:', error);
      if (userPreferences.toast_notifications_enabled) {
        toast({
          title: "Errore salvataggio",
          description: "Impossibile salvare il diagramma",
          variant: "destructive",
        });
      }
    }
  };

  const loadDiagram = (diagram: Diagram) => {
    setCurrentDiagram(diagram);
    setCode(diagram.mermaid_code);
    setHasUnsavedChanges(false);
    
    if (userPreferences.toast_notifications_enabled) {
      toast({
        title: "Diagramma caricato",
        description: `"${diagram.title}" caricato con successo`,
      });
    }
  };

  const setAllDiagrams = (diagrams: Diagram[]) => {
    setDiagrams(diagrams);
  };

  const createNewDiagram = () => {
    setCurrentDiagram(null);
    setCode(DEFAULT_DIAGRAM);
    setHasUnsavedChanges(false);
    
    if (userPreferences.toast_notifications_enabled) {
      toast({
        title: "Nuovo diagramma",
        description: "Nuovo diagramma creato",
      });
    }
  };

  // Auto-save debounced function
  const debouncedSave = useCallback(
    debounce(async (title: string, diagramCode: string) => {
      if (user && diagramCode.trim() && diagramCode !== DEFAULT_DIAGRAM) {
        await saveDiagram(title, diagramCode);
      }
    }, userPreferences.auto_save_interval * 1000),
    [user, userPreferences.auto_save_interval, currentDiagram]
  );

  // Initialize user data when user changes
  useEffect(() => {
    if (user && !authLoading) {
      loadUserPreferences();
    } else if (!user) {
      // Reset to defaults when logged out
      setCurrentDiagram(null);
      setDiagrams([]);
      setCode(DEFAULT_DIAGRAM);
      setHasUnsavedChanges(false);
    }
  }, [user, authLoading]);

  // Auto-save when code changes
  useEffect(() => {
    if (code !== currentDiagram?.mermaid_code && code !== DEFAULT_DIAGRAM) {
      setHasUnsavedChanges(true);
      
      if (user) {
        const title = currentDiagram?.title || 'Auto-saved Diagram';
        debouncedSave(title, code);
      }
    }
  }, [code, currentDiagram, debouncedSave, user]);

  // Cleanup debounced function
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Update theme preference when theme changes
  const toggleTheme = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save theme preference
    if (user) {
      await saveUserPreferences({
        theme_preference: newDarkMode ? 'dark' : 'light'
      });
    }
    
    // Re-render the diagram with the new theme
    const currentCode = code;
    setCode('');
    setTimeout(() => setCode(currentCode), 10);
  };

  const handleExport = () => {
    try {
      const svgElement = document.querySelector('.diagram-container svg');
      if (!svgElement) {
        toast({
          title: "Export failed",
          description: "No diagram to export",
          variant: "destructive",
        });
        return;
      }
      
      // Get SVG content
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      
      // Generate filename from first line of diagram or use default
      let filename = 'mermaid-diagram.svg';
      const firstLine = code.split('\n')[0];
      if (firstLine) {
        const cleanName = firstLine
          .replace(/[^\w\s]/gi, '')
          .trim()
          .replace(/\s+/g, '-')
          .toLowerCase();
        if (cleanName) {
          filename = `${cleanName}.svg`;
        }
      }
      
      saveAs(svgBlob, filename);
      
      toast({
        title: "Export successful",
        description: `Saved as ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export diagram",
        variant: "destructive",
      });
    }
  };

  const handleDiagramGenerated = (generatedCode: string) => {
    setCode(generatedCode);
  };

  // View management functions
  const handleViewChange = (zoom: number, pan: { x: number; y: number }) => {
    setCurrentView({ zoom, pan });
  };

  const handleSaveView = (name: string) => {
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name,
      zoom: currentView.zoom,
      pan: currentView.pan,
      timestamp: Date.now()
    };
    setSavedViews(prev => [...prev, newView]);
  };

  const handleLoadView = (view: SavedView) => {
    previewRef.current?.setView(view.zoom, view.pan);
    setCurrentView({ zoom: view.zoom, pan: view.pan });
  };

  const handleDeleteView = (id: string) => {
    setSavedViews(prev => prev.filter(view => view.id !== id));
  };

  const handleUpdateViews = (views: SavedView[]) => {
    setSavedViews(views);
  };

  const handleResetView = () => {
    previewRef.current?.resetView();
    setCurrentView({ zoom: 1, pan: { x: 0, y: 0 } });
  };

  // Comments management functions
  const handleAddComment = (commentData: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment: Comment = {
      ...commentData,
      id: `comment-${Date.now()}`,
      timestamp: Date.now(),
      // Se c'è un viewId in sospeso, collegalo
      viewId: pendingCommentViewId || commentData.viewId,
    };
    setComments(prev => [...prev, newComment]);
    setPendingCommentViewId(null); // Reset pending viewId
  };

  const handleCreateCommentForView = (viewId: string) => {
    // Imposta il viewId in sospeso e cambia alla tab commenti
    setPendingCommentViewId(viewId);
    setActiveTab("comments");
    
    // Se il pannello è collassato, espandilo
    if (!showFooterPanel) {
      setShowFooterPanel(true);
    }
  };

  const handleDeleteComment = (id: string) => {
    const comment = comments.find(c => c.id === id);
    if (comment?.linkedViewId && comment.isProvisional) {
      // Rimuovi anche la vista provvisoria collegata
      setProvisionalViews(prev => prev.filter(v => v.id !== comment.linkedViewId));
    }
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleCreateProvisionalView = (commentId: string, viewName: string) => {
    const newProvisionalView: ProvisionalView = {
      id: `provisional-${Date.now()}`,
      name: viewName,
      zoom: currentView.zoom,
      pan: currentView.pan,
      timestamp: Date.now(),
      commentId,
      isProvisional: true,
    };

    setProvisionalViews(prev => [...prev, newProvisionalView]);
    
    // Aggiorna il commento per collegarlo alla vista provvisoria
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, linkedViewId: newProvisionalView.id, isProvisional: true }
        : comment
    ));
  };

  const handleLoadProvisionalView = (view: SavedView | ProvisionalView) => {
    previewRef.current?.setView(view.zoom, view.pan);
  };

  const handleUpdateViewToCurrentState = (viewId: string) => {
    setSavedViews(prev => prev.map(view => 
      view.id === viewId 
        ? { ...view, zoom: currentView.zoom, pan: currentView.pan, timestamp: Date.now() }
        : view
    ));
  };

  const handleApplyProvisionalViewToSaved = (viewId: string, provisionalViewId: string) => {
    const provisionalView = provisionalViews.find(v => v.id === provisionalViewId);
    
    if (provisionalView) {
      setSavedViews(prev => prev.map(view => 
        view.id === viewId 
          ? { ...view, zoom: provisionalView.zoom, pan: provisionalView.pan, timestamp: Date.now() }
          : view
      ));
      
      toast({
        title: "Vista aggiornata",
        description: `Vista "${savedViews.find(v => v.id === viewId)?.name}" aggiornata con la vista provvisoria`,
      });
    }
  };

  const handleUnlinkView = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment?.linkedViewId && comment.isProvisional) {
      // Rimuovi la vista provvisoria
      setProvisionalViews(prev => prev.filter(v => v.id !== comment.linkedViewId));
    }
    
    // Rimuovi il collegamento dal commento
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, linkedViewId: undefined, isProvisional: undefined }
        : c
    ));
    
    toast({
      title: "Vista scollegata",
      description: "La vista è stata scollegata dal commento",
    });
  };

  const handleEditComment = (commentId: string, newText: string) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, text: newText }
        : comment
    ));
    
    toast({
      title: "Commento aggiornato",
      description: "Il commento è stato modificato",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 animate-fade-in">
      <Header 
        onExport={handleExport}
        onSave={() => saveDiagram()}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
      <div className="flex-1 flex flex-col relative">
        <ResizablePanelGroup direction="vertical" className="flex-1">
          <ResizablePanel defaultSize={75} minSize={50}>
            <ResizablePanelGroup direction="horizontal" className="rounded-lg border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm m-6">
              {showLeftPanel && (
                <>
                  <ResizablePanel defaultSize={35} minSize={25}>
                    <div className="glass-panel p-4 flex flex-col h-full animate-slide-in border-0">
                      <Editor 
                        value={code} 
                        onChange={setCode} 
                        className="flex-1"
                        promptValue={prompt}
                        onPromptChange={setPrompt}
                      />
                      <Separator className="my-4" />
                      <AIPrompt 
                        prompt={prompt} 
                        onDiagramGenerated={handleDiagramGenerated} 
                      />
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                </>
              )}
              
              <ResizablePanel defaultSize={showLeftPanel ? 65 : 100} minSize={30}>
                <div className="glass-panel p-4 flex flex-col h-full animate-slide-in border-0 relative" style={{ animationDelay: '100ms' }}>
                  <Preview 
                    ref={previewRef}
                    code={code} 
                    className="flex-1" 
                    onViewChange={handleViewChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFooterPanel(!showFooterPanel)}
                    className="absolute right-2 bottom-2 z-10 bg-background/80 backdrop-blur-sm"
                  >
                    {showFooterPanel ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="diagrams">Diagrammi</TabsTrigger>
                <TabsTrigger value="views">Viste</TabsTrigger>
                <TabsTrigger value="comments">Commenti</TabsTrigger>
              </TabsList>
              
              <TabsContent value="diagrams" className="h-full mt-0">
                <DiagramsList
                  currentDiagram={currentDiagram}
                  onLoadDiagram={loadDiagram}
                  onCreateNew={createNewDiagram}
                  onDiagramsChange={setDiagrams}
                  onUpdateDiagram={(updatedDiagram) => {
                    if (currentDiagram?.id === updatedDiagram.id) {
                      setCurrentDiagram(updatedDiagram);
                    }
                  }}
                />
              </TabsContent>
              
              <TabsContent value="views" className="h-full mt-0">
                <ViewSidebar
                  savedViews={savedViews}
                  onSaveView={handleSaveView}
                  onLoadView={handleLoadView}
                  onDeleteView={handleDeleteView}
                  onResetView={handleResetView}
                  onUpdateViews={handleUpdateViews}
                  setSavedViews={setSavedViews}
                  currentZoom={previewRef.current?.getView()?.zoom || 1}
                  currentPan={previewRef.current?.getView()?.pan || { x: 0, y: 0 }}
                  isCollapsed={!showFooterPanel}
                  onToggleCollapse={() => setShowFooterPanel(!showFooterPanel)}
                  comments={comments}
                  provisionalViews={provisionalViews}
                  onCreateCommentForView={handleCreateCommentForView}
                  onUpdateViewToCurrentState={handleUpdateViewToCurrentState}
                  onApplyProvisionalViewToSaved={handleApplyProvisionalViewToSaved}
                />
              </TabsContent>
              
              <TabsContent value="comments" className="h-full mt-0">
                <CommentsPanel
                  comments={comments}
                  provisionalViews={provisionalViews}
                  savedViews={savedViews}
                  currentView={currentView}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onEditComment={handleEditComment}
                  onCreateProvisionalView={handleCreateProvisionalView}
                  onLoadView={handleLoadProvisionalView}
                  onUnlinkView={handleUnlinkView}
                  pendingViewId={pendingCommentViewId}
                />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
        
        {/* Toggle buttons */}
        <div className="absolute top-10 left-10 z-20 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50"
          >
            {showLeftPanel ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;