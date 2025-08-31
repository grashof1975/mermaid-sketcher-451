import { useState, useEffect, useCallback } from 'react';
import { db } from '@/utils/supabase';
import { useToast } from '@/hooks/use-toast';

export interface TagFilterState {
  activeTags: string[];
  filterMode: 'AND' | 'OR';
  isActive: boolean;
}

interface TagFilterStats {
  [tagName: string]: {
    usageCount: number;
    filterCount: number;
    lastUsed: Date;
  };
}

export const useTagFilter = (diagramId?: string) => {
  const [filterState, setFilterState] = useState<TagFilterState>({
    activeTags: [],
    filterMode: 'AND',
    isActive: false
  });
  const [stats, setStats] = useState<TagFilterStats>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load saved filters from database
  const loadFilters = useCallback(async () => {
    if (!diagramId) return;
    
    setIsLoading(true);
    try {
      const { data: savedFilter, error } = await db.supabase
        .from('user_tag_filters')
        .select('*')
        .eq('diagram_id', diagramId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (savedFilter) {
        setFilterState({
          activeTags: savedFilter.active_tags || [],
          filterMode: savedFilter.filter_mode || 'AND',
          isActive: savedFilter.is_active || false
        });
      }
    } catch (error) {
      console.error('Error loading tag filters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [diagramId]);

  // Save filters to database
  const saveFilters = useCallback(async (newState: TagFilterState) => {
    if (!diagramId) return;

    try {
      const { data: { user } } = await db.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await db.supabase
        .from('user_tag_filters')
        .upsert({
          user_id: user.id,
          diagram_id: diagramId,
          active_tags: newState.activeTags,
          filter_mode: newState.filterMode,
          is_active: newState.isActive,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,diagram_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving tag filters:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare i filtri tag",
        variant: "destructive",
      });
    }
  }, [diagramId, toast]);

  // Toggle tag filter (main functionality)
  const toggleTag = useCallback((tagName: string) => {
    setFilterState(prev => {
      const newActiveTags = prev.activeTags.includes(tagName)
        ? prev.activeTags.filter(tag => tag !== tagName) // Remove tag
        : [...prev.activeTags, tagName]; // Add tag
      
      const newState = {
        ...prev,
        activeTags: newActiveTags,
        isActive: newActiveTags.length > 0
      };

      // Save to database
      saveFilters(newState);
      
      // Update tag statistics
      updateTagStats(tagName, 'filter');
      
      return newState;
    });
  }, [saveFilters]);

  // Set filter mode (AND/OR)
  const setFilterMode = useCallback((mode: 'AND' | 'OR') => {
    setFilterState(prev => {
      const newState = { ...prev, filterMode: mode };
      saveFilters(newState);
      return newState;
    });
  }, [saveFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const newState = {
      activeTags: [],
      filterMode: filterState.filterMode,
      isActive: false
    } as TagFilterState;
    
    setFilterState(newState);
    saveFilters(newState);
  }, [filterState.filterMode, saveFilters]);

  // Update tag usage statistics
  const updateTagStats = useCallback(async (tagName: string, action: 'usage' | 'filter') => {
    try {
      const { data: { user } } = await db.supabase.auth.getUser();
      if (!user) return;

      // Call the database function to update stats
      const { error } = await db.supabase.rpc('update_tag_stats', {
        p_user_id: user.id,
        p_tag_name: tagName,
        p_action: action
      });

      if (error) throw error;
      
      // Update local stats for immediate UI feedback
      setStats(prev => ({
        ...prev,
        [tagName]: {
          usageCount: (prev[tagName]?.usageCount || 0) + (action === 'usage' ? 1 : 0),
          filterCount: (prev[tagName]?.filterCount || 0) + (action === 'filter' ? 1 : 0),
          lastUsed: new Date()
        }
      }));
    } catch (error) {
      console.error('Error updating tag stats:', error);
    }
  }, []);

  // Filter function to apply to diagram/view lists
  const applyTagFilter = useCallback(<T extends { tags?: string[] }>(items: T[]): T[] => {
    if (!filterState.isActive || filterState.activeTags.length === 0) {
      return items;
    }

    return items.filter(item => {
      if (!item.tags || item.tags.length === 0) {
        return false; // No tags = not visible when filters active
      }

      if (filterState.filterMode === 'AND') {
        // ALL selected tags must be present
        return filterState.activeTags.every(tag => 
          item.tags!.some(itemTag => 
            itemTag.toLowerCase() === tag.toLowerCase()
          )
        );
      } else {
        // ANY selected tag must be present
        return filterState.activeTags.some(tag => 
          item.tags!.some(itemTag => 
            itemTag.toLowerCase() === tag.toLowerCase()
          )
        );
      }
    });
  }, [filterState]);

  // Get all unique tags from a dataset for suggestions
  const getAllTags = useCallback(<T extends { tags?: string[] }>(items: T[]): string[] => {
    const tagSet = new Set<string>();
    
    items.forEach(item => {
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    
    return Array.from(tagSet).sort();
  }, []);

  // Calculate filter results count
  const getFilteredCount = useCallback(<T extends { tags?: string[] }>(items: T[]): number => {
    return applyTagFilter(items).length;
  }, [applyTagFilter]);

  // Load filters on mount
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  return {
    // State
    filterState,
    stats,
    isLoading,
    
    // Actions
    toggleTag,
    setFilterMode,
    clearAllFilters,
    updateTagStats,
    
    // Utilities
    applyTagFilter,
    getAllTags,
    getFilteredCount,
    
    // Computed
    hasActiveFilters: filterState.isActive && filterState.activeTags.length > 0,
    activeTagsCount: filterState.activeTags.length
  };
};