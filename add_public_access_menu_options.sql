-- Add public read access to menu item options tables for customer app
-- This allows customers to view menu item options when browsing menus

-- First, check if RLS is enabled on these tables
-- If not enabled, enable it
ALTER TABLE menu_item_option_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_options ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist (optional - only if you want to replace them)
-- DROP POLICY IF EXISTS "Users can view menu item option categories for their business items" ON menu_item_option_categories;
-- DROP POLICY IF EXISTS "Users can view menu item options for their business items" ON menu_item_options;

-- Add public read policies for customer app access
-- These policies allow anyone to read menu item option categories and options
CREATE POLICY "Public can view menu item option categories" ON menu_item_option_categories
    FOR SELECT USING (true);

CREATE POLICY "Public can view menu item options" ON menu_item_options
    FOR SELECT USING (true);

-- Note: The existing business owner policies for INSERT, UPDATE, DELETE should remain intact
-- This only adds public READ access for customers