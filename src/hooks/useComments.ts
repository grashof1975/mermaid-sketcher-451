
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Comment } from '@/types/database';
import { toast } from '@/components/ui/use-toast';

export const useComments = (diagramId?: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!diagramId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(username, full_name, avatar_url),
          saved_views:linked_view_id(name)
        `)
        .eq('diagram_id', diagramId as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments((data || []) as unknown as Comment[]);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error loading comments",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [diagramId]);

  const addComment = useCallback(async (text: string, linkedViewId?: string) => {
    if (!user || !diagramId) throw new Error('Not authenticated or no diagram selected');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        diagram_id: diagramId,
        user_id: user.id,
        text,
        linked_view_id: linkedViewId,
      } as any)
      .select(`
        *,
        profiles:user_id(username, full_name, avatar_url),
        saved_views:linked_view_id(name)
      `)
      .single();

    if (error) throw error;

    setComments(prev => [data as unknown as Comment, ...prev]);

    toast({
      title: "Comment added",
      description: "Your comment has been added successfully.",
    });

    return data;
  }, [user, diagramId]);

  const updateComment = useCallback(async (id: string, text: string) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .update({ text } as any)
      .eq('id', id as any)
      .eq('user_id', user.id as any)
      .select(`
        *,
        profiles:user_id(username, full_name, avatar_url),
        saved_views:linked_view_id(name)
      `)
      .single();

    if (error) throw error;

    setComments(prev =>
      prev.map(comment => comment.id === id ? data as unknown as Comment : comment)
    );

    toast({
      title: "Comment updated",
      description: "Your comment has been updated successfully.",
    });

    return data;
  }, [user]);

  const deleteComment = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id as any)
      .eq('user_id', user.id as any);

    if (error) throw error;

    setComments(prev => prev.filter(comment => comment.id !== id));

    toast({
      title: "Comment deleted",
      description: "The comment has been deleted successfully.",
    });
  }, [user]);

  const toggleResolved = useCallback(async (id: string, is_resolved: boolean) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .update({ is_resolved } as any)
      .eq('id', id as any)
      .eq('user_id', user.id as any)
      .select(`
        *,
        profiles:user_id(username, full_name, avatar_url),
        saved_views:linked_view_id(name)
      `)
      .single();

    if (error) throw error;

    setComments(prev =>
      prev.map(comment => comment.id === id ? data as unknown as Comment : comment)
    );

    return data;
  }, [user]);

  // Real-time subscription for comments
  useEffect(() => {
    if (!diagramId) return;

    const subscription = supabase
      .channel(`comments:${diagramId}`)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `diagram_id=eq.${diagramId}`
        },
        async (payload) => {
          // Reload comments to get the full data with joins
          await loadComments();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `diagram_id=eq.${diagramId}`
        },
        async (payload) => {
          await loadComments();
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `diagram_id=eq.${diagramId}`
        },
        async (payload) => {
          await loadComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [diagramId, loadComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    toggleResolved,
    loadComments,
  };
};
