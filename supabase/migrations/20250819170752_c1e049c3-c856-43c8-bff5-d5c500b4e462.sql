-- Fix infinite recursion by completely resetting RLS policies
-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage their own diagrams" ON public.diagrams;
DROP POLICY IF EXISTS "Users can view public diagrams" ON public.diagrams; 
DROP POLICY IF EXISTS "Collaborators can view shared diagrams" ON public.diagrams;
DROP POLICY IF EXISTS "Collaborators can edit shared diagrams" ON public.diagrams;

-- Create simple, non-recursive policies
CREATE POLICY "Users can manage their own diagrams" 
ON public.diagrams FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public diagrams" 
ON public.diagrams FOR SELECT 
USING (is_public = true);

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