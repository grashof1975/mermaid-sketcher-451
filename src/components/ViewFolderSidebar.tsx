import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Trash2, Plus, Folder, FolderOpen, Archive, Briefcase, BookOpen, Settings, Star, Heart, Lightbulb, Target, Edit, X, Move, Copy, CheckSquare, FolderMinus, MoreVertical, Share, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthProvider';
import { db, supabase } from '@/utils/supabase';
import { CreateFolderModal } from './CreateFolderModal';
import { DiagramViewsTooltip } from './DiagramViewsTooltip';
import { TagsEditor } from './TagsEditor';
import { ShareViewModal } from './ShareViewModal';
import { toast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
interface FolderItem {
  id: string;
  name: string;
  is_folder: boolean;
  parent_folder_id?: string;
  folder_icon?: string;
  folder_color?: string;
  folder_sort_order: number;
  tags?: string[];
  tag_application_mode?: 'apply_to_views' | 'folder_only'; // For toggle arrows ↓/↑
  
  // View-specific fields (when is_folder = false)
  diagram_id?: string;
  zoom_level?: number;
  pan_x?: number;
  pan_y?: number;
  created_at: string;
  is_mother_view?: boolean;
  
  // Associated views for diagram items (populated separately)
  associated_views?: Array<{
    id: string;
    name: string;
    zoom_level?: number;
    created_at: string;
  }>;
  
  // Shared users for diagram items (populated separately)
  shared_users?: Array<{
    id: string;
    username: string;
    permission_level: string;
    status: string;
  }>;
}

interface Diagram {
  id: string;
  title: string;
  tags: string[];
}

interface ViewFolderSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenDiagram?: (diagramId: string) => void;
  onLoadView?: (viewId: string) => void;
  diagrams?: Diagram[];
  // Debug toggle for auto-switch behavior
  onActiveTabChange?: (tab: string) => void;
}

// Icon mapping
const ICON_MAP = {
  'folder': Folder,
  'folder-open': FolderOpen,
  'folder-minus': FolderMinus,
  'eye': Eye,
  'archive': Archive,
  'briefcase': Briefcase,
  'book-open': BookOpen,
  'settings': Settings,
  'star': Star,
  'heart': Heart,
  'lightbulb': Lightbulb,
  'target': Target
};

