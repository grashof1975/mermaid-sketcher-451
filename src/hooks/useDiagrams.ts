
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Diagram } from '@/types/database';
import { toast } from '@/components/ui/use-toast';

export const useDiagrams = () => {
  const { user } = useAuth();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDiagrams = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diagrams')
        .select(`
          *,
          profiles:user_id(username, full_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDiagrams(data || []);
    } catch (error) {
      console.error('Error loading diagrams:', error);
      toast({
        title: "Error loading diagrams",
        description: "Failed to load your diagrams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createDiagram = useCallback(async (diagram: {
    title: string;
    description?: string;
    mermaid_code: string;
    is_public?: boolean;
    tags?: string[];
  }) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('diagrams')
      .insert({
        ...diagram,
        user_id: user.id,
      })
      .select('*')
      .single();

    if (error) throw error;

    setCurrentDiagram(data);
    await loadDiagrams();

    toast({
      title: "Diagram created",
      description: `"${data.title}" has been created successfully.`,
    });

    return data;
  }, [user, loadDiagrams]);

  const updateDiagram = useCallback(async (id: string, updates: Partial<Diagram>) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('diagrams')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) throw error;

    if (currentDiagram?.id === id) {
      setCurrentDiagram(data);
    }

    await loadDiagrams();

    return data;
  }, [user, currentDiagram, loadDiagrams]);

  const deleteDiagram = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('diagrams')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    if (currentDiagram?.id === id) {
      setCurrentDiagram(null);
    }

    await loadDiagrams();

    toast({
      title: "Diagram deleted",
      description: "The diagram has been deleted successfully.",
    });
  }, [user, currentDiagram, loadDiagrams]);

  const duplicateDiagram = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    // First get the original diagram
    const { data: original, error: fetchError } = await supabase
      .from('diagrams')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Create duplicate
    const { data, error } = await supabase
      .from('diagrams')
      .insert({
        user_id: user.id,
        title: `${original.title} (Copy)`,
        description: original.description,
        mermaid_code: original.mermaid_code,
        is_public: false, // Copies are private by default
        tags: original.tags,
      })
      .select('*')
      .single();

    if (error) throw error;

    await loadDiagrams();

    toast({
      title: "Diagram duplicated",
      description: `"${data.title}" has been created as a copy.`,
    });

    return data;
  }, [user, loadDiagrams]);

  useEffect(() => {
    if (user) {
      loadDiagrams();
    } else {
      setDiagrams([]);
      setCurrentDiagram(null);
    }
  }, [user, loadDiagrams]);

  return {
    diagrams,
    currentDiagram,
    setCurrentDiagram,
    loading,
    createDiagram,
    updateDiagram,
    deleteDiagram,
    duplicateDiagram,
    loadDiagrams,
  };
};
