-- ============================================================
-- KAVACH — Multi-Tenant Insurance Agent CRM
-- Supabase/Postgres Schema v2.0
-- 
-- Tenancy Model: Shared DB, row-level isolation via org_id
-- User Model:    One user belongs to exactly one organization
-- Billing:       Manual activation (UPI/bank transfer)
-- ============================================================


-- ============================================================
-- 1. TENANT & AUTH TABLES
-- ============================================================

-- Organizations (the tenant — an agency or solo agent)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID,
  phone TEXT,
  email TEXT,
  address TEXT,
  
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'free', 'pro', 'suspended')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  plan_active_until TIMESTAMPTZ,
  activated_by TEXT,
  
  max_customers INTEGER DEFAULT 50,
  max_storage_mb INTEGER DEFAULT 100,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'agent', 'staff', 'readonly')),
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set org owner FK (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_org_owner'
  ) THEN
    ALTER TABLE organizations 
      ADD CONSTRAINT fk_org_owner FOREIGN KEY (owner_id) REFERENCES profiles(id);
  END IF;
END $$;

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'agent', 'staff', 'readonly')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, email)
);


-- ============================================================
-- 2. CORE BUSINESS TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  
  customer_name TEXT NOT NULL,
  mobile_no TEXT,
  email TEXT,
  address TEXT,
  date_of_birth DATE,
  id_type TEXT,
  id_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'prospect', 'inactive', 'churned')),
  source TEXT,
  reference_name TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product TEXT NOT NULL,
  vehicle_no TEXT,
  policy_type TEXT,
  company_name TEXT NOT NULL,
  policy_no TEXT,
  agent_name TEXT,
  reference TEXT,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  net_od_premium NUMERIC(12,2) DEFAULT 0,
  commission_percent NUMERIC(5,3) DEFAULT 0,
  before_tds NUMERIC(12,2) DEFAULT 0,
  tds_amount NUMERIC(12,2) DEFAULT 0,
  commission NUMERIC(12,2) DEFAULT 0,
  
  sub_commission_percent NUMERIC(5,3) DEFAULT 0,
  sub_before_tds NUMERIC(12,2) DEFAULT 0,
  sub_tds_amount NUMERIC(12,2) DEFAULT 0,
  sub_commission NUMERIC(12,2) DEFAULT 0,
  
  profit NUMERIC(12,2) DEFAULT 0,
  
  premium_amount NUMERIC(12,2),
  sum_insured NUMERIC(14,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'renewed')),
  renewal_of UUID REFERENCES policies(id),
  notes TEXT,
  sub_product TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id),
  
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  assigned_to UUID REFERENCES profiles(id),
  
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT,
  referred_by TEXT,
  interested_product TEXT,
  estimated_premium NUMERIC(12,2),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'negotiating', 'converted', 'lost')),
  follow_up_date DATE,
  last_contacted_at TIMESTAMPTZ,
  notes TEXT,
  lost_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  customer_id UUID REFERENCES customers(id),
  policy_id UUID REFERENCES policies(id),
  lead_id UUID REFERENCES leads(id),
  
  action TEXT NOT NULL,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. LOOKUP / CONFIG TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS insurance_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  default_commission_percent NUMERIC(5,3),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(org_id, name)
);

CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  requires_vehicle BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(org_id, name)
);


