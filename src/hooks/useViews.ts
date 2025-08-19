
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SavedView } from '@/types/database';
import { toast } from '@/components/ui/use-toast';

export const useViews = (diagramId?: string) => {
  const { user } = useAuth();
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(false);

  const loadViews = useCallback(async () => {
    if (!user || !diagramId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .eq('diagram_id', diagramId as any)
        .eq('user_id', user.id as any)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const typedData = (data || []) as unknown as SavedView[];

      // Build hierarchical structure
      const viewsMap = new Map(typedData.map(view => [view.id, { ...view, children: [] }]));
      const rootViews: SavedView[] = [];

      typedData.forEach(view => {
        const viewWithChildren = viewsMap.get(view.id)!;
        if (view.parent_id) {
          const parent = viewsMap.get(view.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(viewWithChildren);
          }
        } else {
          rootViews.push(viewWithChildren);
        }
      });

      setViews(rootViews);
    } catch (error) {
      console.error('Error loading views:', error);
      toast({
        title: "Error loading views",
        description: "Failed to load saved views",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, diagramId]);

  const saveView = useCallback(async (viewData: {
    name: string;
    zoom_level: number;
    pan_x: number;
    pan_y: number;
    parent_id?: string | null;
    is_folder?: boolean;
  }) => {
    if (!user || !diagramId) throw new Error('Not authenticated or no diagram selected');

    // Get next sort order
    const { data: maxSortData } = await supabase
      .from('saved_views')
      .select('sort_order')
      .eq('diagram_id', diagramId as any)
      .eq('parent_id', viewData.parent_id || null as any)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = ((maxSortData as any)?.[0]?.sort_order || 0) + 1;

    const { data, error } = await supabase
      .from('saved_views')
      .insert({
        ...viewData,
        diagram_id: diagramId,
        user_id: user.id,
        sort_order: nextSortOrder,
      } as any)
      .select('*')
      .single();

    if (error) throw error;

    await loadViews();

    toast({
      title: "View saved",
      description: `"${(data as any).name}" has been saved successfully.`,
    });

    return data;
  }, [user, diagramId, loadViews]);

  const updateView = useCallback(async (id: string, updates: Partial<SavedView>) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_views')
      .update(updates as any)
      .eq('id', id as any)
      .eq('user_id', user.id as any)
      .select('*')
      .single();

    if (error) throw error;

    await loadViews();

    return data;
  }, [user, loadViews]);

  const deleteView = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saved_views')
      .delete()
      .eq('id', id as any)
      .eq('user_id', user.id as any);

    if (error) throw error;

    await loadViews();

    toast({
      title: "View deleted",
      description: "The view has been deleted successfully.",
    });
  }, [user, loadViews]);

  const reorderViews = useCallback(async (updates: { id: string; sort_order: number }[]) => {
    if (!user) throw new Error('Not authenticated');

    // Update all sort orders in a transaction
    const promises = updates.map(({ id, sort_order }) =>
      supabase
        .from('saved_views')
        .update({ sort_order } as any)
        .eq('id', id as any)
        .eq('user_id', user.id as any)
    );

    await Promise.all(promises);
    await loadViews();
  }, [user, loadViews]);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  return {
    views,
    loading,
    saveView,
    updateView,
    deleteView,
    reorderViews,
    loadViews,
  };
};
