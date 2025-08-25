-- Add is_mother_view column to saved_views table
-- This column identifies which views are "mother views" (default views for diagrams)

ALTER TABLE saved_views 
ADD COLUMN is_mother_view BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on mother views
CREATE INDEX idx_saved_views_mother_view ON saved_views(user_id, is_mother_view) WHERE is_mother_view = TRUE;

-- Update existing views that have the 🏠 emoji in their name to be marked as mother views
UPDATE saved_views 
SET is_mother_view = TRUE 
WHERE name LIKE '%🏠%';

-- Add comment to explain the column
COMMENT ON COLUMN saved_views.is_mother_view IS 'Identifies mother views (default views) for diagrams';