-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_policies_org ON policies(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_log(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(org_id);

CREATE INDEX IF NOT EXISTS idx_policies_org_end_date ON policies(org_id, end_date);
CREATE INDEX IF NOT EXISTS idx_policies_org_status ON policies(org_id, status);
CREATE INDEX IF NOT EXISTS idx_policies_org_customer ON policies(org_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_status ON customers(org_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_org_name ON customers(org_id, customer_name);
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON leads(org_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_org_followup ON leads(org_id, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_documents_org_customer ON documents(org_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_org ON insurance_companies(org_id);


-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.is_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('owner', 'admin') FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.org_is_active()
RETURNS BOOLEAN AS $$
  SELECT 
    plan != 'suspended' 
    AND (
      plan = 'trial' AND trial_ends_at > NOW()
      OR plan = 'free'
      OR plan = 'pro' AND plan_active_until > NOW()
    )
  FROM public.organizations 
  WHERE id = auth.user_org_id()
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;

-- ---- ORGANIZATIONS ----
CREATE POLICY "Users can view own org"
  ON organizations FOR SELECT
  USING (id = auth.user_org_id());

CREATE POLICY "Owner can update org"
  ON organizations FOR UPDATE
  USING (id = auth.user_org_id() AND auth.user_role() = 'owner');

-- *** SIGNUP BYPASS: Allow authenticated users to create orgs (needed during signup) ***
CREATE POLICY "Authenticated users can create orgs"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- *** SIGNUP BYPASS: Allow owner to update their own org (set owner_id after profile creation) ***
CREATE POLICY "New owners can update own org"
  ON organizations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ---- PROFILES ----
CREATE POLICY "Users can view org members"
  ON profiles FOR SELECT
  USING (org_id = auth.user_org_id());

-- *** SIGNUP BYPASS: User can view their own profile even before org_id resolves ***
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Managers can update org profiles"
  ON profiles FOR UPDATE
  USING (org_id = auth.user_org_id() AND auth.is_manager());

-- *** SIGNUP BYPASS: Allow new users to create their profile ***
CREATE POLICY "Authenticated users can create profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());

-- ---- INVITATIONS ----
CREATE POLICY "Managers can manage invitations"
  ON invitations FOR ALL
  USING (org_id = auth.user_org_id() AND auth.is_manager());

CREATE POLICY "Invitees can view own invitation"
  ON invitations FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ---- CUSTOMERS ----
CREATE POLICY "Org members can view customers"
  ON customers FOR SELECT
  USING (org_id = auth.user_org_id() AND auth.org_is_active());

CREATE POLICY "Agents can create customers"
  ON customers FOR INSERT
  WITH CHECK (
    org_id = auth.user_org_id() 
    AND auth.user_role() IN ('owner', 'admin', 'agent')
    AND auth.org_is_active()
  );

CREATE POLICY "Agents can update customers"
  ON customers FOR UPDATE
  USING (
    org_id = auth.user_org_id() 
    AND auth.user_role() IN ('owner', 'admin', 'agent')
    AND auth.org_is_active()
  );

CREATE POLICY "Managers can delete customers"
  ON customers FOR DELETE
  USING (org_id = auth.user_org_id() AND auth.is_manager());

-- ---- POLICIES ----
CREATE POLICY "Org members can view policies"
  ON policies FOR SELECT
  USING (org_id = auth.user_org_id() AND auth.org_is_active());

CREATE POLICY "Agents can create policies"
  ON policies FOR INSERT
  WITH CHECK (
    org_id = auth.user_org_id() 
    AND auth.user_role() IN ('owner', 'admin', 'agent')
    AND auth.org_is_active()
  );

CREATE POLICY "Agents can update policies"
  ON policies FOR UPDATE
  USING (
    org_id = auth.user_org_id() 
    AND auth.user_role() IN ('owner', 'admin', 'agent')
    AND auth.org_is_active()
  );

CREATE POLICY "Managers can delete policies"
  ON policies FOR DELETE
  USING (org_id = auth.user_org_id() AND auth.is_manager());

-- ---- DOCUMENTS ----
CREATE POLICY "Org members can view documents"
  ON documents FOR SELECT
  USING (org_id = auth.user_org_id() AND auth.org_is_active());

CREATE POLICY "Agents can upload documents"
  ON documents FOR INSERT
  WITH CHECK (
    org_id = auth.user_org_id() 
    AND auth.user_role() IN ('owner', 'admin', 'agent', 'staff')
    AND auth.org_is_active()
  );

CREATE POLICY "Managers can delete documents"
  ON documents FOR DELETE
  USING (org_id = auth.user_org_id() AND auth.is_manager());

-- ---- LEADS ----
CREATE POLICY "Org members can view leads"
  ON leads FOR SELECT
  USING (org_id = auth.user_org_id() AND auth.org_is_active());

CREATE POLICY "Agents can manage leads"
  ON leads FOR INSERT
  WITH CHECK (
    org_id = auth.user_org_id() 
    AND auth.user_role() IN ('owner', 'admin', 'agent')
    AND auth.org_is_active()
  );

CREATE POLICY "Agents can update leads"
  ON leads FOR UPDATE
  USING (
    org_id = auth.user_org_id() 
    AND auth.user_role() IN ('owner', 'admin', 'agent')
    AND auth.org_is_active()
  );

CREATE POLICY "Managers can delete leads"
  ON leads FOR DELETE
  USING (org_id = auth.user_org_id() AND auth.is_manager());

-- ---- ACTIVITY LOG ----
CREATE POLICY "Org members can view activity"
  ON activity_log FOR SELECT
  USING (org_id = auth.user_org_id());

CREATE POLICY "Authenticated users can log activity"
  ON activity_log FOR INSERT
  WITH CHECK (org_id = auth.user_org_id());

-- ---- LOOKUP TABLES ----
-- Allow all CRUD for org members on their own org's lookup data
CREATE POLICY "Org members can view companies"
  ON insurance_companies FOR SELECT
  USING (org_id = auth.user_org_id());

CREATE POLICY "Org members can manage companies"
  ON insurance_companies FOR INSERT
  WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "Org members can update companies"
  ON insurance_companies FOR UPDATE
  USING (org_id = auth.user_org_id());

CREATE POLICY "Org members can view product types"
  ON product_types FOR SELECT
  USING (org_id = auth.user_org_id());

CREATE POLICY "Org members can manage product types"
  ON product_types FOR INSERT
  WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "Org members can update product types"
  ON product_types FOR UPDATE
  USING (org_id = auth.user_org_id());

-- *** SIGNUP BYPASS: Allow new users to seed lookup data during signup ***
-- These are needed because auth.user_org_id() returns NULL during signup
-- (profile hasn't been created yet when seeding companies/product_types)
CREATE POLICY "Authenticated users can seed companies"
  ON insurance_companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can seed product types"
  ON product_types FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================
-- 8. VIEWS
-- ============================================================

-- Expiring policies (next 90 days)
CREATE OR REPLACE VIEW v_expiring_policies AS
SELECT
  p.id,
  p.org_id,
  p.customer_id,
  c.customer_name,
  c.mobile_no,
  c.email AS customer_email,
  p.product,
  p.vehicle_no,
  p.policy_type,
  p.company_name,
  p.policy_no,
  p.start_date,
  p.end_date,
  p.net_od_premium,
  p.premium_amount,
  p.status,
  (p.end_date - CURRENT_DATE) AS days_until_expiry,
  CASE
    WHEN p.end_date < CURRENT_DATE THEN 'EXPIRED'
    WHEN p.end_date <= CURRENT_DATE + 7 THEN 'CRITICAL'
    WHEN p.end_date <= CURRENT_DATE + 30 THEN 'EXPIRING_30'
    WHEN p.end_date <= CURRENT_DATE + 60 THEN 'EXPIRING_60'
    ELSE 'EXPIRING_90'
  END AS urgency
FROM policies p
JOIN customers c ON p.customer_id = c.id
WHERE p.status = 'active'
  AND p.end_date <= CURRENT_DATE + 90
ORDER BY p.end_date ASC;

-- Monthly commission summary
CREATE OR REPLACE VIEW v_monthly_commission AS
SELECT
  org_id,
  DATE_TRUNC('month', entry_date) AS month,
  COUNT(*) AS total_policies,
  SUM(net_od_premium) AS total_premium,
  SUM(commission) AS total_commission,
  SUM(sub_commission) AS total_sub_commission,
  SUM(profit) AS total_profit,
  SUM(tds_amount) AS total_tds
FROM policies
GROUP BY org_id, DATE_TRUNC('month', entry_date)
ORDER BY month DESC;

-- Dashboard stats
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  org_id,
  COUNT(*) FILTER (WHERE status = 'active') AS active_policies,
  COUNT(*) FILTER (WHERE status = 'active' AND end_date <= CURRENT_DATE + 30) AS expiring_30,
  COUNT(*) FILTER (WHERE status = 'active' AND end_date < CURRENT_DATE) AS expired,
  SUM(net_od_premium) FILTER (
    WHERE DATE_TRUNC('month', entry_date) = DATE_TRUNC('month', CURRENT_DATE)
  ) AS current_month_premium,
  SUM(commission) FILTER (
    WHERE DATE_TRUNC('month', entry_date) = DATE_TRUNC('month', CURRENT_DATE)
  ) AS current_month_commission,
  SUM(profit) FILTER (
    WHERE DATE_TRUNC('month', entry_date) = DATE_TRUNC('month', CURRENT_DATE)
  ) AS current_month_profit
FROM policies
GROUP BY org_id;
