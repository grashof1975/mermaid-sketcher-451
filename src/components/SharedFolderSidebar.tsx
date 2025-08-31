import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Folder, 
  FolderOpen, 
  BookOpen, 
  Users, 
  Crown,
  Share,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthProvider';
import { db } from '@/utils/supabase';
import { toast } from '@/hooks/use-toast';

// Types for shared content
interface SharedView {
  view_id: string;
  view_name: string;
  view_zoom: number;
  view_pan_x: number;
  view_pan_y: number;
  view_created_at: string;
  view_tags: string[];
  owner_id: string;
  owner_email: string;
  permission_level: 'viewer' | 'editor';
  shared_at: string;
}

interface SharedDiagram {
  diagram_id: string;
  diagram_title: string;
  diagram_description?: string;
  owner_id: string;
  owner_email: string;
  permission_level: 'viewer' | 'commenter' | 'editor';
  shared_at: string;
  diagram_tags: string[];
  diagram_updated_at: string;
}

interface SharedFolder {
  folder_id: string;
  folder_name: string;
  owner_id: string;
  owner_email: string;
  permission_level: 'viewer' | 'editor' | 'admin';
  shared_at: string;
  views_count: number;
}

interface SharedFolderSidebarProps {
  onLoadView?: (viewId: string, viewName: string) => void;
  onOpenDiagram?: (diagramId: string) => void;
}

const PERMISSION_INFO = {
  viewer: {
    icon: Eye,
    label: 'Visualizzatore',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-600'
  },
  commenter: {
    icon: Users,
    label: 'Commentatore',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-300 dark:border-orange-600'
  },
  editor: {
    icon: UserCheck,
    label: 'Editor',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-600'
  },
  admin: {
    icon: Crown,
    label: 'Amministratore',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-300 dark:border-purple-600'
  }
};

