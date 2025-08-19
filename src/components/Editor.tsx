
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { generateMermaidDiagram } from '@/utils/api';
import { useToast } from "@/hooks/use-toast";

interface EditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  aiPrompt: string;
  onAIPromptChange: (prompt: string) => void;
  onDiagramGenerated: (diagram: string) => void;
  className?: string;
}

const Editor: React.FC<EditorProps> = ({
  code,
  onCodeChange,
  aiPrompt,
  onAIPromptChange,
  onDiagramGenerated,
  className
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editorRef.current) {
      // Auto-resize textarea
      editorRef.current.style.height = 'auto';
      editorRef.current.style.height = `${editorRef.current.scrollHeight}px`;
    }
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onCodeChange(newValue);
      
      // Set cursor position after tab
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate a diagram",
        variant: "destructive"
      });
      return;
    }

    try {
      const generatedCode = await generateMermaidDiagram(aiPrompt);
      onDiagramGenerated(generatedCode);
      toast({
        title: "Success",
        description: "Diagram generated successfully!"
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate diagram",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <Tabs defaultValue="code" className="h-full flex flex-col">
        <TabsList className="w-full justify-start bg-transparent border-b border-slate-200/80 dark:border-slate-800/80 rounded-none px-0">
          <TabsTrigger 
            value="code" 
            className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Mermaid Code
          </TabsTrigger>
          <TabsTrigger 
            value="prompt" 
            className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            AI Prompt
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="code" className="flex-1 mt-0 h-full">
          <div className="h-full">
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your mermaid code here..."
              className="editor-container h-full resize-none font-mono animate-fade-in"
              spellCheck="false"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="prompt" className="flex-1 mt-0 h-full">
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <textarea
                value={aiPrompt}
                onChange={(e) => onAIPromptChange(e.target.value)}
                placeholder="Describe the diagram you want to create..."
                className="editor-container h-full resize-none animate-fade-in"
                spellCheck="false"
              />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <Button 
                onClick={handleGenerateAI}
                className="w-full"
                disabled={!aiPrompt.trim()}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Diagram
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Editor;
