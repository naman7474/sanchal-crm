-- ============================================================
-- Fix: Create helper functions in PUBLIC schema (pooler can't write to auth schema)
-- Then drop failed policies and recreate with public.* functions
-- ============================================================

-- 1. Create helper functions in PUBLIC schema
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('owner', 'admin') FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.org_is_active()
RETURNS BOOLEAN AS $$
  SELECT 
    plan != 'suspended' 
    AND (
      (plan = 'trial' AND trial_ends_at > NOW())
      OR plan = 'free'
      OR (plan = 'pro' AND plan_active_until > NOW())
    )
  FROM public.organizations 
  WHERE id = public.user_org_id()
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 2. Drop all the failed policies (they errored so shouldn't exist, but be safe)
DROP POLICY IF EXISTS "Users can view own org" ON organizations;
DROP POLICY IF EXISTS "Owner can update org" ON organizations;
DROP POLICY IF EXISTS "Users can view org members" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can update org profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can manage invitations" ON invitations;
DROP POLICY IF EXISTS "Invitees can view own invitation" ON invitations;
DROP POLICY IF EXISTS "Org members can view customers" ON customers;
DROP POLICY IF EXISTS "Agents can create customers" ON customers;
DROP POLICY IF EXISTS "Agents can update customers" ON customers;
DROP POLICY IF EXISTS "Managers can delete customers" ON customers;
DROP POLICY IF EXISTS "Org members can view policies" ON policies;
DROP POLICY IF EXISTS "Agents can create policies" ON policies;
DROP POLICY IF EXISTS "Agents can update policies" ON policies;
DROP POLICY IF EXISTS "Managers can delete policies" ON policies;
DROP POLICY IF EXISTS "Org members can view documents" ON documents;
DROP POLICY IF EXISTS "Agents can upload documents" ON documents;
DROP POLICY IF EXISTS "Managers can delete documents" ON documents;
DROP POLICY IF EXISTS "Org members can view leads" ON leads;
DROP POLICY IF EXISTS "Agents can manage leads" ON leads;
DROP POLICY IF EXISTS "Agents can update leads" ON leads;
DROP POLICY IF EXISTS "Managers can delete leads" ON leads;
DROP POLICY IF EXISTS "Org members can view activity" ON activity_log;
DROP POLICY IF EXISTS "Authenticated users can log activity" ON activity_log;
DROP POLICY IF EXISTS "Org members can view companies" ON insurance_companies;
DROP POLICY IF EXISTS "Org members can manage companies" ON insurance_companies;
DROP POLICY IF EXISTS "Org members can update companies" ON insurance_companies;
DROP POLICY IF EXISTS "Org members can view product types" ON product_types;
DROP POLICY IF EXISTS "Org members can manage product types" ON product_types;
DROP POLICY IF EXISTS "Org members can update product types" ON product_types;


-- 3. Recreate all RLS policies using public.* functions

-- ---- ORGANIZATIONS ----
CREATE POLICY "Users can view own org"
  ON organizations FOR SELECT
  USING (id = public.user_org_id());

CREATE POLICY "Owner can update org"
  ON organizations FOR UPDATE
  USING (id = public.user_org_id() AND public.user_role() = 'owner');

-- ---- PROFILES ----
CREATE POLICY "Users can view org members"
  ON profiles FOR SELECT
  USING (org_id = public.user_org_id());

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Managers can update org profiles"
  ON profiles FOR UPDATE
  USING (org_id = public.user_org_id() AND public.is_manager());

-- ---- INVITATIONS ----
CREATE POLICY "Managers can manage invitations"
  ON invitations FOR ALL
  USING (org_id = public.user_org_id() AND public.is_manager());

CREATE POLICY "Invitees can view own invitation"
  ON invitations FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ---- CUSTOMERS ----
CREATE POLICY "Org members can view customers"
  ON customers FOR SELECT
  USING (org_id = public.user_org_id() AND public.org_is_active());

CREATE POLICY "Agents can create customers"
  ON customers FOR INSERT
  WITH CHECK (
    org_id = public.user_org_id() 
    AND public.user_role() IN ('owner', 'admin', 'agent')
    AND public.org_is_active()
  );

CREATE POLICY "Agents can update customers"
  ON customers FOR UPDATE
  USING (
    org_id = public.user_org_id() 
    AND public.user_role() IN ('owner', 'admin', 'agent')
    AND public.org_is_active()
  );

CREATE POLICY "Managers can delete customers"
  ON customers FOR DELETE
  USING (org_id = public.user_org_id() AND public.is_manager());

-- ---- POLICIES ----
CREATE POLICY "Org members can view policies"
  ON policies FOR SELECT
  USING (org_id = public.user_org_id() AND public.org_is_active());

CREATE POLICY "Agents can create policies"
  ON policies FOR INSERT
  WITH CHECK (
    org_id = public.user_org_id() 
    AND public.user_role() IN ('owner', 'admin', 'agent')
    AND public.org_is_active()
  );

CREATE POLICY "Agents can update policies"
  ON policies FOR UPDATE
  USING (
    org_id = public.user_org_id() 
    AND public.user_role() IN ('owner', 'admin', 'agent')
    AND public.org_is_active()
  );

CREATE POLICY "Managers can delete policies"
  ON policies FOR DELETE
  USING (org_id = public.user_org_id() AND public.is_manager());

-- ---- DOCUMENTS ----
CREATE POLICY "Org members can view documents"
  ON documents FOR SELECT
  USING (org_id = public.user_org_id() AND public.org_is_active());

CREATE POLICY "Agents can upload documents"
  ON documents FOR INSERT
  WITH CHECK (
    org_id = public.user_org_id() 
    AND public.user_role() IN ('owner', 'admin', 'agent', 'staff')
    AND public.org_is_active()
  );

CREATE POLICY "Managers can delete documents"
  ON documents FOR DELETE
  USING (org_id = public.user_org_id() AND public.is_manager());

-- ---- LEADS ----
CREATE POLICY "Org members can view leads"
  ON leads FOR SELECT
  USING (org_id = public.user_org_id() AND public.org_is_active());

CREATE POLICY "Agents can manage leads"
  ON leads FOR INSERT
  WITH CHECK (
    org_id = public.user_org_id() 
    AND public.user_role() IN ('owner', 'admin', 'agent')
    AND public.org_is_active()
  );

CREATE POLICY "Agents can update leads"
  ON leads FOR UPDATE
  USING (
    org_id = public.user_org_id() 
    AND public.user_role() IN ('owner', 'admin', 'agent')
    AND public.org_is_active()
  );

CREATE POLICY "Managers can delete leads"
  ON leads FOR DELETE
  USING (org_id = public.user_org_id() AND public.is_manager());

-- ---- ACTIVITY LOG ----
CREATE POLICY "Org members can view activity"
  ON activity_log FOR SELECT
  USING (org_id = public.user_org_id());

CREATE POLICY "Authenticated users can log activity"
  ON activity_log FOR INSERT
  WITH CHECK (org_id = public.user_org_id());

-- ---- LOOKUP TABLES ----
CREATE POLICY "Org members can view companies"
  ON insurance_companies FOR SELECT
  USING (org_id = public.user_org_id());

CREATE POLICY "Org members can manage companies"
  ON insurance_companies FOR INSERT
  WITH CHECK (org_id = public.user_org_id());

CREATE POLICY "Org members can update companies"
  ON insurance_companies FOR UPDATE
  USING (org_id = public.user_org_id());

CREATE POLICY "Org members can view product types"
  ON product_types FOR SELECT
  USING (org_id = public.user_org_id());

CREATE POLICY "Org members can manage product types"
  ON product_types FOR INSERT
  WITH CHECK (org_id = public.user_org_id());

CREATE POLICY "Org members can update product types"
  ON product_types FOR UPDATE
  USING (org_id = public.user_org_id());
