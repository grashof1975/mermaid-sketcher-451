import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Editor from '@/components/Editor';
import Preview, { PreviewRef } from '@/components/Preview';
import AIPrompt from '@/components/AIPrompt';
import ViewSidebar, { SavedView } from '@/components/ViewSidebar';
import { ViewFolderSidebar } from '@/components/ViewFolderSidebar';
import CommentsPanel from '@/components/CommentsPanel';
import { DiagramsList } from '@/components/DiagramsList';
import { QuickCommentModal } from '@/components/QuickCommentModal';
import { QuickNavigationBar } from '@/components/QuickNavigationBar';
import { InviteUserModal } from '@/components/InviteUserModal';
import { CreatePublicLinkModal } from '@/components/CreatePublicLinkModal';
import { Comment, ProvisionalView } from '@/types/comments';
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp, MessageSquare, Save } from 'lucide-react';
import { saveAs } from 'file-saver';
import { debounce } from 'lodash';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/utils/supabase';
import '@/utils/debugUsers'; // Load debug utilities for development

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

interface Collaborator {
  user: {
    username: string;
    email: string;
    avatar_url?: string;
  };
  permission_level: 'viewer' | 'commenter' | 'editor';
  joined_at: string;
  last_activity?: string;
}

interface PublicLink {
  id: string;
  share_token: string;
  is_active: boolean;
  allow_comments: boolean;
  view_count: number;
  created_at: string;
  expires_at?: string;
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
  const [showQuickCommentModal, setShowQuickCommentModal] = useState<boolean>(false);
  const [selectedComponentText, setSelectedComponentText] = useState<string>('');
  const [nodeSelectionShortcut, setNodeSelectionShortcut] = useState<string>(() => {
    return localStorage.getItem('mermaid-sketcher-node-selection-shortcut') || 'ctrl+click';
  });
  const [viewNameTemplate, setViewNameTemplate] = useState<string>(() => {
    return localStorage.getItem('mermaid-sketcher-view-name-template') || 'v.01';
  });
  const [quickNavActiveTab, setQuickNavActiveTab] = useState<string>('views');
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
  
  // Zoom center selection states
  const [isSelectingZoomCenter, setIsSelectingZoomCenter] = useState(false);
  const [mouseCoordinates, setMouseCoordinates] = useState({ x: 0, y: 0 });

