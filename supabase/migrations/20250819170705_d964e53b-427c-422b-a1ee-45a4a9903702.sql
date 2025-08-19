-- Fix infinite recursion in RLS policies and missing profile
-- First, let's check and fix the RLS policies for diagrams table

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Collaborators can edit shared diagrams" ON public.diagrams;
DROP POLICY IF EXISTS "Collaborators can view shared diagrams" ON public.diagrams;

-- Recreate policies without recursive references
CREATE POLICY "Users can manage their own diagrams" 
ON public.diagrams FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public diagrams" 
ON public.diagrams FOR SELECT 
USING (is_public = true);

-- Add simple collaborator policies without recursion
CREATE POLICY "Collaborators can view shared diagrams" 
ON public.diagrams FOR SELECT 
USING (
  auth.uid() = user_id OR 
  is_public = true OR
  EXISTS (
    SELECT 1 FROM public.collaborators c 
    WHERE c.diagram_id = diagrams.id 
    AND c.user_id = auth.uid() 
    AND c.status = 'accepted'
  )
);

CREATE POLICY "Collaborators can edit shared diagrams" 
ON public.diagrams FOR UPDATE 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.collaborators c 
    WHERE c.diagram_id = diagrams.id 
    AND c.user_id = auth.uid() 
    AND c.status = 'accepted' 
    AND c.permission_level IN ('edit', 'admin')
  )
);

-- Create profile for the current user if missing
INSERT INTO public.profiles (id, username, full_name)
SELECT 
  'c83f377b-3c89-4605-9273-4c4047fe57fa'::uuid,
  'grashof',
  'gc'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = 'c83f377b-3c89-4605-9273-4c4047fe57fa'::uuid
);

-- Create a function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text from 1 for 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();