// Draggable folder/view item component
const SortableItem: React.FC<{
  item: FolderItem;
  level: number;
  index: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onSelect: (itemId: string, index: number, event: React.MouseEvent) => void;
  onOpenDiagram?: (diagramId: string) => void;
  onLoadView?: (viewId: string) => void;
  onMoveToFolder?: (itemId: string, targetFolderId: string) => void;
  onTagsChange?: (itemId: string, newTags: string[]) => void;
  onBulkTagOperation?: (folderId: string, tag: string, operation: 'add' | 'remove') => void;
  getAllFolderTags?: () => string[];
  availableFolders?: FolderItem[];
  children?: React.ReactNode;
  handleAutoSwitchToViews?: () => void;
  setShareViewModal?: (state: { isOpen: boolean; viewId: string; viewName: string }) => void;
}> = ({ item, level, index, isExpanded, isSelected, onToggleExpand, onEdit, onDelete, onSelect, onOpenDiagram, onLoadView, onMoveToFolder, onTagsChange, onBulkTagOperation, getAllFolderTags, availableFolders = [], children, handleAutoSwitchToViews, setShareViewModal }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    data: {
      type: item.is_folder ? 'folder' : 'view',
      item: item
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName.trim() !== item.name) {
      onEdit(item.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditName(item.name);
      setIsEditing(false);
    }
  };



  const isVirtualFolder = item.id === '__no_folder_virtual__' || item.id === '__views_virtual__' || item.id === '__mother_views_virtual__';
  const IconComponent = item.is_folder && item.folder_icon 
    ? (ICON_MAP[item.folder_icon as keyof typeof ICON_MAP] || Folder)
    : Eye;

  const itemContent = (
    <div ref={setNodeRef} style={style}>
      <div 
        className={`flex items-center gap-2 p-2 rounded group cursor-pointer ${
          isVirtualFolder 
            ? 'bg-muted/30 border border-dashed hover:bg-muted/50' 
            : 'hover:bg-accent/50'
        } ${
          isDragging ? 'bg-accent border border-primary' : 
          isSelected ? 'bg-primary/20 border border-primary' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Drag handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab hover:cursor-grabbing p-1 -ml-1 hover:bg-accent/50 rounded"
          title="Trascina per riordinare"
        >
          <div className="w-1.5 h-4 bg-muted-foreground/40 rounded"></div>
        </div>

        {/* Expand/collapse button for folders */}
        {item.is_folder && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(item.id);
            }}
            className="h-6 w-6 p-0 hover:bg-accent"
            title={isExpanded ? "Chiudi cartella" : "Apri cartella"}
          >
            {isExpanded ? '▼' : '▶'}
          </Button>
        )}

        {/* Icon */}
        <IconComponent 
          className="h-4 w-4" 
          style={{ color: item.is_folder && item.folder_color ? item.folder_color : undefined }}
        />

        {/* Name - editable zone with visual separator */}
        {isEditing && !isVirtualFolder ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleSaveEdit}
            className="h-6 text-sm"
            style={{ width: '300px' }}
            autoFocus
          />
        ) : (
          <div 
            className={`text-sm cursor-pointer hover:bg-accent/30 px-2 py-1 rounded border-r-2 border-primary/20 ${
              isVirtualFolder 
                ? 'font-medium text-muted-foreground italic cursor-default hover:bg-transparent' 
                : 'hover:border-primary/60'
            }`}
            style={{ width: '300px', minWidth: '300px' }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isVirtualFolder && !isEditing) {
                setIsEditing(true);
              }
            }}
            title={isVirtualFolder ? "Cartella virtuale" : "Clicca per modificare nome"}
          >
            <span className="block truncate">{item.name}</span>
          </div>
        )}

        {/* Tags Editor for folders */}
        {item.is_folder && !isVirtualFolder && onTagsChange && getAllFolderTags && (
          <div className="flex-1 px-2">
            <TagsEditor
              tags={item.tags || []}
              onChange={(newTags) => onTagsChange(item.id, newTags)}
              maxTags={8}
              availableTags={getAllFolderTags()}
              showFilterToggle={false}
            />
            
            {/* Bulk operation buttons for existing tags */}
            {(item.tags || []).length > 0 && onBulkTagOperation && (
              <div className="flex flex-wrap gap-1 mt-1">
                {(item.tags || []).map((tag, index) => (
                  <div key={index} className="flex gap-1 opacity-70 hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => onBulkTagOperation(item.id, tag, 'add')}
                      size="sm"
                      variant="outline"
                      className="h-5 px-2 text-xs"
                      title={`Applica tag "${tag}" a tutte le viste in questa cartella`}
                    >
                      ↓ {tag}
                    </Button>
                    <Button
                      onClick={() => onBulkTagOperation(item.id, tag, 'remove')}
                      size="sm"
                      variant="outline"
                      className="h-5 px-2 text-xs"
                      title={`Rimuovi tag "${tag}" da tutte le viste in questa cartella`}
                    >
                      ↑ {tag}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selectable area for views/diagrams */}
        {!isVirtualFolder && (
          <div 
            className="flex-1 flex items-center justify-between p-1 hover:bg-accent/20 rounded cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (e.ctrlKey || e.metaKey || e.shiftKey) {
                onSelect(item.id, index, e);
              } else {
                // Clear other selections and select this item
                onSelect(item.id, index, { ...e, ctrlKey: false, metaKey: false, shiftKey: false } as React.MouseEvent);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (item.is_folder) {
                onToggleExpand(item.id);
              } else {
                // Double click opens the view/diagram
                if (item.diagram_id && onOpenDiagram) {
                  onOpenDiagram(item.diagram_id);
                  handleAutoSwitchToViews?.();
                } else if (onLoadView) {
                  onLoadView(item.id);
                  handleAutoSwitchToViews?.();
                } else {
                  console.warn('onLoadView not provided for view:', item.id, item.name);
                  toast({
                    title: "Funzione non disponibile",
                    description: "Apertura vista non configurata",
                    variant: "destructive",
                  });
                }
              }
            }}
            title="Click per selezionare, Ctrl+Click per selezione multipla, Doppio click per aprire"
          >
            {/* View info for saved views */}
            {!item.is_folder && item.zoom_level && (
              <span className="text-xs text-muted-foreground">
                {Math.round(item.zoom_level * 100)}%
              </span>
            )}
            
            {/* Tags for views and folders */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1 ml-2">
                {item.tags.map((tag, tagIndex) => (
                  <Badge 
                    key={`${tag}-${tagIndex}`} 
                    variant="secondary" 
                    className="text-xs h-4 px-1.5 py-0 bg-blue-100 text-blue-800 border-blue-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Shared users for diagrams */}
            {!item.is_folder && item.shared_users && item.shared_users.length > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <Users className="h-3 w-3 text-green-600" />
                <div className="flex gap-1">
                  {item.shared_users.slice(0, 3).map((sharedUser, userIndex) => (
                    <Badge 
                      key={`${sharedUser.id}-${userIndex}`} 
                      variant="outline" 
                      className="text-xs h-4 px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                      title={`${sharedUser.username} (${sharedUser.permission_level})`}
                    >
                      {sharedUser.username.slice(0, 8)}
                    </Badge>
                  ))}
                  {item.shared_users.length > 3 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs h-4 px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                      title={`Altri ${item.shared_users.length - 3} utenti`}
                    >
                      +{item.shared_users.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Selection indicator */}
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-primary"></div>
            )}
          </div>
        )}

        {/* Context menu for moving to folders - positioned at left */}
        {!isVirtualFolder && !item.is_folder && availableFolders.length > 0 && onMoveToFolder && (
          <div className="mr-auto opacity-0 group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-accent"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-56">
                  <DropdownMenuLabel>Sposta in cartella</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Move to No Folder */}
                  <DropdownMenuItem
                    onClick={() => onMoveToFolder(item.id, '__no_folder_virtual__')}
                    className="flex items-center gap-2"
                  >
                    <FolderMinus className="h-4 w-4 text-muted-foreground" />
                    Senza Cartella
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Available folders */}
                  {availableFolders
                    .filter(folder => folder.is_folder && !folder.id.includes('virtual'))
                    .map((folder) => {
                      const IconComp = folder.folder_icon && ICON_MAP[folder.folder_icon as keyof typeof ICON_MAP] 
                        ? ICON_MAP[folder.folder_icon as keyof typeof ICON_MAP] 
                        : Folder;
                      
                      return (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={() => onMoveToFolder(item.id, folder.id)}
                          className="flex items-center gap-2"
                        >
                          <IconComp 
                            className="h-4 w-4" 
                            style={{ color: folder.folder_color || undefined }}
                          />
                          {folder.name}
                        </DropdownMenuItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        )}

        {/* Action buttons - positioned at right */}
        {!isVirtualFolder && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 ml-auto">
            {/* Share button for views only */}
            {!item.is_folder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShareViewModal?.({
                    isOpen: true,
                    viewId: item.id,
                    viewName: item.name
                  });
                }}
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                title="Condividi vista"
              >
                <Share className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Children (for folders) */}
      {item.is_folder && isExpanded && children}
    </div>
  );

  // Wrap with tooltip if it's a diagram with associated views
  if (!item.is_folder && item.associated_views && item.associated_views.length > 0) {
    return (
      <DiagramViewsTooltip views={item.associated_views}>
        {itemContent}
      </DiagramViewsTooltip>
    );
  }

  return itemContent;
};

// Condivisi Folder Component - Shows shared diagrams
const CondivisiFolder: React.FC<{
  onOpenDiagram?: (diagramId: string) => void;
  handleAutoSwitchToViews?: () => void;
}> = ({ onOpenDiagram, handleAutoSwitchToViews }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sharedDiagrams, setSharedDiagrams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load shared diagrams when expanded (always reload to get fresh data)
  useEffect(() => {
    if (isExpanded && user) {
      console.log('🔍 DEBUG: Folder expanded, loading shared diagrams...');
      loadSharedDiagrams();
    }
  }, [isExpanded, user]);

  const loadSharedDiagrams = async () => {
    if (!user) {
      console.log('🔍 DEBUG: No user, skipping shared diagrams load');
      return;
    }
    
    console.log('🔍 DEBUG: Loading shared diagrams for user:', user.id);
    setLoading(true);
    try {
      const shared = await db.diagrams.getSharedWithUser(user.id);
      console.log('🔍 DEBUG: Shared diagrams loaded:', shared);
      console.log('🔍 DEBUG: Count:', shared?.length || 0);
      console.log('🔍 DEBUG: First shared diagram structure:', shared?.[0]);
      
      if (shared && shared.length > 0) {
        console.log('✅ SUCCESS: Found shared diagrams, setting state');
      } else {
        console.log('ℹ️  INFO: No shared diagrams found');
      }
      
      setSharedDiagrams(shared || []);
    } catch (error) {
      console.error('❌ Error loading shared diagrams:', error);
      console.error('❌ Error details:', error);
      setSharedDiagrams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDiagramClick = (diagramId: string, title: string) => {
    console.log('🔄 Clicking shared diagram:', { diagramId, title });
    // Use the proper diagram loading mechanism instead of window navigation
    if (onOpenDiagram) {
      onOpenDiagram(diagramId);
      handleAutoSwitchToViews();
    } else {
      console.warn('⚠️ onOpenDiagram not provided, falling back to URL navigation');
      // Fallback to URL navigation if onOpenDiagram is not available
      window.location.href = `/?diagram=${diagramId}`;
    }
  };

  return (
    <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
      {/* Header */}
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-800/30 rounded px-1 py-1 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
        <Users className="h-3 w-3 text-blue-500" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          Condivisi ({sharedDiagrams.length})
        </span>
        <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
          Shared
        </Badge>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="mt-2 ml-6 space-y-1">
          {loading ? (
            <div className="text-xs text-blue-600 dark:text-blue-400 p-1">
              Caricamento...
            </div>
          ) : sharedDiagrams.length === 0 ? (
            <div className="text-xs text-blue-500 dark:text-blue-400 p-1">
              Nessun diagramma condiviso
            </div>
          ) : (
            sharedDiagrams.map((shared: any) => {
              // Defensive check - skip if no diagram data
              if (!shared || !shared.id || !shared.title) {
                console.warn('⚠️ Skipping invalid shared diagram:', shared);
                return null;
              }
              
              return (
                <div
                  key={shared.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-800/30 rounded px-2 py-1 transition-colors"
                  onClick={() => handleDiagramClick(shared.id, shared.title)}
                >
                  <BookOpen className="h-3 w-3 text-blue-500 shrink-0" />
                  <span className="text-xs text-blue-700 dark:text-blue-300 truncate">
                    {shared.title}
                  </span>
                  <Badge variant="outline" className="text-xs bg-transparent border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-400">
                    {shared.shared_permission || shared.permission_level || 'viewer'}
                  </Badge>
                </div>
              );
            }).filter(Boolean)
          )}
        </div>
      )}
    </div>
  );
};

export const ViewFolderSidebar: React.FC<ViewFolderSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  onOpenDiagram,
  onLoadView,
  diagrams = [],
  onActiveTabChange
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['__no_folder_virtual__', '__views_virtual__', '__mother_views_virtual__'])); // Virtual folders expanded by default
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [shareViewModal, setShareViewModal] = useState<{ isOpen: boolean; viewId: string; viewName: string }>({
    isOpen: false,
    viewId: '',
    viewName: ''
  });
  
  // Debug toggles for auto-switch behavior (like in floating bar)
  const [debugAutoSwitchFolders, setDebugAutoSwitchFolders] = useState(() => {
    return localStorage.getItem('cartelle-debugAutoSwitch') === 'true';
  });
  
  // Save debug toggle state to localStorage
  React.useEffect(() => {
    localStorage.setItem('cartelle-debugAutoSwitch', debugAutoSwitchFolders.toString());
  }, [debugAutoSwitchFolders]);
  
  // Helper function to handle auto-switch to views tab
  const handleAutoSwitchToViews = () => {
    if (onActiveTabChange && debugAutoSwitchFolders) {
      console.log('🔧 DEBUG: Auto-switching to views tab from Cartelle');
      onActiveTabChange('views');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load folders and views
  const loadItems = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get all folders and views for the user (include tag_application_mode)
      const { data: allViews, error } = await supabase
        .from('saved_views')
        .select('*, tag_application_mode')
        .eq('user_id', user.id)
        .order('folder_sort_order', { ascending: true });

      if (error) throw error;

      // For each diagram, load associated views
      const itemsWithViews: FolderItem[] = [];
      for (const item of allViews || []) {
        let itemWithViews = { ...item };
        
        // If this is a diagram (not a folder and has diagram_id), load its associated views and shared users
        if (!item.is_folder && item.diagram_id) {
          // Load associated views
          const { data: associatedViews, error: viewsError } = await supabase
            .from('saved_views')
            .select('id, name, zoom_level, created_at')
            .eq('user_id', user.id)
            .eq('diagram_id', item.diagram_id)
            .neq('id', item.id) // Exclude the current item itself
            .order('created_at', { ascending: false });

          if (!viewsError && associatedViews) {
            itemWithViews.associated_views = associatedViews;
          }

          // Load shared users for this diagram
          const { data: sharedUsers, error: sharesError } = await supabase
            .from('diagram_shares')
            .select(`
              id,
              permission_level,
              status,
              profiles!diagram_shares_shared_with_id_fkey (
                id,
                username
              )
            `)
            .eq('diagram_id', item.diagram_id)
            .eq('status', 'accepted'); // Only show accepted shares

          if (!sharesError && sharedUsers) {
            itemWithViews.shared_users = sharedUsers.map(share => ({
              id: share.profiles?.[0]?.id || '',
              username: share.profiles?.[0]?.username || 'Utente sconosciuto',
              permission_level: share.permission_level,
              status: share.status
            }));
          }
        }
        
        itemsWithViews.push(itemWithViews);
      }

      setItems(itemsWithViews);
    } catch (error) {
      console.error('Error loading items:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare cartelle e viste",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Create new folder
  const handleCreateFolder = async (name: string, icon?: string, color?: string) => {
    if (!user) return;

    try {
      await db.savedViews.createFolder(name, user.id, icon, color);
      await loadItems(); // Reload to get the new folder
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error; // Let the modal handle the error
    }
  };

  // Edit item name
  const handleEditItem = async (id: string, newName: string) => {
    try {
      await db.savedViews.update(id, { name: newName });
      await loadItems();
      
      toast({
        title: "Nome aggiornato",
        description: "Nome modificato con successo",
      });
    } catch (error) {
      console.error('Error updating name:', error);
      toast({
        title: "Errore",
        description: "Impossibile modificare il nome",
        variant: "destructive",
      });
    }
  };

  // Handle folder tags change (optimized version)
  const handleFolderTagsChange = async (folderId: string, newTags: string[]) => {
    try {
      // Update database
      await db.savedViews.update(folderId, { tags: newTags });
      
      // Update local state immediately (no full reload)
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === folderId ? { ...item, tags: newTags } : item
        )
      );
      
      toast({
        title: "Tag cartella aggiornati",
        description: "Tag della cartella modificati con successo",
      });
    } catch (error) {
      console.error('Error updating folder tags:', error);
      // On error, reload to ensure consistency
      await loadItems();
      toast({
        title: "Errore",
        description: "Impossibile aggiornare i tag della cartella",
        variant: "destructive",
      });
    }
  };

  // Handle bulk tag operation (apply/remove tag to/from all views in folder)
  const handleBulkTagOperation = async (folderId: string, tag: string, operation: 'add' | 'remove') => {
    try {
      // Get all views in the folder
      const folderViews = items.filter(item => 
        !item.is_folder && item.parent_folder_id === folderId
      );

      if (folderViews.length === 0) {
        toast({
          title: "Nessuna vista",
          description: "Non ci sono viste in questa cartella",
        });
        return;
      }

      // Apply operation to each view
      const updatePromises = folderViews.map(async (view) => {
        const currentTags = view.tags || [];
        let newTags: string[];
        
        if (operation === 'add') {
          // Add tag if not present
          newTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag];
        } else {
          // Remove tag if present
          newTags = currentTags.filter(t => t !== tag);
        }
        
        // Update only if tags actually changed
        if (JSON.stringify(newTags) !== JSON.stringify(currentTags)) {
          return db.savedViews.update(view.id, { tags: newTags });
        }
      });

      // Execute all updates
      await Promise.all(updatePromises.filter(Boolean));
      
      // Update local state immediately (no full reload)
      setItems(prevItems => 
        prevItems.map(item => {
          if (!item.is_folder && item.parent_folder_id === folderId) {
            const currentTags = item.tags || [];
            let newTags: string[];
            
            if (operation === 'add') {
              newTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag];
            } else {
              newTags = currentTags.filter(t => t !== tag);
            }
            
            return { ...item, tags: newTags };
          }
          return item;
        })
      );
      
      const actionText = operation === 'add' ? 'applicato' : 'rimosso';
      toast({
        title: `Tag ${actionText}`,
        description: `Tag "${tag}" ${actionText} a ${folderViews.length} viste`,
      });
      
    } catch (error) {
      console.error('Error in bulk tag operation:', error);
      toast({
        title: "Errore",
        description: "Impossibile applicare l'operazione alle viste",
        variant: "destructive",
      });
    }
  };

  // Get all available tags for suggestions (from folders, views, and diagrams)
  const getAllFolderTags = (): string[] => {
    const tagSet = new Set<string>();
    
    // Add tags from folders and views
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    // Add tags from diagrams
    diagrams.forEach(diagram => {
      if (diagram.tags) {
        diagram.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  };


  // Delete item
  const handleDeleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (item.is_folder) {
      // Check if folder has contents
      const hasContents = items.some(i => i.parent_folder_id === id);
      if (hasContents) {
        if (!confirm('Questa cartella contiene delle viste. Eliminare comunque?')) {
          return;
        }
      }
    }

    try {
      await db.savedViews.delete(id);
      await loadItems();
      
      toast({
        title: item.is_folder ? "Cartella eliminata" : "Vista eliminata",
        description: `"${item.name}" eliminata con successo`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'elemento",
        variant: "destructive",
      });
    }
  };

  // Toggle folder expansion
  const handleToggleExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Handle multiple selection with Ctrl/Shift+Click
  const handleItemSelection = (itemId: string, index: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click: Toggle individual selection
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        return next;
      });
      setLastSelectedIndex(index);
    } else if (event.shiftKey && lastSelectedIndex !== null) {
      // Shift+Click: Select range
      const flatItems = getFlatItemsList();
      const startIndex = Math.min(lastSelectedIndex, index);
      const endIndex = Math.max(lastSelectedIndex, index);
      
      setSelectedItems(prev => {
        const next = new Set(prev);
        for (let i = startIndex; i <= endIndex; i++) {
          if (flatItems[i]) {
            next.add(flatItems[i].id);
          }
        }
        return next;
      });
    } else {
      // Regular click: Select only this item
      setSelectedItems(new Set([itemId]));
      setLastSelectedIndex(index);
    }
  };

  // Get flat list of items for range selection
  const getFlatItemsList = (): FolderItem[] => {
    const { rootItems, itemsByParent } = organizeItems();
    const flatList: FolderItem[] = [];
    
    const addItemsRecursively = (itemList: FolderItem[]) => {
      for (const item of itemList) {
        flatList.push(item);
        if (item.is_folder && expandedFolders.has(item.id)) {
          const children = itemsByParent[item.id] || [];
          addItemsRecursively(children);
        }
      }
    };
    
    addItemsRecursively(rootItems);
    return flatList;
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
    setLastSelectedIndex(null);
  };

  // Batch operations for selected items
  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return;

    const confirmed = confirm(`Eliminare ${selectedItems.size} elementi selezionati?`);
    if (!confirmed) return;

    try {
      for (const itemId of selectedItems) {
        await db.savedViews.delete(itemId);
      }
      
      await loadItems();
      clearSelection();
      
      toast({
        title: "Elementi eliminati",
        description: `${selectedItems.size} elementi eliminati con successo`,
      });
    } catch (error) {
      console.error('Error deleting selected items:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare alcuni elementi",
        variant: "destructive",
      });
    }
  };

  const moveSelectedToFolder = async (targetFolderId: string) => {
    if (selectedItems.size === 0 || !user) return;

    try {
      // Check if trying to move to virtual Views folder
      if (targetFolderId === '__views_virtual__') {
        toast({
          title: "Operazione non consentita",
          description: "La cartella Viste è di sola lettura. Le viste vengono organizzate automaticamente.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if trying to move to virtual Mother Views folder
      if (targetFolderId === '__mother_views_virtual__') {
        toast({
          title: "Operazione non consentita",
          description: "La cartella Viste Madre è di sola lettura. Le viste madre vengono organizzate automaticamente.",
          variant: "destructive",
        });
        return;
      }
      
      for (const itemId of selectedItems) {
        const item = items.find(i => i.id === itemId);
        if (!item) continue;
        
        if (targetFolderId === '__no_folder_virtual__') {
          // Move item out of folder
          await db.savedViews.update(itemId, { parent_folder_id: null });
        } else {
          // Move item into real folder (both diagrams and views allowed)
          await db.savedViews.moveViewToFolder(itemId, targetFolderId, user.id);
        }
      }
      
      await loadItems();
      clearSelection();
      
      // Expand target folder
      setExpandedFolders(prev => new Set([...prev, targetFolderId]));
      
      const targetName = targetFolderId === '__no_folder_virtual__' ? 'Senza Cartella' : 'cartella';
      toast({
        title: "Elementi spostati",
        description: `${selectedItems.size} elementi spostati in ${targetName}`,
      });
    } catch (error) {
      console.error('Error moving selected items:', error);
      toast({
        title: "Errore", 
        description: "Impossibile spostare alcuni elementi",
        variant: "destructive",
      });
    }
  };

  // Handle move to folder via context menu
  const handleMoveToFolder = async (itemId: string, targetFolderId: string) => {
    if (!user) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Allow moving both views and diagrams to folders

    try {
      if (targetFolderId === '__no_folder_virtual__') {
        // Move item out of folder
        await db.savedViews.update(itemId, { parent_folder_id: null });
      } else {
        // Move item into real folder
        await db.savedViews.moveViewToFolder(itemId, targetFolderId, user.id);
      }
      
      await loadItems();
      
      const targetName = targetFolderId === '__no_folder_virtual__' ? 'Senza Cartella' : 'cartella';
      toast({
        title: "Elemento spostato",
        description: `"${item.name}" spostato in ${targetName}`,
      });
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        title: "Errore",
        description: "Impossibile spostare l'elemento",
        variant: "destructive",
      });
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeItem = items.find(i => i.id === active.id);
    const overItem = items.find(i => i.id === over.id);
    
    if (!activeItem || !overItem) return;

    try {
      if (overItem.is_folder) {
        // Handle virtual Views folder
        if (overItem.id === '__views_virtual__') {
          // Only views can be moved to the Views folder - this is a read-only virtual folder
          toast({
            title: "Operazione non consentita",
            description: "La cartella Viste è di sola lettura. Le viste vengono organizzate automaticamente.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle virtual Mother Views folder
        if (overItem.id === '__mother_views_virtual__') {
          // Mother views folder is read-only
          toast({
            title: "Operazione non consentita",
            description: "La cartella Viste Madre è di sola lettura. Le viste madre vengono organizzate automaticamente.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle virtual No Folder section  
        if (overItem.id === '__no_folder_virtual__') {
          // Move item out of folder (set parent_folder_id to null)
          await db.savedViews.update(activeItem.id, { parent_folder_id: null });
        } else {
          // Move item into real folder (both diagrams and views allowed)
          await db.savedViews.moveViewToFolder(activeItem.id, overItem.id, user?.id || '');
        }
        
        await loadItems();
        
        // Expand the target folder
        setExpandedFolders(prev => new Set([...prev, overItem.id]));
        
        const targetName = overItem.id === '__no_folder_virtual__' ? 'Senza Cartella' : overItem.name;
        toast({
          title: "Elemento spostato",
          description: `"${activeItem.name}" spostato in "${targetName}"`,
        });
      }
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        title: "Errore",
        description: "Impossibile spostare l'elemento",
        variant: "destructive",
      });
    }
  };

  // Organize items hierarchically with virtual folders
  const organizeItems = () => {
    const actualFolders = items.filter(item => item.is_folder && !item.parent_folder_id);
    
    // Separate views from diagrams, and further separate mother views from regular views
    const allViews = items.filter(item => !item.is_folder && item.zoom_level != null);
    const motherViews = allViews.filter(item => item.is_mother_view === true || item.name?.includes('🏠'));
    const regularViews = allViews.filter(item => !item.is_mother_view && !item.name?.includes('🏠'));
    const allDiagrams = items.filter(item => !item.is_folder && item.zoom_level == null);
    
    const itemsWithParent = items.filter(item => !item.is_folder && item.parent_folder_id);
    const diagramsWithoutParent = allDiagrams.filter(item => !item.parent_folder_id);
    const motherViewsWithoutParent = motherViews.filter(item => !item.parent_folder_id);
    
    const itemsByParent = items.reduce((acc, item) => {
      if (item.parent_folder_id) {
        if (!acc[item.parent_folder_id]) acc[item.parent_folder_id] = [];
        acc[item.parent_folder_id].push(item);
      }
      return acc;
    }, {} as Record<string, FolderItem[]>);

    // Create virtual "Viste Madre" folder for mother views (always sticky at very top)
    const virtualMotherViewsFolder: FolderItem | null = motherViewsWithoutParent.length > 0 ? {
      id: '__mother_views_virtual__',
      name: `🏠 Viste Madre (${motherViewsWithoutParent.length})`,
      is_folder: true,
      parent_folder_id: undefined,
      folder_icon: 'eye', 
      folder_color: '#F59E0B', // Orange color for mother views
      folder_sort_order: -3, // Always at very top
      created_at: new Date().toISOString(),
    } : null;

    // Create virtual "Viste" folder for regular views (second from top)
    const virtualViewsFolder: FolderItem | null = regularViews.length > 0 ? {
      id: '__views_virtual__',
      name: `Viste (${regularViews.length})`,
      is_folder: true,
      parent_folder_id: undefined,
      folder_icon: 'eye', 
      folder_color: '#3B82F6',
      folder_sort_order: -2, // Second from top
      created_at: new Date().toISOString(),
    } : null;

    // Create virtual "No Folder" folder for unorganized diagrams (not views)
    const virtualNoFolder: FolderItem | null = diagramsWithoutParent.length > 0 ? {
      id: '__no_folder_virtual__',
      name: `Senza Cartella (${diagramsWithoutParent.length})`,
      is_folder: true,
      parent_folder_id: undefined,
      folder_icon: 'folder-minus', 
      folder_color: '#6B7280',
      folder_sort_order: -1, // Second from top
      created_at: new Date().toISOString(),
    } : null;

    // Add virtual folders' children
    if (virtualMotherViewsFolder) {
      itemsByParent[virtualMotherViewsFolder.id] = motherViewsWithoutParent;
    }
    if (virtualViewsFolder) {
      itemsByParent[virtualViewsFolder.id] = regularViews;
    }
    if (virtualNoFolder) {
      itemsByParent[virtualNoFolder.id] = diagramsWithoutParent;
    }


    // Add count to real folders by modifying their names
    const actualFoldersWithCount = actualFolders.map(folder => {
      const itemsInFolder = itemsByParent[folder.id] || [];
      const count = itemsInFolder.length;
      
      return {
        ...folder,
        // Only add count if there are items in the folder
        name: count > 0 ? `${folder.name} (${count})` : folder.name
      };
    });

    // Build root items list with virtual folders first
    const rootItems = [
      ...(virtualMotherViewsFolder ? [virtualMotherViewsFolder] : []),
      ...(virtualViewsFolder ? [virtualViewsFolder] : []),
      ...(virtualNoFolder ? [virtualNoFolder] : []),
      ...actualFoldersWithCount
    ];

    return { 
      rootItems, 
      itemsByParent, 
      virtualNoFolder, 
      virtualViewsFolder,
      virtualMotherViewsFolder,
      itemsWithoutParent: diagramsWithoutParent,
      allViews,
      motherViews,
      regularViews 
    };
  };

  // Render item tree recursively
  const renderItems = (itemList: FolderItem[], level = 0, startIndex = 0, itemsByParent: Record<string, FolderItem[]> = {}, availableFolders: FolderItem[] = [], setShareViewModalProp?: (state: { isOpen: boolean; viewId: string; viewName: string }) => void): React.ReactNode => {
    let currentIndex = startIndex;

    return itemList.map(item => {
      const itemIndex = currentIndex++;
      const isExpanded = expandedFolders.has(item.id);
      const isSelected = selectedItems.has(item.id);
      const children = itemsByParent[item.id] || [];
      
      // Add count to folder name if it's a folder and has children
      const displayItem = item.is_folder && children.length > 0 && !item.name.includes('(')
        ? { ...item, name: `${item.name} (${children.length})` }
        : item;


      return (
        <SortableItem
          key={item.id}
          item={displayItem}
          level={level}
          index={itemIndex}
          isExpanded={isExpanded}
          isSelected={isSelected}
          onToggleExpand={handleToggleExpand}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onSelect={handleItemSelection}
          onOpenDiagram={onOpenDiagram}
          onLoadView={onLoadView}
          onMoveToFolder={handleMoveToFolder}
          onTagsChange={handleFolderTagsChange}
          onBulkTagOperation={handleBulkTagOperation}
          getAllFolderTags={getAllFolderTags}
          availableFolders={availableFolders}
          handleAutoSwitchToViews={handleAutoSwitchToViews}
          setShareViewModal={setShareViewModalProp}
        >
          {children.length > 0 && isExpanded && (
            <div className="ml-4">
              {children.map(child => {
                const childIndex = currentIndex++;
                const childIsExpanded = expandedFolders.has(child.id);
                const childIsSelected = selectedItems.has(child.id);
                const grandChildren = itemsByParent[child.id] || [];

                return (
                  <SortableItem
                    key={child.id}
                    item={child}
                    level={level + 1}
                    index={childIndex}
                    isExpanded={childIsExpanded}
                    isSelected={childIsSelected}
                    onToggleExpand={handleToggleExpand}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    onSelect={handleItemSelection}
                    onOpenDiagram={onOpenDiagram}
                    onLoadView={onLoadView}
                    onMoveToFolder={handleMoveToFolder}
                    onTagsChange={handleFolderTagsChange}
                    onBulkTagOperation={handleBulkTagOperation}
                    getAllFolderTags={getAllFolderTags}
                    availableFolders={availableFolders}
                    handleAutoSwitchToViews={handleAutoSwitchToViews}
                    setShareViewModal={setShareViewModal}
                  >
                    {grandChildren.length > 0 && childIsExpanded && (
                      <div className="ml-4">
                        {renderItems(grandChildren, level + 2, currentIndex, itemsByParent, availableFolders, setShareViewModalProp)}
                      </div>
                    )}
                  </SortableItem>
                );
              })}
            </div>
          )}
        </SortableItem>
      );
    });
  };

  if (isCollapsed) {
    return null;
  }

  const { rootItems, itemsByParent } = organizeItems();

  return (
    <TooltipProvider>
      <div className="w-full bg-background/50 backdrop-blur-sm border-t border-border p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Cartelle & Viste ({items.length})</h3>
          {selectedItems.size === 0 && (
            <span className="text-xs text-muted-foreground">
              Ctrl+Click | Shift+Click per selezione multipla
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Debug toggle for auto-switch behavior */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={debugAutoSwitchFolders ? "default" : "ghost"}
                size="sm"
                onClick={() => setDebugAutoSwitchFolders(!debugAutoSwitchFolders)}
                className="h-6 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {debugAutoSwitchFolders ? 'ON' : 'OFF'}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="text-xs">
                <div className="font-medium">🔧 Debug Auto-Switch</div>
                <div className="mt-1">
                  {debugAutoSwitchFolders ? '✅ ON' : '❌ OFF'}: Switch automatico al tab Viste quando si interagisce con cartelle e viste
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          <CreateFolderModal onCreateFolder={handleCreateFolder} />
        </div>
      </div>

      {/* Batch Operations Bar */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded-md">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedItems.size} elementi selezionati
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Move to folder dropdown - simplified for now */}
            <Button
              variant="outline"
              size="sm"
              onClick={deleteSelectedItems}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              title="Elimina elementi selezionati"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Elimina
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="h-7 px-2 text-xs"
              title="Deseleziona tutto"
            >
              <X className="h-3 w-3 mr-1" />
              Deseleziona
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div 
        className="space-y-1 max-h-96 overflow-y-auto pr-2"
        onClick={(e) => {
          // Deselect all when clicking on empty space
          if (e.target === e.currentTarget) {
            clearSelection();
          }
        }}
      >
        {loading ? (
          <div className="text-center text-muted-foreground text-sm p-4">
            Caricamento...
          </div>
        ) : rootItems.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessuna cartella o vista salvata</p>
            <CreateFolderModal 
              onCreateFolder={handleCreateFolder}
              trigger={
                <Button variant="outline" size="sm" className="mt-2">
                  Crea la prima cartella
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Condivisi Folder - Always visible at top */}
            <CondivisiFolder 
              onOpenDiagram={onOpenDiagram}
              handleAutoSwitchToViews={handleAutoSwitchToViews}
            />
            
            {/* Regular folders and views */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {renderItems(rootItems, 0, 0, itemsByParent, rootItems.filter(item => item.is_folder), setShareViewModal)}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* Share View Modal */}
      <ShareViewModal
        isOpen={shareViewModal.isOpen}
        onClose={() => setShareViewModal({ isOpen: false, viewId: '', viewName: '' })}
        viewId={shareViewModal.viewId}
        viewName={shareViewModal.viewName}
        currentUserName={user?.user_metadata?.username}
        onShareSent={(shareData) => {
          // TODO: Handle successful share - could update UI to show shared status
          console.log('View shared successfully:', shareData);
        }}
      />
      </div>
    </TooltipProvider>
  );
};