  // Sharing system state
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'editor' | 'commenter' | 'viewer'>('owner');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPublicLinkModal, setShowPublicLinkModal] = useState(false);

  // Team system state
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

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
    if (!user) return;
    
    const codeToSave = diagramCode || code;
    if (!codeToSave?.trim()) return;

    try {
      const diagramData = {
        user_id: user.id,
        title: title || currentDiagram?.title || 'Untitled Diagram',
        mermaid_code: codeToSave,
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
          // Update diagrams list with the updated diagram
          setDiagrams(prev => prev.map(d => d.id === data.id ? data : d));
          if (userPreferences.toast_notifications_enabled) {
            toast({
              title: "Diagramma aggiornato",
              description: "Il diagramma è stato salvato con successo",
            });
          }
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
          // Add new diagram to the list at the beginning
          setDiagrams(prev => [data, ...prev]);
          // Load views and comments for the newly created diagram (should be empty)
          await loadViewsForDiagram(data.id);
          await loadCommentsForDiagram(data.id);
          if (userPreferences.toast_notifications_enabled) {
            toast({
              title: "Diagramma salvato",
              description: "Nuovo diagramma creato con successo",
            });
          }
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

  const loadDiagram = async (diagram: Diagram) => {
    setCurrentDiagram(diagram);
    setCode(diagram.mermaid_code);
    setHasUnsavedChanges(false);
    
    // Load views and comments for this diagram
    if (user) {
      await loadViewsForDiagram(diagram.id);
      await loadCommentsForDiagram(diagram.id);
    }
    
    // Note: Auto-switch to views tab moved to QuickNavigationBar debug toggle
    // setQuickNavActiveTab('views');
    
    if (userPreferences.toast_notifications_enabled) {
      toast({
        title: "Diagramma caricato",
        description: `"${diagram.title}" caricato con successo`,
      });
    }
  };

  const loadViewsForDiagram = async (diagramId: string) => {
    if (!user || !diagramId) {
      console.warn('⚠️ Cannot load views: missing user or diagramId', { user: !!user, diagramId });
      return;
    }
    
    try {
      console.log('🔄 Loading views for diagram:', diagramId);
      const views = await db.savedViews.getAll(diagramId, user.id);
      
      // Convert database format to local format
      const localViews: SavedView[] = views.map(view => ({
        id: view.id,
        name: view.name,
        zoom: view.zoom_level,
        pan: { x: view.pan_x, y: view.pan_y },
        timestamp: new Date(view.created_at).getTime()
      }));
      
      setSavedViews(localViews);
    } catch (error) {
      console.error('Error loading views:', error);
      setSavedViews([]);
    }
  };

  const loadCommentsForDiagram = async (diagramId: string) => {
    if (!user || !diagramId) {
      console.warn('⚠️ Cannot load comments: missing user or diagramId', { user: !!user, diagramId });
      return;
    }
    
    try {
      console.log('🔄 Loading comments for diagram:', diagramId);
      const comments = await db.comments.getAll(diagramId);
      
      // Convert database format to local format
      const localComments: Comment[] = comments.map(comment => ({
        id: comment.id,
        text: comment.text,
        timestamp: new Date(comment.created_at).getTime(),
        viewId: comment.linked_view_id,
        linkedViewId: comment.linked_view_id,
        isProvisional: false
      }));
      
      setComments(localComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const setAllDiagrams = (diagrams: Diagram[]) => {
    setDiagrams(diagrams);
  };

  const createNewDiagram = () => {
    setCurrentDiagram(null);
    setCode(DEFAULT_DIAGRAM);
    setHasUnsavedChanges(false);
    setSavedViews([]); // Clear views when creating new diagram
    setComments([]); // Clear comments when creating new diagram
    
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

  // Load user diagrams
  const loadUserDiagrams = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Loading user diagrams for:', user.id);
      const userDiagrams = await db.diagrams.getAll(user.id);
      console.log('📊 Loaded diagrams:', userDiagrams);
      setDiagrams(userDiagrams);

      // If no current diagram but we have diagrams, select the most recent one
      if (!currentDiagram && userDiagrams.length > 0) {
        const mostRecent = userDiagrams[0]; // They're ordered by updated_at desc
        console.log('🎯 Setting current diagram to:', mostRecent.title);
        setCurrentDiagram(mostRecent);
        setCode(mostRecent.mermaid_code);
        setHasUnsavedChanges(false);
      } else if (!currentDiagram && userDiagrams.length === 0) {
        // No diagrams exist, create a default one
        console.log('📝 Creating default diagram for new user');
        await saveDiagram('My First Diagram', DEFAULT_DIAGRAM, 'Welcome to Mermaid Sketcher!');
      }
    } catch (error) {
      console.error('❌ Error loading user diagrams:', error);
      toast({
        title: "Error",
        description: "Could not load your diagrams",
        variant: "destructive",
      });
    }
  };

  // Initialize user data when user changes
  useEffect(() => {
    if (user && !authLoading) {
      loadUserPreferences();
      loadUserDiagrams(); // Load diagrams after user is authenticated
    } else if (!user) {
      // Reset to defaults when logged out
      setCurrentDiagram(null);
      setDiagrams([]);
      setCode(DEFAULT_DIAGRAM);
      setHasUnsavedChanges(false);
      setSavedViews([]);
      setComments([]);
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

  // Zoom center selection functions
  const handleStartZoomCenterSelection = () => {
    setIsSelectingZoomCenter(true);
    document.body.style.cursor = 'crosshair';
  };

  const handleCancelZoomCenterSelection = () => {
    setIsSelectingZoomCenter(false);
    document.body.style.cursor = 'auto';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isSelectingZoomCenter) return;
    setMouseCoordinates({ x: e.clientX, y: e.clientY });
  }, [isSelectingZoomCenter]);

  const handleZoomCenterClick = useCallback((e: MouseEvent) => {
    if (!isSelectingZoomCenter) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Save zoom center to localStorage
    const zoomCenter = { x: e.clientX, y: e.clientY };
    localStorage.setItem('mermaid-sketcher-zoom-center', JSON.stringify(zoomCenter));
    
    // Apply the zoom center
    if (previewRef.current) {
      previewRef.current.setCenterPoint(e.clientX, e.clientY);
    }
    
    // Exit selection mode
    handleCancelZoomCenterSelection();
    
    if (userPreferences.toast_notifications_enabled) {
      toast({
        title: "Centro Zoom Impostato",
        description: `Coordinate: (${e.clientX}, ${e.clientY})`,
      });
    }
  }, [isSelectingZoomCenter, userPreferences.toast_notifications_enabled]);

  const handleSaveView = async (name: string) => {
    if (!user || !currentDiagram?.id) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato e avere un diagramma selezionato per salvare una vista",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if we have a saved zoom center and should use it for coordinates
      let panX = currentView.pan.x;
      let panY = currentView.pan.y;
      
      const savedZoomCenter = localStorage.getItem('mermaid-sketcher-zoom-center');
      if (savedZoomCenter) {
        try {
          const zoomCenter = JSON.parse(savedZoomCenter);
          // Convert zoom center coordinates to pan coordinates
          // The zoom center represents the point that should stay fixed during zoom
          panX = zoomCenter.x;
          panY = zoomCenter.y;
          console.log('Using zoom center coordinates for saved view:', { zoomCenter, convertedPan: { x: panX, y: panY } });
        } catch (e) {
          console.warn('Failed to parse saved zoom center, using current view coordinates');
        }
      }

      const newView = await db.savedViews.create({
        name,
        diagram_id: currentDiagram.id,
        user_id: user.id,
        zoom_level: currentView.zoom,
        pan_x: panX,
        pan_y: panY,
        sort_order: savedViews.length
      });

      // Convert database format to local format
      const localView: SavedView = {
        id: newView.id,
        name: newView.name,
        zoom: newView.zoom_level,
        pan: { x: panX, y: panY }, // Use the same coordinates we saved
        timestamp: new Date(newView.created_at).getTime()
      };

      setSavedViews(prev => [...prev, localView]);
      
      if (userPreferences.toast_notifications_enabled) {
        toast({
          title: "Vista salvata",
          description: savedZoomCenter 
            ? `Vista "${name}" salvata con centro zoom (${panX}, ${panY})`
            : `Vista "${name}" salvata con successo`,
        });
      }
    } catch (error) {
      console.error('Error saving view:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare la vista",
        variant: "destructive",
      });
    }
  };

  const handleCreateMotherView = async () => {
    if (!user || !currentDiagram?.id) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato e avere un diagramma selezionato per creare la vista madre",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save the current view as the mother view (don't change what's on screen)
      // Use the current view zoom and pan settings
      const currentViewSettings = { 
        zoom: currentView.zoom, 
        pan: currentView.pan 
      };

      // Generate mother view name with house emoji
      const motherViewName = `🏠 ${currentDiagram.title} - Vista Madre`;

      const newView = await db.savedViews.create({
        name: motherViewName,
        diagram_id: currentDiagram.id,
        user_id: user.id,
        zoom_level: currentViewSettings.zoom,
        pan_x: currentViewSettings.pan.x,
        pan_y: currentViewSettings.pan.y,
        is_mother_view: true, // Now we can use this field since migration was applied
      });

      // Reload views to show the new mother view
      await loadViewsForDiagram(currentDiagram.id);

      toast({
        title: "Vista Madre creata",
        description: `Vista madre "${motherViewName}" salvata con le impostazioni correnti`,
      });
    } catch (error) {
      console.error('Error creating mother view:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare la vista madre",
        variant: "destructive",
      });
    }
  };

  const handleLoadView = (view: SavedView) => {
    previewRef.current?.setView(view.zoom, view.pan);
    setCurrentView({ zoom: view.zoom, pan: view.pan });
  };

  const handleDeleteView = async (id: string) => {
    if (!user) return;

    try {
      // Prima trova tutti i commenti collegati a questa vista
      const linkedComments = comments.filter(comment => comment.linkedViewId === id || comment.viewId === id);
      
      console.log(`Deleting view ${id} with ${linkedComments.length} linked comments`);
      
      // Elimina prima i commenti collegati
      for (const comment of linkedComments) {
        try {
          await db.comments.delete(comment.id);
          console.log(`Deleted comment ${comment.id}`);
        } catch (commentError) {
          console.error(`Error deleting comment ${comment.id}:`, commentError);
          // Continua anche se un commento fallisce
        }
      }
      
      // Poi elimina la vista
      await db.savedViews.delete(id);
      
      // Aggiorna lo stato locale
      setSavedViews(prev => prev.filter(view => view.id !== id));
      setComments(prev => prev.filter(comment => 
        comment.linkedViewId !== id && comment.viewId !== id
      ));
      
      if (userPreferences.toast_notifications_enabled) {
        const deletedCount = linkedComments.length;
        toast({
          title: "Vista eliminata",
          description: deletedCount > 0 
            ? `Vista e ${deletedCount} commento${deletedCount > 1 ? 'i' : ''} collegat${deletedCount > 1 ? 'i' : 'o'} eliminat${deletedCount > 1 ? 'i' : 'o'}`
            : "Vista eliminata con successo",
        });
      }
    } catch (error) {
      console.error('Error deleting view:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la vista",
        variant: "destructive",
      });
    }
  };

  const handleUpdateView = async (id: string) => {
    console.log('handleUpdateView called with id:', id);
    
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    if (!previewRef.current) {
      console.error('Preview ref not available');
      return;
    }

    try {
      // Ottieni la posizione attuale dal preview (solo pan, non zoom)
      const currentViewState = previewRef.current.getView();
      console.log('Current view state:', currentViewState);
      
      if (!currentViewState) {
        toast({
          title: "Errore",
          description: "Impossibile ottenere la posizione attuale del diagramma",
          variant: "destructive",
        });
        return;
      }

      // Trova la vista da aggiornare per mantenere zoom originale
      const existingView = savedViews.find(view => view.id === id);
      console.log('Existing view:', existingView);
      
      if (!existingView) {
        toast({
          title: "Errore",
          description: "Vista non trovata",
          variant: "destructive",
        });
        return;
      }

      // SALVA ESATTAMENTE QUELLO CHE VEDI A SCHERMO - senza modifiche
      const updatedViewData = {
        zoom_level: currentViewState.zoom, // Usa zoom attuale (quello che vedi)
        pan_x: currentViewState.pan.x,    // Usa posizione attuale (quella che vedi)
        pan_y: currentViewState.pan.y,    // Usa posizione attuale (quella che vedi)
      };

      console.log('Updating view with data:', updatedViewData);
      await db.savedViews.update(id, updatedViewData);
      
      // Aggiorna lo stato locale con formato locale - usa valori attuali
      const updatedViewLocal = {
        zoom: currentViewState.zoom,  // Usa zoom attuale (quello che vedi)
        pan: currentViewState.pan,    // Usa posizione attuale (quella che vedi)
        timestamp: Date.now()
      };
      
      setSavedViews(prev => 
        prev.map(view => 
          view.id === id 
            ? { ...view, ...updatedViewLocal }
            : view
        )
      );
      
      if (userPreferences.toast_notifications_enabled) {
        toast({
          title: "Vista aggiornata",
          description: "Vista aggiornata con la posizione attuale",
        });
      }
    } catch (error) {
      console.error('Error updating view:', error);
      toast({
        title: "Errore",
        description: `Impossibile aggiornare la vista: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateViews = async (views: SavedView[]) => {
    setSavedViews(views);
    
    // If we have a current diagram, sync the order to database
    if (user && currentDiagram?.id) {
      try {
        for (let i = 0; i < views.length; i++) {
          await db.savedViews.update(views[i].id, { sort_order: i });
        }
      } catch (error) {
        console.error('Error updating view order:', error);
      }
    }
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

  // Quick navigation handlers
  const handleJumpToComment = (comment: Comment) => {
    // Se il commento è collegato a una vista, caricala prima
    if (comment.linkedViewId || comment.viewId) {
      const linkedView = savedViews.find(v => v.id === (comment.linkedViewId || comment.viewId));
      if (linkedView) {
        handleLoadView(linkedView);
      }
    }
    
    // Switcha al tab commenti e evidenzia il commento
    setActiveTab("comments");
    
    // Scroll al commento dopo un breve delay
    setTimeout(() => {
      const commentElement = document.querySelector(`[data-comment-id="${comment.id}"]`);
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        commentElement.classList.add('highlight-comment');
        setTimeout(() => {
          commentElement.classList.remove('highlight-comment');
        }, 2000);
      }
    }, 100);
  };

  // Component selection handler
  const handleComponentSelect = useCallback(async (componentId: string, bounds: { x: number; y: number; width: number; height: number }, nodeText: string) => {
    console.log('Component selected:', componentId, bounds, nodeText);
    
    if (!user || !currentDiagram?.id) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato e avere un diagramma selezionato per salvare una vista",
        variant: "destructive",
      });
      return;
    }

    // Set component text and open comment modal (no zoom/focus change)
    setSelectedComponentText(nodeText);
    setShowQuickCommentModal(true);
  }, [user, currentDiagram]);

  // Handle node selection shortcut change
  const handleNodeSelectionShortcutChange = useCallback((shortcut: string) => {
    setNodeSelectionShortcut(shortcut);
    localStorage.setItem('mermaid-sketcher-node-selection-shortcut', shortcut);
  }, []);

  // Handle view name template change
  const handleViewNameTemplateChange = useCallback((template: string) => {
    setViewNameTemplate(template);
    localStorage.setItem('mermaid-sketcher-view-name-template', template);
  }, []);

  // Quick comment handler
  const handleQuickSaveAndComment = async (viewName: string, commentText: string) => {
    if (!user || !currentDiagram?.id) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato e avere un diagramma selezionato",
        variant: "destructive",
      });
      return;
    }

    console.log('Saving view with data:', {
      name: viewName,
      diagram_id: currentDiagram.id,
      user_id: user.id,
      zoom_level: currentView.zoom,
      pan_x: currentView.pan.x,
      pan_y: currentView.pan.y,
      sort_order: savedViews.length
    });

    let newView;
    let viewSaved = false;
    let commentSaved = false;

    try {
      // Use zoom center coordinates if available, otherwise use current view coordinates
      let panX = currentView.pan.x;
      let panY = currentView.pan.y;
      
      const savedZoomCenter = localStorage.getItem('mermaid-sketcher-zoom-center');
      if (savedZoomCenter) {
        try {
          const zoomCenter = JSON.parse(savedZoomCenter);
          panX = zoomCenter.x;
          panY = zoomCenter.y;
        } catch (e) {
          console.warn('Failed to parse saved zoom center:', e);
        }
      }

      // 1. Save the view first (this should always work)
      newView = await db.savedViews.create({
        name: viewName,
        diagram_id: currentDiagram.id,
        user_id: user.id,
        zoom_level: currentView.zoom,
        pan_x: panX,
        pan_y: panY,
        sort_order: savedViews.length
      });

      console.log('View saved successfully:', newView);

      // Convert to local format
      const localView: SavedView = {
        id: newView.id,
        name: newView.name,
        zoom: newView.zoom_level,
        pan: { x: newView.pan_x, y: newView.pan_y },
        timestamp: new Date(newView.created_at).getTime()
      };

      setSavedViews(prev => [...prev, localView]);
      viewSaved = true;

      // Auto-switch to views tab after saving a view
      setQuickNavActiveTab('views');

    } catch (viewError) {
      console.error('Error saving view:', viewError);
      toast({
        title: "Errore salvataggio vista",
        description: viewError instanceof Error ? viewError.message : "Impossibile salvare la vista",
        variant: "destructive",
      });
      return; // Exit if view saving fails
    }

    // 2. Try to save comment separately (don't fail the whole operation if this fails)
    if (commentText.trim() && newView) {
      try {
        const commentData = {
          user_id: user.id,
          diagram_id: currentDiagram.id,
          text: commentText,
          linked_view_id: newView.id,
          is_resolved: false
        };
        
        console.log('Saving comment with data:');
        console.log('- user_id:', user.id);
        console.log('- diagram_id:', currentDiagram.id);
        console.log('- text:', commentText);
        console.log('- linked_view_id:', newView.id);
        console.log('- is_resolved:', false);
        console.log('Full object:', JSON.stringify(commentData, null, 2));

        // Save comment to database
        const newDbComment = await db.comments.create(commentData);

        console.log('Comment saved successfully:', newDbComment);

        // Convert to local format
        const newComment: Comment = {
          id: newDbComment.id,
          text: newDbComment.text,
          timestamp: new Date(newDbComment.created_at).getTime(),
          viewId: newView.id,
          linkedViewId: newView.id,
          isProvisional: false
        };

        setComments(prev => [...prev, newComment]);
        commentSaved = true;

      } catch (commentError) {
        console.error('Error saving comment (but view was saved):', commentError);
        console.error('Comment error details:');
        
        if (commentError instanceof Error) {
          console.error('- Message:', commentError.message);
          console.error('- Stack:', commentError.stack);
        }
        
        // Log additional error details if available
        if (commentError && typeof commentError === 'object') {
          console.error('- Full error object:', JSON.stringify(commentError, null, 2));
        }
        
        // Don't show error toast for comment failure if view succeeded
      }
    }

    // Show success message based on what was saved
    if (userPreferences.toast_notifications_enabled) {
      if (viewSaved && commentSaved) {
        toast({
          title: "Vista e commento salvati",
          description: `Vista "${viewName}" salvata con commento`,
        });
      } else if (viewSaved && commentText.trim()) {
        toast({
          title: "Vista salvata, commento fallito",
          description: `Vista "${viewName}" salvata, ma il commento non è stato salvato`,
          variant: "destructive",
        });
      } else if (viewSaved) {
        toast({
          title: "Vista salvata",
          description: `Vista "${viewName}" salvata con successo`,
        });
      }
    }

  };

  // Sharing system functions
  const loadDiagramSharing = async (diagramId: string) => {
    if (!user || !diagramId) return;

    // Load collaborators (may fail due to foreign key issues)
    try {
      const collaboratorData = await db.diagramShares.getAll(diagramId);
      setCollaborators(collaboratorData.map((share: any) => ({
        user: share.shared_with,
        permission_level: share.permission_level,
        joined_at: share.responded_at || share.created_at,
        last_activity: share.last_activity
      })));
    } catch (error) {
      console.error('Error loading diagram collaborators:', error);
      setCollaborators([]); // Reset to empty array
    }

    // Load public links (independent operation)
    try {
      const linkData = await db.publicShareLinks.getAll(diagramId);
      setPublicLinks(linkData);
    } catch (error) {
      console.error('Error loading public links:', error);
      setPublicLinks([]); // Reset to empty array
    }

    // Determine current user role
    try {
      if (currentDiagram?.user_id === user.id) {
        setCurrentUserRole('owner');
      } else {
        const userPermission = await db.diagramShares.getUserPermission(diagramId, user.id);
        setCurrentUserRole(userPermission || 'viewer');
      }
    } catch (error) {
      console.error('Error determining user role:', error);
      setCurrentUserRole('owner'); // Default fallback
    }
  };

  const handleInviteUser = () => {
    setShowInviteModal(true);
  };

  const handleCreatePublicLink = () => {
    setShowPublicLinkModal(true);
  };

  const handleManageSharing = () => {
    // Open comprehensive sharing management modal
    toast({
      title: "Gestione Completa",
      description: "Funzionalità in sviluppo - usa i pulsanti rapidi per ora",
    });
  };

  const handleInviteSent = async (inviteData: any) => {
    if (!currentDiagram) return;

    try {
      // Here would be the actual API call to send invitation
      // await db.diagramShares.invite({
      //   diagram_id: currentDiagram.id,
      //   shared_with_email: inviteData.email,
      //   permission_level: inviteData.permission,
      //   invitation_message: inviteData.message
      // });

      // Mock success for now
      const newCollaborator: Collaborator = {
        user: {
          username: inviteData.email.split('@')[0],
          email: inviteData.email,
        },
        permission_level: inviteData.permission,
        joined_at: new Date().toISOString(),
      };

      setCollaborators(prev => [...prev, newCollaborator]);

      toast({
        title: "Invito inviato",
        description: `Invito inviato a ${inviteData.email}`,
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Errore",
        description: "Errore nell'invio dell'invito",
        variant: "destructive",
      });
    }
  };

  const handlePublicLinkCreated = async (linkData: any) => {
    if (!currentDiagram) return;

    try {
      // Here would be the actual API call to create public link
      // const newLink = await db.publicShareLinks.create({
      //   diagram_id: currentDiagram.id,
      //   allow_comments: linkData.allow_comments,
      //   password_protected: linkData.password_protected,
      //   access_password: linkData.access_password
      // });

      // Mock success for now
      const newLink: PublicLink = {
        id: 'mock-' + Date.now(),
        share_token: linkData.share_token,
        is_active: true,
        allow_comments: linkData.allow_comments,
        view_count: 0,
        created_at: new Date().toISOString(),
        expires_at: linkData.expires_at
      };

      setPublicLinks(prev => [...prev, newLink]);

      toast({
        title: "Link pubblico creato",
        description: "Il link è stato copiato negli appunti",
      });
    } catch (error) {
      console.error('Error creating public link:', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione del link pubblico",
        variant: "destructive",
      });
    }
  };

  const handleRevokeCollaborator = async (userEmail: string) => {
    try {
      // Here would be the actual API call to revoke collaborator
      setCollaborators(prev => prev.filter(collab => collab.user.email !== userEmail));

      toast({
        title: "Collaboratore rimosso",
        description: `${userEmail} è stato rimosso dalla collaborazione`,
      });
    } catch (error) {
      console.error('Error revoking collaborator:', error);
      toast({
        title: "Errore",
        description: "Errore nella rimozione del collaboratore",
        variant: "destructive",
      });
    }
  };

  const handleRevokePublicLink = async (linkId: string) => {
    try {
      // API call to revoke public link
      await db.publicShareLinks.revoke(linkId);
      
      // Remove from local state
      setPublicLinks(prev => prev.filter(link => link.id !== linkId));

      toast({
        title: "Link pubblico revocato",
        description: "Il link pubblico è stato disattivato",
      });
    } catch (error) {
      console.error('Error revoking public link:', error);
      toast({
        title: "Errore",
        description: "Errore nella revoca del link pubblico",
        variant: "destructive",
      });
    }
  };

  // Load sharing data when current diagram changes
  useEffect(() => {
    if (currentDiagram) {
      loadDiagramSharing(currentDiagram.id);
    } else {
      // Reset sharing state when no diagram selected
      setCollaborators([]);
      setPublicLinks([]);
      setCurrentUserRole('owner');
    }
  }, [currentDiagram, user]);

  // Event listeners for zoom center selection
  useEffect(() => {
    if (isSelectingZoomCenter) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleZoomCenterClick, true);
      
      // ESC key to cancel selection
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCancelZoomCenterSelection();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      
      // Cleanup on component unmount or mode exit
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleZoomCenterClick, true);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isSelectingZoomCenter, handleMouseMove, handleZoomCenterClick]);

  // Load saved zoom center on component mount
  useEffect(() => {
    const savedZoomCenter = localStorage.getItem('mermaid-sketcher-zoom-center');
    if (savedZoomCenter && previewRef.current) {
      const center = JSON.parse(savedZoomCenter);
      previewRef.current.setCenterPoint(center.x, center.y);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 animate-fade-in">
      {/* Modalità selezione centro zoom - overlay e cursore coordinate */}
      {isSelectingZoomCenter && (
        <>
          {/* Overlay trasparente per indicare la modalità attiva */}
          <div className="fixed inset-0 z-40 bg-blue-500/5 backdrop-blur-[0.5px] border-4 border-blue-500/20 border-dashed" />
          
          {/* Istruzioni */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600/90 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="text-sm font-medium">🎯 Modalità Selezione Centro Zoom</div>
            <div className="text-xs opacity-90">Clicca per impostare il centro • ESC per annullare</div>
          </div>
          
          {/* Cursore personalizzato con coordinate */}
          <div
            className="fixed z-50 pointer-events-none bg-black/80 text-white px-2 py-1 rounded text-xs font-mono"
            style={{
              left: `${mouseCoordinates.x + 10}px`,
              top: `${mouseCoordinates.y - 30}px`,
            }}
          >
            🎯 ({mouseCoordinates.x}, {mouseCoordinates.y})
          </div>
        </>
      )}
      <Header 
        onExport={handleExport}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        selectedTeam={selectedTeam}
        onTeamChange={setSelectedTeam}
        currentDiagramTitle={currentDiagram?.title}
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
                    title={currentDiagram?.title}
                    onViewChange={handleViewChange}
                    onComponentSelect={handleComponentSelect}
                    nodeSelectionShortcut={nodeSelectionShortcut}
                  />
                  {/* Toggle panel button */}
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
          
          
          <ResizablePanel defaultSize={25} minSize={10}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="diagrams">Diagrammi</TabsTrigger>
                <TabsTrigger value="views">Viste</TabsTrigger>
                <TabsTrigger value="folders">Cartelle</TabsTrigger>
              </TabsList>
              
              <TabsContent value="diagrams" className="h-full mt-0">
                <DiagramsList
                  currentDiagram={currentDiagram}
                  onLoadDiagram={loadDiagram}
                  onCreateNew={createNewDiagram}
                  onSave={() => saveDiagram()}
                  onDiagramsChange={setDiagrams}
                  onUpdateDiagram={(updatedDiagram) => {
                    if (currentDiagram?.id === updatedDiagram.id) {
                      setCurrentDiagram(updatedDiagram);
                    }
                  }}
                  hasUnsavedChanges={hasUnsavedChanges}
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
              
              <TabsContent value="folders" className="h-full mt-0">
                <ViewFolderSidebar
                  isCollapsed={!showFooterPanel}
                  onToggleCollapse={() => setShowFooterPanel(!showFooterPanel)}
                  onOpenDiagram={(diagramId) => {
                    // Find the diagram by ID and load it
                    const diagram = diagrams.find(d => d.id === diagramId);
                    if (diagram) {
                      loadDiagram(diagram);
                    }
                  }}
                  onLoadView={async (viewId) => {
                    // Load view from folders system - this requires fetching the view data from the database
                    if (!user) return;
                    
                    try {
                      const { data: viewData, error } = await supabase
                        .from('saved_views')
                        .select('*, diagram_id, zoom_level, pan_x, pan_y')
                        .eq('id', viewId)
                        .eq('user_id', user.id)
                        .single();
                      
                      if (error) {
                        console.error('Error loading view:', error);
                        toast({
                          title: "Errore",
                          description: "Impossibile caricare la vista",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      if (viewData) {
                        // First, load the diagram if it exists
                        if (viewData.diagram_id) {
                          const diagram = diagrams.find(d => d.id === viewData.diagram_id);
                          if (diagram) {
                            // Load the diagram first
                            setCurrentDiagram(diagram);
                            setCode(diagram.mermaid_code);
                            
                            // Load views for this diagram
                            await loadViewsForDiagram(diagram.id);
                            
                            // Then apply the view settings (zoom and pan)
                            if (viewData.zoom_level && viewData.pan_x !== undefined && viewData.pan_y !== undefined) {
                              setTimeout(() => {
                                previewRef.current?.setView(viewData.zoom_level, { x: viewData.pan_x, y: viewData.pan_y });
                                setCurrentView({ zoom: viewData.zoom_level, pan: { x: viewData.pan_x, y: viewData.pan_y } });
                              }, 100); // Small delay to ensure diagram is loaded first
                            }
                            
                            toast({
                              title: "Vista caricata",
                              description: `Vista "${viewData.name}" caricata con successo`,
                            });
                          } else {
                            toast({
                              title: "Errore",
                              description: "Diagramma associato alla vista non trovato",
                              variant: "destructive",
                            });
                          }
                        } else {
                          // This is a legacy view without diagram_id - try to find it in savedViews
                          const legacyView = savedViews.find(v => v.id === viewId);
                          if (legacyView) {
                            handleLoadView(legacyView);
                          } else {
                            toast({
                              title: "Errore",
                              description: "Vista non trovata",
                              variant: "destructive",
                            });
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Error loading view:', error);
                      toast({
                        title: "Errore",
                        description: "Errore nel caricamento della vista",
                        variant: "destructive",
                      });
                    }
                  }}
                  diagrams={diagrams}
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

      {/* Quick Comment Modal */}
      <QuickCommentModal
        isOpen={showQuickCommentModal}
        onClose={() => {
          setShowQuickCommentModal(false);
          setSelectedComponentText('');
        }}
        onSave={handleQuickSaveAndComment}
        currentZoom={currentView.zoom}
        currentPan={currentView.pan}
        selectedComponentText={selectedComponentText}
        viewNameTemplate={viewNameTemplate}
        existingViews={savedViews.map(view => ({ name: view.name, id: view.id }))}
      />

      {/* Quick Navigation Bar - Always visible when logged in */}
      {user && (
        <QuickNavigationBar
          savedViews={savedViews}
          comments={comments}
          diagrams={diagrams}
          currentDiagram={currentDiagram}
          onLoadView={handleLoadView}
          onJumpToComment={handleJumpToComment}
          onDeleteView={handleDeleteView}
          onUpdateView={handleUpdateView}
          onDeleteComment={handleDeleteComment}
          onQuickSaveComment={() => setShowQuickCommentModal(true)}
          onSetZoomCenter={handleStartZoomCenterSelection}
          onCreateMotherView={handleCreateMotherView}
          onSelectDiagram={(diagram) => { loadDiagram(diagram); }}
          onOpenDiagram={(diagramId) => { 
            const diagram = diagrams.find(d => d.id === diagramId);
            if (diagram) loadDiagram(diagram);
          }}
          nodeSelectionShortcut={nodeSelectionShortcut}
          onNodeSelectionShortcutChange={handleNodeSelectionShortcutChange}
          viewNameTemplate={viewNameTemplate}
          onViewNameTemplateChange={handleViewNameTemplateChange}
          activeTab={quickNavActiveTab}
          onActiveTabChange={setQuickNavActiveTab}
          
          // Sharing props
          currentUserRole={currentUserRole}
          collaborators={collaborators}
          publicLinks={publicLinks}
          sharingEnabled={!!currentDiagram}
          onInviteUser={handleInviteUser}
          onManageSharing={handleManageSharing}
          onCreatePublicLink={handleCreatePublicLink}
          onRevokeCollaborator={handleRevokeCollaborator}
          onRevokePublicLink={handleRevokePublicLink}
        />
      )}

      {/* Sharing Modals */}
      {currentDiagram && (
        <>
          <InviteUserModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            diagramId={currentDiagram.id}
            diagramTitle={currentDiagram.title}
            currentUserName={user?.email?.split('@')[0] || 'Utente'}
            onInviteSent={handleInviteSent}
          />
          
          <CreatePublicLinkModal
            isOpen={showPublicLinkModal}
            onClose={() => setShowPublicLinkModal(false)}
            diagramId={currentDiagram.id}
            diagramTitle={currentDiagram.title}
            onLinkCreated={handlePublicLinkCreated}
          />
        </>
      )}
    </div>
  );
};

export default Index;