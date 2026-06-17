-- Migration: ensure_personal_household
-- Allows authenticated users to auto-provision a personal household on first use
-- without changing the existing RLS policy structure (households INSERT is service_role only).
-- The function runs as SECURITY DEFINER so it can bypass RLS and insert into households.

CREATE OR REPLACE FUNCTION public.ensure_personal_household()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
BEGIN
  -- Look for an existing household where the current user is already a member
  SELECT household_id
    INTO v_household_id
    FROM household_members
   WHERE user_id = auth.uid()
   LIMIT 1;

  -- If found, return it immediately (idempotent)
  IF v_household_id IS NOT NULL THEN
    RETURN v_household_id;
  END IF;

  -- Otherwise create a new personal household and add the user as admin
  INSERT INTO households (name)
  VALUES ('La mia farmacia')
  RETURNING id INTO v_household_id;

  INSERT INTO household_members (household_id, user_id, role)
  VALUES (v_household_id, auth.uid(), 'admin');

  RETURN v_household_id;
END;
$$;

-- Allow any authenticated user to call this function
GRANT EXECUTE ON FUNCTION public.ensure_personal_household() TO authenticated;
