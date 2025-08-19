
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          website: string | null;
          theme_preference: string;
          toast_notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          theme_preference?: string;
          toast_notifications_enabled?: boolean;
        };
        Update: {
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          theme_preference?: string;
          toast_notifications_enabled?: boolean;
        };
      };
      diagrams: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          mermaid_code: string;
          is_public: boolean;
          tags: string[];
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          mermaid_code: string;
          is_public?: boolean;
          tags?: string[];
          version?: number;
        };
        Update: {
          title?: string;
          description?: string | null;
          mermaid_code?: string;
          is_public?: boolean;
          tags?: string[];
          version?: number;
        };
      };
      saved_views: {
        Row: {
          id: string;
          diagram_id: string;
          user_id: string;
          name: string;
          zoom_level: number;
          pan_x: number;
          pan_y: number;
          parent_id: string | null;
          is_folder: boolean;
          expanded: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          diagram_id: string;
          user_id: string;
          name: string;
          zoom_level: number;
          pan_x: number;
          pan_y: number;
          parent_id?: string | null;
          is_folder?: boolean;
          expanded?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          zoom_level?: number;
          pan_x?: number;
          pan_y?: number;
          parent_id?: string | null;
          is_folder?: boolean;
          expanded?: boolean;
          sort_order?: number;
        };
      };
      comments: {
        Row: {
          id: string;
          diagram_id: string;
          user_id: string;
          text: string;
          linked_view_id: string | null;
          is_resolved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          diagram_id: string;
          user_id: string;
          text: string;
          linked_view_id?: string | null;
          is_resolved?: boolean;
        };
        Update: {
          text?: string;
          linked_view_id?: string | null;
          is_resolved?: boolean;
        };
      };
      provisional_views: {
        Row: {
          id: string;
          diagram_id: string;
          user_id: string;
          comment_id: string;
          name: string;
          zoom_level: number;
          pan_x: number;
          pan_y: number;
          created_at: string;
        };
        Insert: {
          diagram_id: string;
          user_id: string;
          comment_id: string;
          name: string;
          zoom_level: number;
          pan_x: number;
          pan_y: number;
        };
        Update: {
          name?: string;
          zoom_level?: number;
          pan_x?: number;
          pan_y?: number;
        };
      };
      ai_prompts: {
        Row: {
          id: string;
          diagram_id: string;
          user_id: string;
          prompt_text: string;
          generated_code: string;
          model_used: string;
          tokens_used: number | null;
          execution_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          diagram_id: string;
          user_id: string;
          prompt_text: string;
          generated_code: string;
          model_used?: string;
          tokens_used?: number | null;
          execution_time_ms?: number | null;
        };
        Update: {
          prompt_text?: string;
          generated_code?: string;
          model_used?: string;
          tokens_used?: number | null;
          execution_time_ms?: number | null;
        };
      };
    };
  };
}

// App-level types
export interface User {
  id: string;
  email: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  theme_preference: string;
  toast_notifications_enabled: boolean;
}

export interface Diagram {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  mermaid_code: string;
  is_public: boolean;
  tags: string[];
  version: number;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface SavedView {
  id: string;
  diagram_id: string;
  user_id: string;
  name: string;
  zoom_level: number;
  pan_x: number;
  pan_y: number;
  parent_id?: string | null;
  is_folder: boolean;
  expanded: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: SavedView[];
}

export interface Comment {
  id: string;
  diagram_id: string;
  user_id: string;
  text: string;
  linked_view_id?: string | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
  saved_view?: SavedView;
}

export interface ProvisionalView {
  id: string;
  diagram_id: string;
  user_id: string;
  comment_id: string;
  name: string;
  zoom_level: number;
  pan_x: number;
  pan_y: number;
  created_at: string;
}
