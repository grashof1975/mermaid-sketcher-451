import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Type helpers for better developer experience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Common database operations with proper typing
export const db = {
  // Profiles
  profiles: {
    async get(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data
    },

    async upsert(profile: InsertTables<'profiles'>) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Diagrams
  diagrams: {
    async getAll(userId: string) {
      const { data, error } = await supabase
        .from('diagrams')
        .select(`
          *,
          saved_views(count),
          comments(count)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async get(id: string) {
      const { data, error } = await supabase
        .from('diagrams')
        .select()
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async create(diagram: InsertTables<'diagrams'>) {
      const { data, error } = await supabase
        .from('diagrams')
        .insert(diagram)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async update(id: string, updates: UpdateTables<'diagrams'>) {
      const { data, error } = await supabase
        .from('diagrams')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('diagrams')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // Saved Views
  savedViews: {
    async getAll(diagramId: string, userId: string) {
      const { data, error } = await supabase
        .from('saved_views')
        .select()
        .eq('diagram_id', diagramId)
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      return data
    },

    async create(view: InsertTables<'saved_views'>) {
      const { data, error } = await supabase
        .from('saved_views')
        .insert(view)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async update(id: string, updates: UpdateTables<'saved_views'>) {
      const { data, error } = await supabase
        .from('saved_views')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('saved_views')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // Comments
  comments: {
    async getAll(diagramId: string) {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          saved_views:linked_view_id(name)
        `)
        .eq('diagram_id', diagramId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async create(comment: InsertTables<'comments'>) {
      const { data, error } = await supabase
        .from('comments')
        .insert(comment)
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          saved_views:linked_view_id(name)
        `)
        .single()
      
      if (error) throw error
      return data
    },

    async update(id: string, updates: UpdateTables<'comments'>) {
      const { data, error } = await supabase
        .from('comments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // AI Prompts
  aiPrompts: {
    async getAll(userId: string, limit: number = 50) {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data
    },

    async create(prompt: InsertTables<'ai_prompts'>) {
      const { data, error } = await supabase
        .from('ai_prompts')
        .insert(prompt)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Helper functions for database management
  async getTableInfo(tableNumber: string) {
    const { data, error } = await supabase.rpc('get_table_info', {
      table_num: tableNumber
    })
    
    if (error) throw error
    return data
  },

  async getUserStats(userId: string) {
    const { data, error } = await supabase.rpc('get_user_stats', {
      user_uuid: userId
    })
    
    if (error) throw error
    return data
  },

  async getPromptRecommendation(description: string, category?: string) {
    const { data, error } = await supabase.rpc('get_prompt_recommendation', {
      description_text: description,
      preferred_category: category
    })
    
    if (error) throw error
    return data
  }
}

export default supabase