-- Add logo_url column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url text;

-- ============================================================
-- Fix Circular Dependency on owner_id
-- organizations(owner_id) references profiles(id) BUT profile 
-- needs organizations(id). Changing FK to auth.users solves this.
-- ============================================================
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS fk_org_owner;
ALTER TABLE organizations ADD CONSTRAINT fk_org_owner FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- Fix missing SIGNUP BYPASS RLS policies
-- These were dropped by 002_fix_functions.sql but never recreated.
-- Without these, new users cannot sign up (org/profile/seed inserts fail).
-- ============================================================

-- Allow authenticated users to create organizations during signup
DROP POLICY IF EXISTS "Authenticated users can create orgs" ON organizations;
CREATE POLICY "Authenticated users can create orgs"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow new owners to SELECT their newly created org during the same request
DROP POLICY IF EXISTS "Owners can view own org immediately" ON organizations;
CREATE POLICY "Owners can view own org immediately"
  ON organizations FOR SELECT
  USING (owner_id = auth.uid());

-- Allow authenticated users to update ANY org during signup
-- (needed to set owner_id right after creating the org, before profile exists)
DROP POLICY IF EXISTS "New owners can update own org" ON organizations;
CREATE POLICY "New owners can update own org"
  ON organizations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Allow new users to create their own profile during signup
DROP POLICY IF EXISTS "Authenticated users can create profile" ON profiles;
CREATE POLICY "Authenticated users can create profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());

-- Allow new users to seed insurance companies during signup
-- (profile doesn't exist yet so public.user_org_id() returns NULL)
DROP POLICY IF EXISTS "Authenticated users can seed companies" ON insurance_companies;
CREATE POLICY "Authenticated users can seed companies"
  ON insurance_companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow new users to seed product types during signup
DROP POLICY IF EXISTS "Authenticated users can seed product types" ON product_types;
CREATE POLICY "Authenticated users can seed product types"
  ON product_types FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
