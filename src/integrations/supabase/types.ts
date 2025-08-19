export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_prompts: {
        Row: {
          created_at: string | null
          diagram_id: string
          execution_time_ms: number | null
          generated_code: string
          id: string
          model_used: string | null
          prompt_text: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          diagram_id: string
          execution_time_ms?: number | null
          generated_code: string
          id?: string
          model_used?: string | null
          prompt_text: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          diagram_id?: string
          execution_time_ms?: number | null
          generated_code?: string
          id?: string
          model_used?: string | null
          prompt_text?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "diagrams"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          created_at: string | null
          diagram_id: string
          id: string
          invited_by: string
          permission_level: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          diagram_id: string
          id?: string
          invited_by: string
          permission_level: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          diagram_id?: string
          id?: string
          invited_by?: string
          permission_level?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "diagrams"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          created_at: string | null
          diagram_id: string
          id: string
          is_resolved: boolean | null
          linked_view_id: string | null
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          diagram_id: string
          id?: string
          is_resolved?: boolean | null
          linked_view_id?: string | null
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          diagram_id?: string
          id?: string
          is_resolved?: boolean | null
          linked_view_id?: string | null
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "diagrams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_linked_view_id_fkey"
            columns: ["linked_view_id"]
            isOneToOne: false
            referencedRelation: "saved_views"
            referencedColumns: ["id"]
          },
        ]
      }
      diagram_shares: {
        Row: {
          created_at: string | null
          diagram_id: string
          expires_at: string | null
          id: string
          is_public: boolean | null
          password_hash: string | null
          share_token: string
          shared_by: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          diagram_id: string
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          password_hash?: string | null
          share_token?: string
          shared_by: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          diagram_id?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          password_hash?: string | null
          share_token?: string
          shared_by?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diagram_shares_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "diagrams"
            referencedColumns: ["id"]
          },
        ]
      }
      diagrams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          mermaid_code: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          mermaid_code: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          mermaid_code?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          theme_preference: string | null
          toast_notifications_enabled: boolean | null
          updated_at: string | null
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          theme_preference?: string | null
          toast_notifications_enabled?: boolean | null
          updated_at?: string | null
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          theme_preference?: string | null
          toast_notifications_enabled?: boolean | null
          updated_at?: string | null
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      prompt_pool: {
        Row: {
          category: string
          complexity: string
          created_at: string | null
          id: string
          prompt_key: string
          success_rate: number | null
          template: string
          tokens_avg: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          complexity: string
          created_at?: string | null
          id?: string
          prompt_key: string
          success_rate?: number | null
          template: string
          tokens_avg?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          complexity?: string
          created_at?: string | null
          id?: string
          prompt_key?: string
          success_rate?: number | null
          template?: string
          tokens_avg?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      provisional_views: {
        Row: {
          comment_id: string
          created_at: string | null
          diagram_id: string
          id: string
          name: string
          pan_x: number | null
          pan_y: number | null
          user_id: string
          zoom_level: number
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          diagram_id: string
          id?: string
          name: string
          pan_x?: number | null
          pan_y?: number | null
          user_id: string
          zoom_level?: number
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          diagram_id?: string
          id?: string
          name?: string
          pan_x?: number | null
          pan_y?: number | null
          user_id?: string
          zoom_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "provisional_views_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisional_views_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "diagrams"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          created_at: string | null
          diagram_id: string
          expanded: boolean | null
          id: string
          is_folder: boolean | null
          name: string
          pan_x: number | null
          pan_y: number | null
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string
          zoom_level: number
        }
        Insert: {
          created_at?: string | null
          diagram_id: string
          expanded?: boolean | null
          id?: string
          is_folder?: boolean | null
          name: string
          pan_x?: number | null
          pan_y?: number | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
          zoom_level?: number
        }
        Update: {
          created_at?: string | null
          diagram_id?: string
          expanded?: boolean | null
          id?: string
          is_folder?: boolean | null
          name?: string
          pan_x?: number | null
          pan_y?: number | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
          zoom_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "diagrams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_views_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "saved_views"
            referencedColumns: ["id"]
          },
        ]
      }
      table_registry: {
        Row: {
          created_at: string | null
          display_name: string
          entity_type: string
          main_relationships: string[] | null
          primary_keys: string[] | null
          purpose: string
          table_name: string
          table_number: string
          typical_queries: string[] | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          entity_type: string
          main_relationships?: string[] | null
          primary_keys?: string[] | null
          purpose: string
          table_name: string
          table_number: string
          typical_queries?: string[] | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          entity_type?: string
          main_relationships?: string[] | null
          primary_keys?: string[] | null
          purpose?: string
          table_name?: string
          table_number?: string
          typical_queries?: string[] | null
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string | null
          encrypted_api_key: string
          id: string
          is_active: boolean | null
          key_hint: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_api_key: string
          id?: string
          is_active?: boolean | null
          key_hint?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_api_key?: string
          id?: string
          is_active?: boolean | null
          key_hint?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_temp_files: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_prompt_recommendation: {
        Args: { description_text: string; preferred_category?: string }
        Returns: Json
      }
      get_table_info: {
        Args: { table_num: string }
        Returns: Json
      }
      get_user_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_storage_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      list_all_tables: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      search_tables: {
        Args: { search_term: string }
        Returns: Json
      }
      validate_database_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
