import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Editor from '@/components/Editor';
import Preview, { PreviewRef } from '@/components/Preview';
import AIPrompt from '@/components/AIPrompt';
import ViewSidebar, { SavedView } from '@/components/ViewSidebar';
import CommentsPanel from '@/components/CommentsPanel';
import { Comment, ProvisionalView } from '@/types/comments';
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { saveAs } from 'file-saver';

const DEFAULT_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[Alternative Action]
    C --> E[Result]
    D --> E`;

const Index = () => {
  const [code, setCode] = useState<string>(DEFAULT_DIAGRAM);
  const [prompt, setPrompt] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [provisionalViews, setProvisionalViews] = useState<ProvisionalView[]>([]);
  const [currentView, setCurrentView] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showFooterPanel, setShowFooterPanel] = useState<boolean>(true);
  const previewRef = useRef<PreviewRef>(null);

  // Initialize theme on component mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Re-render the diagram with the new theme
    // This forces the Mermaid renderer to use the new theme
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
    };
    setComments(prev => [...prev, newComment]);
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
    setCurrentView({ zoom: view.zoom, pan: view.pan });
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 animate-fade-in">
      <Header 
        onExport={handleExport} 
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
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
            <Tabs defaultValue="views" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="views">Viste</TabsTrigger>
                <TabsTrigger value="comments">Commenti</TabsTrigger>
              </TabsList>
              
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
                  onCreateProvisionalView={handleCreateProvisionalView}
                  onLoadView={handleLoadProvisionalView}
                  onUnlinkView={handleUnlinkView}
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