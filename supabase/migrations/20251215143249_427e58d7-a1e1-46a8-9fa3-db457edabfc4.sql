-- Fix overly permissive vendor update policy
-- Regular Users should NOT be able to update any vendor records
-- Only Admins and Managers should have write access to vendors

DROP POLICY IF EXISTS "Users can update vendors" ON vendors;