
-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Collaborators can view shared diagrams" ON public.diagrams;
DROP POLICY IF EXISTS "Collaborators can edit shared diagrams" ON public.diagrams;
DROP POLICY IF EXISTS "Users can manage their own diagrams" ON public.diagrams;
DROP POLICY IF EXISTS "Users can view public diagrams" ON public.diagrams;

-- Recreate policies without recursion
CREATE POLICY "Users can manage their own diagrams" 
  ON public.diagrams 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public diagrams" 
  ON public.diagrams 
  FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Collaborators can view shared diagrams" 
  ON public.diagrams 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators c 
      WHERE c.diagram_id = diagrams.id 
      AND c.user_id = auth.uid() 
      AND c.status = 'accepted'
    )
  );

CREATE POLICY "Collaborators can edit shared diagrams" 
  ON public.diagrams 
  FOR UPDATE 
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
