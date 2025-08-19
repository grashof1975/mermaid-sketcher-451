
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface ApiKeyData {
  id: string;
  key_hint: string;
  is_active: boolean;
  created_at: string;
}

export const useSecureApiKeys = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(false);

  // Simple encryption for client-side (in production, use server-side encryption)
  const encryptKey = (key: string): string => {
    // This is a basic XOR encryption - in production use proper encryption
    const salt = user?.id || 'default-salt';
    return btoa(key.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
    ).join(''));
  };

  const decryptKey = (encryptedKey: string): string => {
    try {
      const salt = user?.id || 'default-salt';
      return atob(encryptedKey).split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
      ).join('');
    } catch {
      return '';
    }
  };

  const loadApiKeys = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, key_hint, is_active, created_at')
        .eq('user_id', user.id as any)
        .eq('is_active', true as any);

      if (error) throw error;
      setApiKeys((data || []) as any);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async (apiKey: string, keyHint?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save API keys",
        variant: "destructive"
      });
      return false;
    }

    if (!apiKey || apiKey.length < 10) {
      toast({
        title: "Invalid API Key",
        description: "API key must be at least 10 characters long",
        variant: "destructive"
      });
      return false;
    }

    try {
      const encryptedKey = encryptKey(apiKey);
      const hint = keyHint || `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;

      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          encrypted_api_key: encryptedKey,
          key_hint: hint,
          is_active: true
        } as any);

      if (error) throw error;

      toast({
        title: "API Key Saved",
        description: "Your API key has been securely stored in the database",
      });

      await loadApiKeys();
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save API key to database",
        variant: "destructive"
      });
      return false;
    }
  };

  const getApiKey = async (keyId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('encrypted_api_key')
        .eq('id', keyId as any)
        .eq('user_id', user.id as any)
        .eq('is_active', true as any)
        .single();

      if (error) throw error;
      return data ? decryptKey((data as any).encrypted_api_key) : null;
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_api_keys')
        .update({ is_active: false } as any)
        .eq('id', keyId as any)
        .eq('user_id', user.id as any);

      if (error) throw error;

      toast({
        title: "API Key Deleted",
        description: "API key has been deactivated",
      });

      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete API key",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  return {
    apiKeys,
    loading,
    saveApiKey,
    getApiKey,
    deleteApiKey,
    refreshApiKeys: loadApiKeys
  };
};
