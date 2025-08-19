
import React, { useState, useRef } from 'react';
import Header from '@/components/Header';
import Editor from '@/components/Editor';
import Preview from '@/components/Preview';
import ViewSidebar from '@/components/ViewSidebar';
import CommentsPanel from '@/components/CommentsPanel';
import { useAuth } from '@/hooks/useAuth';
import { useDiagrams } from '@/hooks/useDiagrams';
import DiagramGrid from '@/components/Dashboard/DiagramGrid';
import LoginModal from '@/components/Auth/LoginModal';
import { Diagram } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PreviewRef } from '@/components/Preview';
import { useViews } from '@/hooks/useViews';
import { useComments } from '@/hooks/useComments';

const Index = () => {
  const { user } = useAuth();
  const { currentDiagram, setCurrentDiagram } = useDiagrams();
  const [code, setCode] = useState<string>('graph TD\n    A[Start] --> B[Process]\n    B --> C[End]');
  const [aiPrompt, setAIPrompt] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'views' | 'comments'>('views');
  const { views: savedViews } = useViews(currentDiagram?.id);
  const { comments } = useComments(currentDiagram?.id);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const previewRef = useRef<PreviewRef>(null);

  // Update code when diagram changes
  const handleSelectDiagram = (diagram: Diagram) => {
    setCurrentDiagram(diagram);
    setCode(diagram.mermaid_code);
    localStorage.setItem('current_diagram_id', diagram.id);
  };

  const handleBackToDashboard = () => {
    setCurrentDiagram(null);
    localStorage.removeItem('current_diagram_id');
  };

  const handleDiagramGenerated = (diagram: string) => {
    setCode(diagram);
    if (currentDiagram) {
      // Update existing diagram
      // updateDiagram(currentDiagram.id, { mermaid_code: diagram });
    }
  };

  const handleViewChange = (zoom: number, pan: { x: number; y: number }) => {
    setZoom(zoom);
    setPan(pan);
  };

  if (!user) {
    return (
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="text-center space-y-6 max-w-md">
            <FileText className="h-20 w-20 text-primary mx-auto" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Welcome to AI Diagram Creator</h1>
              <p className="text-lg text-muted-foreground">
                Create beautiful diagrams with the power of AI
              </p>
            </div>
            <div className="space-y-4">
              <LoginModal>
                <Button size="lg" className="w-full">
                  Get Started - Sign In
                </Button>
              </LoginModal>
              <p className="text-sm text-muted-foreground">
                Sign in to save your diagrams, create views, and collaborate with others
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentDiagram) {
    return (
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 overflow-hidden">
          <DiagramGrid onSelectDiagram={handleSelectDiagram} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-2">
        <div className="flex items-center space-x-2 text-sm">
          <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            Dashboard
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{currentDiagram.title}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          
          {/* Left Sidebar - Views & Comments */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'views' | 'comments')} className="h-full flex flex-col">
              <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="views" className="text-xs">
                    Views
                    {savedViews.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {savedViews.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs">
                    Comments
                    {comments.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {comments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="views" className="h-full mt-0">
                  <ViewSidebar
                    diagramId={currentDiagram.id}
                    zoom={zoom}
                    pan={pan}
                    onViewChange={handleViewChange}
                    previewRef={previewRef}
                  />
                </TabsContent>
                
                <TabsContent value="comments" className="h-full mt-0">
                  <CommentsPanel
                    diagramId={currentDiagram.id}
                    previewRef={previewRef}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Content Area */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <ResizablePanelGroup direction="vertical">
              
              {/* Editor */}
              <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
                <Editor 
                  code={code} 
                  onCodeChange={setCode}
                  aiPrompt={aiPrompt}
                  onAIPromptChange={setAIPrompt}
                  onDiagramGenerated={handleDiagramGenerated}
                />
              </ResizablePanel>

              <ResizableHandle />

              {/* Preview */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <Preview 
                  ref={previewRef}
                  code={code} 
                  onViewChange={handleViewChange}
                />
              </ResizablePanel>

            </ResizablePanelGroup>
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
