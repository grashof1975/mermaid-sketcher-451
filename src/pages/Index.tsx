
import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Editor from '@/components/Editor';
import Preview, { PreviewRef } from '@/components/Preview';
import AIPrompt from '@/components/AIPrompt';
import ViewSidebar, { SavedView } from '@/components/ViewSidebar';
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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
  const [currentView, setCurrentView] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
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

  const handleResetView = () => {
    previewRef.current?.resetView();
    setCurrentView({ zoom: 1, pan: { x: 0, y: 0 } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 animate-fade-in">
      <Header 
        onExport={handleExport} 
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
      
      <main className="flex-1 container py-6 flex flex-col gap-6">
        <div className="flex-1 flex gap-6">
          <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <ResizablePanel defaultSize={40} minSize={25}>
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
            
            <ResizablePanel defaultSize={60} minSize={35}>
              <div className="glass-panel p-4 flex flex-col h-full animate-slide-in border-0" style={{ animationDelay: '100ms' }}>
                <Preview 
                  ref={previewRef}
                  code={code} 
                  className="flex-1" 
                  onViewChange={handleViewChange}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
          
          <ViewSidebar
            savedViews={savedViews}
            onSaveView={handleSaveView}
            onLoadView={handleLoadView}
            onDeleteView={handleDeleteView}
            onResetView={handleResetView}
            currentZoom={currentView.zoom}
            currentPan={currentView.pan}
          />
        </div>
        
        <div className="glass-panel p-4 text-center text-sm text-slate-500 dark:text-slate-400 animate-slide-in" style={{ animationDelay: '200ms' }}>
          <p>
            Create beautiful diagrams with Mermaid syntax and AI assistance. 
            Made with precision and care.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