export const SharedFolderSidebar: React.FC<SharedFolderSidebarProps> = ({
  onLoadView,
  onOpenDiagram
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sharedViews, setSharedViews] = useState<SharedView[]>([]);
  const [sharedDiagrams, setSharedDiagrams] = useState<SharedDiagram[]>([]);
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['diagrams', 'views']));

  // Load shared content
  useEffect(() => {
    if (user) {
      loadSharedContent();
    }
  }, [user]);

  const loadSharedContent = async () => {
    if (!user) return;
    
    setLoading(true);
    console.log('🚀 Starting shared content loading for user:', user.id);
    
    try {
      // Load shared diagrams using FIXED API (no foreign key issues)
      console.log('🔄 Loading shared diagrams for user:', user.id);
      const sharedDiagramsData = await db.diagrams.getSharedWithUser(user.id);
      console.log('📊 Received shared diagrams:', sharedDiagramsData);
      
      const formattedDiagrams: SharedDiagram[] = sharedDiagramsData.map((diagram: any) => ({
        diagram_id: diagram.id,
        diagram_title: diagram.title,
        diagram_description: diagram.description,
        owner_id: diagram.user_id,
        owner_email: 'Loading...', // Will be loaded separately
        permission_level: diagram.shared_permission,
        shared_at: diagram.shared_at,
        diagram_tags: diagram.tags || [],
        diagram_updated_at: diagram.updated_at
      }));
      setSharedDiagrams(formattedDiagrams);

      // Load owner usernames separately for better UX
      if (formattedDiagrams.length > 0) {
        const ownerIds = [...new Set(formattedDiagrams.map(d => d.owner_id))];
        console.log('👥 Loading owner info for:', ownerIds);
        
        try {
          const { data: owners, error: ownersError } = await db.supabase
            .from('profiles')
            .select('id, username')
            .in('id', ownerIds);

          if (ownersError) {
            console.error('❌ Error loading owners:', ownersError);
          } else if (owners) {
            console.log('✅ Owners loaded:', owners);
            const ownersMap = new Map(owners.map(o => [o.id, o.username || 'Utente Senza Nome']));
            setSharedDiagrams(prev => prev.map(diagram => ({
              ...diagram,
              owner_email: ownersMap.get(diagram.owner_id) || 'Proprietario Sconosciuto'
            })));
          }
        } catch (ownerError) {
          console.error('❌ Owner loading exception:', ownerError);
          // Fallback to user IDs as display names
          setSharedDiagrams(prev => prev.map(diagram => ({
            ...diagram,
            owner_email: `User ${diagram.owner_id.slice(0, 8)}`
          })));
        }
      }

      // Load shared views - TEMPORARILY DISABLE to prevent crash
      console.log('🔄 Loading shared views...');
      
      try {
        // Skip shared views loading for now to prevent crash
        console.log('⚠️ Shared views loading temporarily disabled to prevent crash');
        setSharedViews([]);
        
        /* COMMENTED OUT TO PREVENT CRASH
        // Try RPC function first
        const rpcResult = await db.supabase.rpc(
          'get_shared_views_for_user',
          { p_user_id: user.id }
        );
        
        if (rpcResult.error) {
          console.log('RPC function not available, using fallback query');
          
          // Fallback: Simple query without complex JOINs
          const fallbackResult = await db.supabase
            .from('saved_views_shares')
            .select('*')
            .eq('shared_with_id', user.id)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false });
          
          if (fallbackResult.data) {
            // Load saved_views separately to avoid JOIN issues
            const viewIds = fallbackResult.data.map(share => share.saved_view_id);
            const viewsResult = await db.supabase
              .from('saved_views')
              .select('id, name, zoom_level, pan_x, pan_y, created_at, tags')
              .in('id', viewIds);
            
            if (viewsResult.data) {
              const viewsMap = new Map(viewsResult.data.map(v => [v.id, v]));
              const formattedViews = fallbackResult.data.map(share => {
                const view = viewsMap.get(share.saved_view_id);
                if (!view) return null;
                
                return {
                  view_id: view.id,
                  view_name: view.name,
                  view_zoom: view.zoom_level,
                  view_pan_x: view.pan_x,
                  view_pan_y: view.pan_y,
                  view_created_at: view.created_at,
                  view_tags: view.tags || [],
                  owner_id: share.owner_id,
                  owner_email: 'Loading...',
                  permission_level: share.permission_level,
                  shared_at: share.created_at
                };
              }).filter(Boolean);
              
              setSharedViews(formattedViews);
            }
          }
        } else {
          setSharedViews(rpcResult.data || []);
        }
        */
        
      } catch (viewsError) {
        console.error('❌ Error loading shared views:', viewsError);
        setSharedViews([]); // Set to empty array on error
        // Don't show toast for views error to prevent spam
      }

      // TODO: Load shared folders when folder sharing is implemented
      setSharedFolders([]);
      
    } catch (error) {
      console.error('❌ Critical error loading shared content:', error);
      
      // Reset all states to safe defaults
      setSharedDiagrams([]);
      setSharedViews([]);
      setSharedFolders([]);
      
      // Show user-friendly error message
      toast({
        title: "Errore di Caricamento",
        description: "Impossibile caricare i contenuti condivisi. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('✅ Shared content loading completed');
    }
  };

  const handleViewClick = (view: SharedView) => {
    if (onLoadView) {
      onLoadView(view.view_id, view.view_name);
    }
  };

  const handleDiagramClick = (diagram: SharedDiagram) => {
    if (onOpenDiagram) {
      onOpenDiagram(diagram.diagram_id);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const formatOwnerName = (ownerInfo: string) => {
    if (!ownerInfo || ownerInfo === 'Unknown' || ownerInfo === 'Loading...') {
      return 'Proprietario sconosciuto';
    }
    // If it's an email, extract username part
    if (ownerInfo.includes('@')) {
      return ownerInfo.split('@')[0];
    }
    // If it starts with "User ", it's our fallback format
    if (ownerInfo.startsWith('User ')) {
      return ownerInfo;
    }
    // Otherwise, use as is (it's a username)
    return ownerInfo;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full bg-background/50 backdrop-blur-sm border-t border-border p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Contenuti Condivisi</h3>
          <Badge variant="secondary" className="text-xs">
            {sharedDiagrams.length + sharedViews.length + sharedFolders.length} elementi
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm p-4">
            Caricamento contenuti condivisi...
          </div>
        ) : sharedDiagrams.length === 0 && sharedViews.length === 0 && sharedFolders.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            <Share className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessun contenuto condiviso</p>
            <p className="text-xs opacity-75 mt-1">
              I contenuti condivisi con te appariranno qui
            </p>
          </div>
        ) : (
          <>
            {/* Shared Diagrams Section */}
            {sharedDiagrams.length > 0 && (
              <div className="border border-green-200 dark:border-green-800 rounded-md">
                <div
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  onClick={() => toggleSection('diagrams')}
                >
                  {expandedSections.has('diagrams') ? (
                    <FolderOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Folder className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                  <BookOpen className="h-3 w-3 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Diagrammi Condivisi ({sharedDiagrams.length})
                  </span>
                </div>

                {expandedSections.has('diagrams') && (
                  <div className="px-2 pb-2 space-y-1">
                    {sharedDiagrams.map((diagram) => {
                      // Safe rendering with data validation
                      if (!diagram || !diagram.diagram_id) {
                        console.warn('⚠️ Invalid diagram data:', diagram);
                        return null;
                      }
                      
                      const permissionInfo = PERMISSION_INFO[diagram.permission_level] || PERMISSION_INFO['viewer'];
                      const PermissionIcon = permissionInfo.icon;
                      
                      return (
                        <div
                          key={diagram.diagram_id}
                          className="ml-6 flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-green-100/50 dark:hover:bg-green-800/30 transition-colors"
                          onClick={() => handleDiagramClick(diagram)}
                        >
                          <Users className="h-3 w-3 text-green-500 shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-700 dark:text-green-300 truncate font-medium">
                                {diagram.diagram_title || 'Diagramma Senza Titolo'}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${permissionInfo.bgColor} ${permissionInfo.borderColor} ${permissionInfo.color}`}
                              >
                                <PermissionIcon className="h-2.5 w-2.5 mr-1" />
                                {permissionInfo.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <Crown className="h-2.5 w-2.5 text-amber-500" />
                              <span className="text-xs text-muted-foreground">
                                {formatOwnerName(diagram.owner_email || 'Unknown')}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {diagram.shared_at ? formatDate(diagram.shared_at) : 'Data non disponibile'}
                              </span>
                            </div>
                            
                            {diagram.diagram_tags && Array.isArray(diagram.diagram_tags) && diagram.diagram_tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {diagram.diagram_tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                                    {String(tag)}
                                  </Badge>
                                ))}
                                {diagram.diagram_tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    +{diagram.diagram_tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                )}
              </div>
            )}

            {/* Shared Views Section */}
            {sharedViews.length > 0 && (
              <div className="border border-blue-200 dark:border-blue-800 rounded-md">
                <div
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  onClick={() => toggleSection('views')}
                >
                  {expandedSections.has('views') ? (
                    <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                  <BookOpen className="h-3 w-3 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Viste Condivise ({sharedViews.length})
                  </span>
                </div>

                {expandedSections.has('views') && (
                  <div className="px-2 pb-2 space-y-1">
                    {sharedViews.map((view) => {
                      const permissionInfo = PERMISSION_INFO[view.permission_level];
                      const PermissionIcon = permissionInfo.icon;
                      
                      return (
                        <div
                          key={view.view_id}
                          className="ml-6 flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-colors"
                          onClick={() => handleViewClick(view)}
                        >
                          <Eye className="h-3 w-3 text-blue-500 shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-700 dark:text-blue-300 truncate font-medium">
                                {view.view_name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${permissionInfo.bgColor} ${permissionInfo.borderColor} ${permissionInfo.color}`}
                              >
                                <PermissionIcon className="h-2.5 w-2.5 mr-1" />
                                {permissionInfo.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <Crown className="h-2.5 w-2.5 text-amber-500" />
                              <span className="text-xs text-muted-foreground">
                                {formatOwnerName(view.owner_email)}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(view.shared_at)}
                              </span>
                            </div>
                            
                            {view.view_tags && view.view_tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {view.view_tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                                {view.view_tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    +{view.view_tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Shared Folders Section - Future Implementation */}
            {sharedFolders.length > 0 && (
              <div className="border border-purple-200 dark:border-purple-800 rounded-md">
                <div
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  onClick={() => toggleSection('folders')}
                >
                  {expandedSections.has('folders') ? (
                    <FolderOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Folder className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  )}
                  <Users className="h-3 w-3 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Cartelle Condivise ({sharedFolders.length})
                  </span>
                </div>

                {expandedSections.has('folders') && (
                  <div className="px-2 pb-2 space-y-1">
                    {/* TODO: Implement shared folders rendering */}
                    <div className="ml-6 text-xs text-muted-foreground p-2">
                      Condivisione cartelle in sviluppo...
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};