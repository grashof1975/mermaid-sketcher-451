
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  theme_preference VARCHAR DEFAULT 'system',
  toast_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagrams table
CREATE TABLE IF NOT EXISTS public.diagrams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  mermaid_code TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_views table
CREATE TABLE IF NOT EXISTS public.saved_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagram_id UUID NOT NULL REFERENCES public.diagrams ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  zoom_level NUMERIC NOT NULL DEFAULT 1.00,
  pan_x NUMERIC DEFAULT 0,
  pan_y NUMERIC DEFAULT 0,
  parent_id UUID REFERENCES public.saved_views ON DELETE CASCADE,
  is_folder BOOLEAN DEFAULT false,
  expanded BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagram_id UUID NOT NULL REFERENCES public.diagrams ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  text TEXT NOT NULL,
  linked_view_id UUID REFERENCES public.saved_views ON DELETE SET NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create provisional_views table
CREATE TABLE IF NOT EXISTS public.provisional_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagram_id UUID NOT NULL REFERENCES public.diagrams ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  zoom_level NUMERIC NOT NULL DEFAULT 1.00,
  pan_x NUMERIC DEFAULT 0,
  pan_y NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_prompts table
CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagram_id UUID NOT NULL REFERENCES public.diagrams ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  generated_code TEXT NOT NULL,
  model_used VARCHAR DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagram_shares table
CREATE TABLE IF NOT EXISTS public.diagram_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagram_id UUID NOT NULL REFERENCES public.diagrams ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  share_token VARCHAR NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex') UNIQUE,
  is_public BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  password_hash TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaborators table
CREATE TABLE IF NOT EXISTS public.collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagram_id UUID NOT NULL REFERENCES public.diagrams ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  permission_level VARCHAR NOT NULL CHECK (permission_level IN ('read', 'comment', 'edit', 'admin')),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(diagram_id, user_id)
);

-- Create user_api_keys table
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  encrypted_api_key TEXT NOT NULL,
  key_hint VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_pool table for AI optimization
CREATE TABLE IF NOT EXISTS public.prompt_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_key VARCHAR NOT NULL UNIQUE,
  template TEXT NOT NULL,
  category VARCHAR NOT NULL,
  complexity VARCHAR NOT NULL CHECK (complexity IN ('simple', 'medium', 'complex')),
  tokens_avg INTEGER DEFAULT 150,
  success_rate NUMERIC DEFAULT 0.95,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisional_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagram_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_pool ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profile info is viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can view and edit their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- RLS Policies for diagrams
CREATE POLICY "Users can manage their own diagrams" ON public.diagrams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public diagrams" ON public.diagrams FOR SELECT USING (is_public = true);
CREATE POLICY "Collaborators can view shared diagrams" ON public.diagrams FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM collaborators c 
    WHERE c.diagram_id = diagrams.id 
    AND c.user_id = auth.uid() 
    AND c.status = 'accepted'
  )
);
CREATE POLICY "Collaborators can edit shared diagrams" ON public.diagrams FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM collaborators c 
    WHERE c.diagram_id = diagrams.id 
    AND c.user_id = auth.uid() 
    AND c.status = 'accepted' 
    AND c.permission_level IN ('edit', 'admin')
  )
);

-- RLS Policies for saved_views
CREATE POLICY "Users can manage their own saved views" ON public.saved_views FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view saved views of accessible diagrams" ON public.saved_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM diagrams d 
    WHERE d.id = saved_views.diagram_id 
    AND (d.user_id = auth.uid() OR d.is_public = true OR 
         EXISTS (SELECT 1 FROM collaborators c WHERE c.diagram_id = d.id AND c.user_id = auth.uid() AND c.status = 'accepted'))
  )
);

-- RLS Policies for comments
CREATE POLICY "Users can manage their own comments" ON public.comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view comments on accessible diagrams" ON public.comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM diagrams d 
    WHERE d.id = comments.diagram_id 
    AND (d.user_id = auth.uid() OR d.is_public = true OR 
         EXISTS (SELECT 1 FROM collaborators c WHERE c.diagram_id = d.id AND c.user_id = auth.uid() AND c.status = 'accepted'))
  )
);
CREATE POLICY "Collaborators can create comments" ON public.comments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM diagrams d 
    WHERE d.id = comments.diagram_id 
    AND (d.user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM collaborators c WHERE c.diagram_id = d.id AND c.user_id = auth.uid() AND c.status = 'accepted' 
                 AND c.permission_level IN ('comment', 'edit', 'admin')))
  )
);

