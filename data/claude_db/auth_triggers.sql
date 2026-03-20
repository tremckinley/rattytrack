-- ==========================================
-- AUTH USER SYNC TRIGGER
-- Automatically creates a public.users row 
-- whenever a new user registers via Supabase Auth
-- ==========================================

-- 1. Create the function that handles the insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (supabase_user_id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users (internal Supabase table)
-- Note: This must be run as a superuser or via Supabase SQL Editor
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. One-time sync for existing users
-- Run this if you already have users in Auth but not in public.users
INSERT INTO public.users (supabase_user_id, email, role)
SELECT id, email, 'user'
FROM auth.users
ON CONFLICT (supabase_user_id) DO NOTHING;
