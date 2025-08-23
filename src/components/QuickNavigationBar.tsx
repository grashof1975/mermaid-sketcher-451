import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, MessageCircle, ChevronRight, ChevronLeft, Clock, GripVertical, Save, Trash2, FileText, FolderOpen, Settings } from 'lucide-react';
import { SavedView } from '@/components/ViewSidebar';
import { Comment } from '@/types/comments';

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

interface QuickNavigationBarProps {
  savedViews: SavedView[];
  comments: Comment[];
  diagrams?: Diagram[];
  currentDiagram?: Diagram;
  onLoadView: (view: SavedView) => void;
  onJumpToComment: (comment: Comment) => void;
  onDeleteView?: (viewId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onQuickSaveComment?: () => void;
  onSetZoomCenter?: () => void;
  onSelectDiagram?: (diagram: Diagram) => void;
  nodeSelectionShortcut?: string;
  onNodeSelectionShortcutChange?: (shortcut: string) => void;
  viewNameTemplate?: string;
  onViewNameTemplateChange?: (template: string) => void;
  activeTab?: string;
  onActiveTabChange?: (tab: string) => void;
  className?: string;
}

export const QuickNavigationBar: React.FC<QuickNavigationBarProps> = ({
  savedViews,
  comments,
  diagrams = [],
  currentDiagram,
  onLoadView,
  onJumpToComment,
  onDeleteView,
  onDeleteComment,
  onQuickSaveComment,
  onSetZoomCenter,
  onSelectDiagram,
  nodeSelectionShortcut = "ctrl+click",
  onNodeSelectionShortcutChange,
  viewNameTemplate = "v.01",
  onViewNameTemplateChange,
  activeTab = "views",
  onActiveTabChange,
  className = ""
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 288, height: 384 }); // w-72 = 288px, max-h-96 = 384px
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'corner' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showAllViews, setShowAllViews] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Load position and size from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('quickNavBar-position');
    const savedSize = localStorage.getItem('quickNavBar-size');
    
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        // Default position if parsing fails
        setPosition({ x: window.innerWidth - 320, y: window.innerHeight / 2 - 200 });
      }
    } else {
      // Default position (center-right)
      const defaultX = Math.max(window.innerWidth - 320, 0);
      const defaultY = Math.max(window.innerHeight / 2 - 200, 0);
      setPosition({ x: defaultX, y: defaultY });
    }

    if (savedSize) {
      try {
        const parsed = JSON.parse(savedSize);
        setSize(parsed);
      } catch (e) {
        // Keep default size if parsing fails
      }
    }
  }, []);

  // Save position and size to localStorage
  useEffect(() => {
    localStorage.setItem('quickNavBar-position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('quickNavBar-size', JSON.stringify(size));
  }, [size]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!barRef.current) return;
    
    setIsDragging(true);
    const rect = barRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within screen bounds
    const maxX = window.innerWidth - 288; // 288px = w-72
    const maxY = window.innerHeight - 400; // max height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeType(null);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, type: 'corner') => {
    e.stopPropagation(); // Prevent drag from starting
    setIsResizing(true);
    setResizeType(type);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeType) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    if (resizeType === 'corner') {
      // Resize from bottom-right corner
      const newWidth = Math.max(200, resizeStart.width + deltaX); // Min width 200px
      const newHeight = Math.max(150, resizeStart.height + deltaY); // Min height 150px
      
      // Keep within screen bounds
      const maxWidth = window.innerWidth - position.x;
      const maxHeight = window.innerHeight - position.y;
      
      setSize({
        width: Math.min(newWidth, maxWidth),
        height: Math.min(newHeight, maxHeight)
      });
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get comments linked to a specific view
  const getViewComments = (viewId: string) => {
    return comments.filter(comment => 
      comment.linkedViewId === viewId || comment.viewId === viewId
    );
  };

  if (isCollapsed) {
    return (
      <div 
        ref={barRef}
        className={`fixed z-20 ${className}`}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div 
          onMouseDown={handleMouseDown}
          className="bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg p-2"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={barRef}
      className={`fixed z-20 ${className}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg">
        {/* Header - Draggable area */}
        <div 
          className="flex items-center justify-between p-3 border-b cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Navigazione Rapida</h3>
          </div>
          <div className="flex items-center gap-1">
            {/* Quick Save & Comment button in header */}
            {currentDiagram && onQuickSaveComment && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickSaveComment();
                    }}
                    className="h-7 px-2 bg-primary/90 hover:bg-primary"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    <Save className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">🎮 Salva Vista</div>
                    <div className="text-xs">
                      Salva rapidamente la vista corrente (commento opzionale)
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Centro Zoom button */}
            {onSetZoomCenter && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetZoomCenter();
                    }}
                    className="h-7 px-2 bg-background/90 hover:bg-accent"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 2L12 22M2 12L22 12"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">🎯 Centro Zoom</div>
                    <div className="text-xs">
                      Clicca per attivare la modalità selezione centro zoom
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <ScrollArea style={{ height: `${size.height - 60}px` }}>
          <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-3 mt-3">
              <TabsTrigger value="views" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Viste
              </TabsTrigger>
              <TabsTrigger value="diagrams" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Diagrammi
              </TabsTrigger>
              <TabsTrigger value="shortcuts" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Shortcuts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="views" className="p-3 space-y-4 mt-2">
            {/* Empty state */}
            {savedViews.length === 0 && comments.length === 0 && (
              <div className="text-center text-muted-foreground py-6">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna vista o commento</p>
                <p className="text-xs mt-1">
                  Salva una vista o aggiungi un commento per iniziare
                </p>
              </div>
            )}
            
            {/* Viste Salvate */}
            {savedViews.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Viste</span>
                  <Badge variant="secondary" className="text-xs">
                    {savedViews.length}
                  </Badge>
                </div>
              
                <div className="space-y-1">
                  {/* Always show first few views */}
                  {savedViews.slice(0, showAllViews ? savedViews.length : 5).map((view) => {
                    const viewComments = getViewComments(view.id);
                    return (
                      <Tooltip key={view.id}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between p-2 text-xs bg-accent/30 hover:bg-accent/50 rounded transition-colors group">
                            <div 
                              className="min-w-0 flex-1 cursor-pointer"
                              onClick={() => onLoadView(view)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="font-medium truncate">{view.name}</div>
                                {viewComments.length > 0 && (
                                  <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-orange-50 text-orange-600 border-orange-200">
                                    {viewComments.length}💬
                                  </Badge>
                                )}
                              </div>
                              <div className="text-muted-foreground">
                                {view.zoom.toFixed(1)}x • {formatTime(view.timestamp)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onDeleteView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteView(view.id);
                                  }}
                                  className="h-5 w-5 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  title="Elimina vista"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                              <ChevronRight className="h-3 w-3" />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-sm">
                          <div className="text-xs space-y-2">
                            <div>
                              <div><strong>{view.name}</strong></div>
                              <div>Zoom: {view.zoom.toFixed(1)}x</div>
                              <div>Pan: ({view.pan.x.toFixed(0)}, {view.pan.y.toFixed(0)})</div>
                              <div className="text-muted-foreground">
                                Salvata: {new Date(view.timestamp).toLocaleString('it-IT')}
                              </div>
                            </div>
                            
                            {/* Show linked comments */}
                            {viewComments.length > 0 && (
                              <div className="border-t pt-2">
                                <div className="font-medium text-orange-600 mb-1">
                                  💬 Commenti ({viewComments.length}):
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {viewComments.slice(0, 3).map((comment, idx) => (
                                    <div key={comment.id} className="text-xs bg-orange-50/80 dark:bg-orange-950/30 p-1.5 rounded border-l-2 border-orange-200">
                                      <div className="line-clamp-2">{comment.text}</div>
                                      <div className="text-muted-foreground text-xs mt-0.5">
                                        {formatTime(comment.timestamp)}
                                      </div>
                                    </div>
                                  ))}
                                  {viewComments.length > 3 && (
                                    <div className="text-muted-foreground text-center">
                                      ...e {viewComments.length - 3} altri
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  
                  {/* Expandable separator for hidden views */}
                  {savedViews.length > 5 && (
                    <div className="border-t border-dashed border-muted-foreground/30 my-2 pt-2">
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowAllViews(!showAllViews)}
                        className="h-6 w-full text-xs text-muted-foreground hover:text-foreground p-1"
                      >
                        {showAllViews ? (
                          <>
                            <ChevronLeft className="h-3 w-3 mr-1" />
                            Nascondi {savedViews.length - 5} viste
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-3 w-3 mr-1" />
                            Mostra {savedViews.length - 5} viste nascoste
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Commenti Recenti */}
            {comments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Commenti</span>
                  <Badge variant="secondary" className="text-xs">
                    {comments.length}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  {comments
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, showAllComments ? comments.length : 4)
                    .map((comment) => (
                      <Tooltip key={comment.id}>
                        <TooltipTrigger asChild>
                          <div className="flex items-start gap-2 p-2 text-xs bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50 rounded transition-colors group">
                            <div 
                              className="min-w-0 flex-1 cursor-pointer"
                              onClick={() => onJumpToComment(comment)}
                            >
                              <div className="line-clamp-2 leading-tight">
                                {comment.text}
                              </div>
                              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatTime(comment.timestamp)}
                                {comment.linkedViewId && (
                                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                    vista
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onDeleteComment && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteComment(comment.id);
                                  }}
                                  className="h-5 w-5 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  title="Elimina commento"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                              <ChevronRight className="h-3 w-3" />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="text-xs">
                            <div className="font-medium mb-1">Commento completo:</div>
                            <div className="mb-2">{comment.text}</div>
                            <div className="text-muted-foreground">
                              {new Date(comment.timestamp).toLocaleString('it-IT')}
                            </div>
                            {comment.linkedViewId && (
                              <div className="text-primary text-xs mt-1">
                                Collegato a una vista salvata
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  
                  {/* Expandable separator for hidden comments */}
                  {comments.length > 4 && (
                    <div className="border-t border-dashed border-orange-200 my-2 pt-2">
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowAllComments(!showAllComments)}
                        className="h-6 w-full text-xs text-muted-foreground hover:text-foreground p-1"
                      >
                        {showAllComments ? (
                          <>
                            <ChevronLeft className="h-3 w-3 mr-1" />
                            Nascondi {comments.length - 4} commenti
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-3 w-3 mr-1" />
                            Mostra {comments.length - 4} commenti nascosti
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            </TabsContent>

            <TabsContent value="diagrams" className="p-3 space-y-4 mt-2">
              {/* Empty state */}
              {(!diagrams || diagrams.length === 0) && (
                <div className="text-center text-muted-foreground py-6">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessun diagramma</p>
                  <p className="text-xs mt-1">
                    Crea un diagramma per iniziare
                  </p>
                </div>
              )}
              
              {/* Diagrammi */}
              {diagrams && diagrams.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Diagrammi</span>
                    <Badge variant="secondary" className="text-xs">
                      {diagrams?.length || 0}
                    </Badge>
                  </div>
                
                  <div className="space-y-1">
                    {(diagrams || []).slice(0, 8).map((diagram) => (
                      <Tooltip key={diagram.id}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`flex items-center justify-between p-2 text-xs rounded transition-colors group cursor-pointer ${
                              currentDiagram?.id === diagram.id 
                                ? 'bg-primary/20 border border-primary/30' 
                                : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50'
                            }`}
                            onClick={() => onSelectDiagram?.(diagram)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium truncate">{diagram.title}</div>
                                {currentDiagram?.id === diagram.id && (
                                  <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                                    attivo
                                  </Badge>
                                )}
                              </div>
                              <div className="text-muted-foreground">
                                Aggiornato: {new Date(diagram.updated_at).toLocaleString('it-IT', { 
                                  day: '2-digit', 
                                  month: '2-digit',
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <ChevronRight className="h-3 w-3" />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-sm">
                          <div className="text-xs space-y-1">
                            <div><strong>{diagram.title}</strong></div>
                            <div className="text-muted-foreground">
                              {(diagram.mermaid_code?.length || 0) > 100 
                                ? `${diagram.mermaid_code?.substring(0, 100) || ''}...`
                                : diagram.mermaid_code || 'Nessun contenuto'
                              }
                            </div>
                            <div className="text-muted-foreground">
                              Ultimo aggiornamento: {new Date(diagram.updated_at).toLocaleString('it-IT')}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    
                    {(diagrams?.length || 0) > 8 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        ...e {(diagrams?.length || 0) - 8} altri diagrammi
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shortcuts" className="p-3 space-y-4 mt-2">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Controlli</span>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Selezione Nodi
                    </label>
                    <Select 
                      value={nodeSelectionShortcut} 
                      onValueChange={onNodeSelectionShortcutChange}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="click" className="text-xs">Left Click</SelectItem>
                        <SelectItem value="ctrl+click" className="text-xs">Ctrl + Left Click</SelectItem>
                        <SelectItem value="alt+click" className="text-xs">Alt + Left Click</SelectItem>
                        <SelectItem value="shift+click" className="text-xs">Shift + Left Click</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Combinazione tasti per selezionare i nodi del diagramma
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Codice Identificativo Viste
                    </label>
                    <Input
                      value={viewNameTemplate}
                      onChange={(e) => onViewNameTemplateChange?.(e.target.value)}
                      className="w-full h-8 text-xs"
                      placeholder="v.01"
                    />
                    <p className="text-xs text-muted-foreground">
                      Template di default per il nome delle viste salvate
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div><strong>Pan:</strong> Left Click + Drag</div>
                      <div><strong>Zoom:</strong> Mouse Wheel</div>
                      <div><strong>Reset:</strong> Double Click</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
        
        {/* Resize handle - bottom right corner */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize bg-muted/50 hover:bg-muted border-l border-t hover:bg-accent/50 transition-colors group"
          onMouseDown={(e) => handleResizeStart(e, 'corner')}
          title="Ridimensiona trascinando"
        >
          <div className="absolute bottom-0.5 right-0.5 w-2 h-2">
            <svg className="w-2 h-2 text-muted-foreground group-hover:text-foreground transition-colors" fill="currentColor" viewBox="0 0 8 8">
              <path d="M8 8H6L8 6V8zM5 8H3L8 3V5L5 8zM2 8H0V6L2 8z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};