-- RLS Policies for provisional_views
CREATE POLICY "Users can manage their own provisional views" ON public.provisional_views FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for ai_prompts
CREATE POLICY "Users can manage their own AI prompts" ON public.ai_prompts FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for diagram_shares
CREATE POLICY "Users can manage shares of their own diagrams" ON public.diagram_shares FOR ALL USING (
  EXISTS (SELECT 1 FROM diagrams d WHERE d.id = diagram_shares.diagram_id AND d.user_id = auth.uid())
);
CREATE POLICY "Public shares are viewable by anyone" ON public.diagram_shares FOR SELECT USING (
  is_public = true AND (expires_at IS NULL OR expires_at > NOW())
);

-- RLS Policies for collaborators
CREATE POLICY "Diagram owners can manage collaborators" ON public.collaborators FOR ALL USING (
  EXISTS (SELECT 1 FROM diagrams d WHERE d.id = collaborators.diagram_id AND d.user_id = auth.uid())
);
CREATE POLICY "Users can view collaborations they're part of" ON public.collaborators FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = invited_by
);
CREATE POLICY "Users can accept/decline their own invitations" ON public.collaborators FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_api_keys
CREATE POLICY "Users can manage their own API keys" ON public.user_api_keys FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for prompt_pool
CREATE POLICY "Prompt pool is readable by authenticated users" ON public.prompt_pool FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only service role can modify prompt pool" ON public.prompt_pool FOR ALL USING (auth.role() = 'service_role');

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_diagrams_updated_at BEFORE UPDATE ON public.diagrams FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_saved_views_updated_at BEFORE UPDATE ON public.saved_views FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON public.collaborators FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON public.user_api_keys FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_prompt_pool_updated_at BEFORE UPDATE ON public.prompt_pool FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ language 'plpgsql' security definer;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_diagrams', COALESCE(d.count, 0),
    'public_diagrams', COALESCE(d.public_count, 0),
    'total_views', COALESCE(v.count, 0),
    'total_comments', COALESCE(c.count, 0),
    'ai_prompts_used', COALESCE(a.count, 0)
  ) INTO stats
  FROM (
    SELECT 
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE is_public = true) as public_count
    FROM diagrams WHERE user_id = user_uuid
  ) d
  CROSS JOIN (
    SELECT COUNT(*) as count FROM saved_views WHERE user_id = user_uuid
  ) v
  CROSS JOIN (
    SELECT COUNT(*) as count FROM comments WHERE user_id = user_uuid
  ) c
  CROSS JOIN (
    SELECT COUNT(*) as count FROM ai_prompts WHERE user_id = user_uuid
  ) a;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default prompt templates
INSERT INTO public.prompt_pool (prompt_key, template, category, complexity, tokens_avg, success_rate) VALUES
('flowchart_basic', 'Create a flowchart diagram for: {description}. Use simple shapes and clear decision points.', 'flowchart', 'simple', 120, 0.95),
('sequence_basic', 'Create a sequence diagram for: {description}. Include actors, messages, and lifelines.', 'sequence', 'medium', 150, 0.92),
('class_basic', 'Create a class diagram for: {description}. Include classes, attributes, methods, and relationships.', 'class', 'complex', 200, 0.88),
('gantt_basic', 'Create a Gantt chart for: {description}. Include tasks, dependencies, and timeline.', 'gantt', 'medium', 140, 0.90),
('mindmap_basic', 'Create a mindmap for: {description}. Use hierarchical structure with main topics and subtopics.', 'mindmap', 'simple', 100, 0.93);

-- Enable realtime for tables that need it
ALTER publication supabase_realtime ADD TABLE public.comments;
ALTER publication supabase_realtime ADD TABLE public.collaborators;
ALTER publication supabase_realtime ADD TABLE public.diagrams;

-- Set replica identity for realtime tables
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.collaborators REPLICA IDENTITY FULL;
ALTER TABLE public.diagrams REPLICA IDENTITY FULL;
