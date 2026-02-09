-- ============================================================
-- Fix RLS policies for clients table
-- Allow all authenticated users to INSERT, UPDATE, DELETE clients
-- ============================================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Managers and admins can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Managers and admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Managers and admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Everyone can view clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;

-- Make sure RLS is enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users can view all clients
CREATE POLICY "Authenticated users can view clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: all authenticated users can add clients
CREATE POLICY "Authenticated users can insert clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: all authenticated users can update clients
CREATE POLICY "Authenticated users can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (true);

-- DELETE: all authenticated users can delete clients
CREATE POLICY "Authenticated users can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (true);
