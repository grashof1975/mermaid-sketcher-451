
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
        .select('*')
        .eq('user_id', user.id as any)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading diagrams:', error);
        throw error;
      }
      
      console.log('Diagrams loaded successfully:', data?.length || 0, 'diagrams');
      setDiagrams((data || []) as unknown as Diagram[]);
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
      } as any)
      .select('*')
      .single();

    if (error) throw error;

    setCurrentDiagram(data as unknown as Diagram);
    await loadDiagrams();

    toast({
      title: "Diagram created",
      description: `"${(data as unknown as Diagram).title}" has been created successfully.`,
    });

    return data;
  }, [user, loadDiagrams]);

  const updateDiagram = useCallback(async (id: string, updates: Partial<Diagram>) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('diagrams')
      .update(updates as any)
      .eq('id', id as any)
      .eq('user_id', user.id as any)
      .select('*')
      .single();

    if (error) throw error;

    if (currentDiagram?.id === id) {
      setCurrentDiagram(data as unknown as Diagram);
    }

    await loadDiagrams();

    return data;
  }, [user, currentDiagram, loadDiagrams]);

  const deleteDiagram = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('diagrams')
      .delete()
      .eq('id', id as any)
      .eq('user_id', user.id as any);

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
      .eq('id', id as any)
      .single();

    if (fetchError) throw fetchError;

    const typedOriginal = original as unknown as Diagram;

    // Create duplicate
    const { data, error } = await supabase
      .from('diagrams')
      .insert({
        user_id: user.id,
        title: `${typedOriginal.title} (Copy)`,
        description: typedOriginal.description,
        mermaid_code: typedOriginal.mermaid_code,
        is_public: false, // Copies are private by default
        tags: typedOriginal.tags,
      } as any)
      .select('*')
      .single();

    if (error) throw error;

    await loadDiagrams();

    toast({
      title: "Diagram duplicated",
      description: `"${(data as unknown as Diagram).title}" has been created as a copy.`,
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
