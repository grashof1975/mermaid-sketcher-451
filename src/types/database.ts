// Database Types Generated from Supabase Schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          website: string | null
          theme_preference: 'light' | 'dark' | 'system'
          toast_notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          theme_preference?: 'light' | 'dark' | 'system'
          toast_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          theme_preference?: 'light' | 'dark' | 'system'
          toast_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      diagrams: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          mermaid_code: string
          is_public: boolean
          tags: string[]
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          mermaid_code: string
          is_public?: boolean
          tags?: string[]
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          mermaid_code?: string
          is_public?: boolean
          tags?: string[]
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      saved_views: {
        Row: {
          id: string
          diagram_id: string
          user_id: string
          name: string
          zoom_level: number
          pan_x: number
          pan_y: number
          parent_id: string | null
          is_folder: boolean
          expanded: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          diagram_id: string
          user_id: string
          name: string
          zoom_level?: number
          pan_x?: number
          pan_y?: number
          parent_id?: string | null
          is_folder?: boolean
          expanded?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          diagram_id?: string
          user_id?: string
          name?: string
          zoom_level?: number
          pan_x?: number
          pan_y?: number
          parent_id?: string | null
          is_folder?: boolean
          expanded?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          diagram_id: string
          user_id: string
          text: string
          linked_view_id: string | null
          is_resolved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          diagram_id: string
          user_id: string
          text: string
          linked_view_id?: string | null
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          diagram_id?: string
          user_id?: string
          text?: string
          linked_view_id?: string | null
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      provisional_views: {
        Row: {
          id: string
          comment_id: string
          diagram_id: string
          user_id: string
          name: string
          zoom_level: number
          pan_x: number
          pan_y: number
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          diagram_id: string
          user_id: string
          name: string
          zoom_level?: number
          pan_x?: number
          pan_y?: number
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          diagram_id?: string
          user_id?: string
          name?: string
          zoom_level?: number
          pan_x?: number
          pan_y?: number
          created_at?: string
        }
      }
      ai_prompts: {
        Row: {
          id: string
          diagram_id: string
          user_id: string
          prompt_text: string
          generated_code: string
          model_used: string
          tokens_used: number | null
          execution_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          diagram_id: string
          user_id: string
          prompt_text: string
          generated_code: string
          model_used?: string
          tokens_used?: number | null
          execution_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          diagram_id?: string
          user_id?: string
          prompt_text?: string
          generated_code?: string
          model_used?: string
          tokens_used?: number | null
          execution_time_ms?: number | null
          created_at?: string
        }
      }
      diagram_shares: {
        Row: {
          id: string
          diagram_id: string
          shared_by: string
          share_token: string
          is_public: boolean
          password_hash: string | null
          expires_at: string | null
          view_count: number
          created_at: string
        }
        Insert: {
          id?: string
          diagram_id: string
          shared_by: string
          share_token?: string
          is_public?: boolean
          password_hash?: string | null
          expires_at?: string | null
          view_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          diagram_id?: string
          shared_by?: string
          share_token?: string
          is_public?: boolean
          password_hash?: string | null
          expires_at?: string | null
          view_count?: number
          created_at?: string
        }
      }
      collaborators: {
        Row: {
          id: string
          diagram_id: string
          user_id: string
          invited_by: string
          permission_level: 'read' | 'comment' | 'edit' | 'admin'
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          diagram_id: string
          user_id: string
          invited_by: string
          permission_level: 'read' | 'comment' | 'edit' | 'admin'
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          diagram_id?: string
          user_id?: string
          invited_by?: string
          permission_level?: 'read' | 'comment' | 'edit' | 'admin'
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
      }
      user_api_keys: {
        Row: {
          id: string
          user_id: string
          encrypted_api_key: string
          key_hint: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          encrypted_api_key: string
          key_hint?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          encrypted_api_key?: string
          key_hint?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      prompt_pool: {
        Row: {
          id: string
          prompt_key: string
          template: string
          category: string
          complexity: 'basic' | 'intermediate' | 'advanced'
          tokens_avg: number
          usage_count: number
          success_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          prompt_key: string
          template: string
          category: string
          complexity: 'basic' | 'intermediate' | 'advanced'
          tokens_avg?: number
          usage_count?: number
          success_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          prompt_key?: string
          template?: string
          category?: string
          complexity?: 'basic' | 'intermediate' | 'advanced'
          tokens_avg?: number
          usage_count?: number
          success_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_table_info: {
        Args: { table_num: string }
        Returns: Json
      }
      list_all_tables: {
        Args: {}
        Returns: Json
      }
      search_tables: {
        Args: { search_term: string }
        Returns: Json
      }
      get_user_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      cleanup_expired_data: {
        Args: {}
        Returns: Json
      }
      get_prompt_recommendation: {
        Args: { 
          description_text: string
          preferred_category?: string 
        }
        Returns: Json
      }
      validate_database_integrity: {
        Args: {}
        Returns: Json
      }
    }
  }
}