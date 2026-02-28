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
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- "Rajesh Insurance Agency"
  slug TEXT UNIQUE NOT NULL,                   -- "rajesh-insurance" (for URLs)
  owner_id UUID,                               -- set after first user signs up
  phone TEXT,
  email TEXT,
  address TEXT,
  
  -- Billing / Subscription (manual activation)
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'free', 'pro', 'suspended')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  plan_active_until TIMESTAMPTZ,               -- admin manually extends this
  activated_by TEXT,                            -- admin note: "UPI ₹499 received 01-Mar-2026"
  
  -- Limits (enforced at app level, not DB)
  max_customers INTEGER DEFAULT 50,            -- free: 50, pro: unlimited (NULL)
  max_storage_mb INTEGER DEFAULT 100,          -- free: 100MB, pro: 1000MB
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
-- One user = exactly one org
CREATE TABLE profiles (
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

-- Set org owner after profile creation
ALTER TABLE organizations 
  ADD CONSTRAINT fk_org_owner FOREIGN KEY (owner_id) REFERENCES profiles(id);

-- Invitations (owner/admin invites staff)
CREATE TABLE invitations (
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
  
  -- One active invite per email per org
  UNIQUE(org_id, email)
);


-- ============================================================
-- 2. CORE BUSINESS TABLES (all have org_id)
-- ============================================================

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  
  customer_name TEXT NOT NULL,
  mobile_no TEXT,
  email TEXT,
  address TEXT,
  date_of_birth DATE,
  id_type TEXT,                    -- Aadhaar, PAN, DL, Passport
  id_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'prospect', 'inactive', 'churned')),
  source TEXT,                     -- referral, walk-in, online, social_media
  reference_name TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  
  -- Core fields (from Excel SAMPLE)
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product TEXT NOT NULL,               -- '2W', 'PVT CAR', 'HEALTH', etc.
  vehicle_no TEXT,
  policy_type TEXT,                    -- 'PACKAGE', 'TP', 'MEDICLAIM', etc.
  company_name TEXT NOT NULL,
  policy_no TEXT,
  agent_name TEXT,
  reference TEXT,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Commission (primary)
  net_od_premium NUMERIC(12,2) DEFAULT 0,
  commission_percent NUMERIC(5,3) DEFAULT 0,
  before_tds NUMERIC(12,2) DEFAULT 0,
  tds_amount NUMERIC(12,2) DEFAULT 0,
  commission NUMERIC(12,2) DEFAULT 0,
  
  -- Commission (secondary / sub-agent)
  sub_commission_percent NUMERIC(5,3) DEFAULT 0,
  sub_before_tds NUMERIC(12,2) DEFAULT 0,
  sub_tds_amount NUMERIC(12,2) DEFAULT 0,
  sub_commission NUMERIC(12,2) DEFAULT 0,
  
  -- Calculated
  profit NUMERIC(12,2) DEFAULT 0,
  
  -- Additional
  premium_amount NUMERIC(12,2),        -- total premium customer pays
  sum_insured NUMERIC(14,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'renewed')),
  renewal_of UUID REFERENCES policies(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id),
  
  document_type TEXT NOT NULL,         -- 'policy_copy', 'id_proof', 'claim_form', etc.
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,             -- Supabase Storage: {org_id}/{customer_id}/filename
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads / Prospects
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  assigned_to UUID REFERENCES profiles(id),
  
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT,                         -- 'referral', 'walk-in', 'website', 'social_media'
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

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  customer_id UUID REFERENCES customers(id),
  policy_id UUID REFERENCES policies(id),
  lead_id UUID REFERENCES leads(id),
  
  action TEXT NOT NULL,                -- 'created', 'updated', 'called', 'document_uploaded'
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. LOOKUP / CONFIG TABLES (per-org customization)
-- ============================================================

-- Saved insurance companies (per org, for autocomplete)
CREATE TABLE insurance_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,                     -- "Go Digit" for display
  default_commission_percent NUMERIC(5,3),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(org_id, name)
);

-- Saved product types (per org, extensible)
CREATE TABLE product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- '2W', 'PVT CAR', 'HEALTH'
  category TEXT,                       -- 'motor', 'health', 'life', 'general'
  requires_vehicle BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(org_id, name)
);


-- ============================================================
-- 4. INDEXES
-- ============================================================

-- Tenant isolation (every query filters by org_id first)
CREATE INDEX idx_customers_org ON customers(org_id);
CREATE INDEX idx_policies_org ON policies(org_id);
CREATE INDEX idx_documents_org ON documents(org_id);
CREATE INDEX idx_leads_org ON leads(org_id);
CREATE INDEX idx_activity_org ON activity_log(org_id);
CREATE INDEX idx_profiles_org ON profiles(org_id);

-- Business queries (compound indexes with org_id for efficiency)
CREATE INDEX idx_policies_org_end_date ON policies(org_id, end_date);
CREATE INDEX idx_policies_org_status ON policies(org_id, status);
CREATE INDEX idx_policies_org_customer ON policies(org_id, customer_id);
CREATE INDEX idx_customers_org_status ON customers(org_id, status);
CREATE INDEX idx_customers_org_name ON customers(org_id, customer_name);
CREATE INDEX idx_leads_org_status ON leads(org_id, status);
CREATE INDEX idx_leads_org_followup ON leads(org_id, follow_up_date);
CREATE INDEX idx_documents_org_customer ON documents(org_id, customer_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_insurance_companies_org ON insurance_companies(org_id);


-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Get current user's org_id (used in ALL RLS policies)
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has management privileges (owner, admin)
CREATE OR REPLACE FUNCTION auth.is_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('owner', 'admin') FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if org subscription is active
CREATE OR REPLACE FUNCTION auth.org_is_active()
RETURNS BOOLEAN AS $$
  SELECT 
    plan != 'suspended' 
    AND (
      plan = 'trial' AND trial_ends_at > NOW()
      OR plan = 'free'
      OR plan = 'pro' AND plan_active_until > NOW()
    )
  FROM organizations 
  WHERE id = auth.user_org_id()
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on ALL tables
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
-- Users can only see their own org
CREATE POLICY "Users can view own org"
  ON organizations FOR SELECT
  USING (id = auth.user_org_id());

-- Only owner can update org details
CREATE POLICY "Owner can update org"
  ON organizations FOR UPDATE
  USING (id = auth.user_org_id() AND auth.user_role() = 'owner');

-- ---- PROFILES ----
-- Users can see everyone in their org
CREATE POLICY "Users can view org members"
  ON profiles FOR SELECT
  USING (org_id = auth.user_org_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Owner/admin can update any profile in their org (e.g. change roles)
CREATE POLICY "Managers can update org profiles"
  ON profiles FOR UPDATE
  USING (org_id = auth.user_org_id() AND auth.is_manager());

-- ---- INVITATIONS ----
-- Managers can manage invitations
CREATE POLICY "Managers can manage invitations"
  ON invitations FOR ALL
  USING (org_id = auth.user_org_id() AND auth.is_manager());

-- Invited users can view their own invitation (for accept flow)
CREATE POLICY "Invitees can view own invitation"
  ON invitations FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ---- CUSTOMERS ----
-- All org members can view customers (if org is active)
CREATE POLICY "Org members can view customers"
  ON customers FOR SELECT
  USING (org_id = auth.user_org_id() AND auth.org_is_active());

-- Agents+ can create customers
CREATE POLICY "Agents can create customers"
  ON customers FOR INSERT
  WITH CHECK (
    org_id = auth.user_org_id() 
    AND auth.user_role() IN ('owner', 'admin', 'agent')
    AND auth.org_is_active()
  );

-- Agents+ can update customers
CREATE POLICY "Agents can update customers"
  ON customers FOR UPDATE
  USING (
    org_id = auth.user_org_id() 
    AND auth.user_role() IN ('owner', 'admin', 'agent')
    AND auth.org_is_active()
  );

-- Only managers can delete customers
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
CREATE POLICY "Org members can view companies"
  ON insurance_companies FOR ALL
  USING (org_id = auth.user_org_id());

CREATE POLICY "Org members can view product types"
  ON product_types FOR ALL
  USING (org_id = auth.user_org_id());


-- ============================================================
-- 7. STORAGE POLICIES (Supabase Storage)
-- ============================================================

-- Storage bucket structure: documents/{org_id}/{customer_id}/{filename}
-- Create bucket via Supabase dashboard or API:
--   Name: "documents"
--   Public: false
--   File size limit: 10MB (free tier friendly)
--   Allowed MIME types: application/pdf, image/jpeg, image/png, 
--                       application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- Storage RLS (applied in Supabase dashboard > Storage > Policies)
-- SELECT: auth.user_org_id()::text = (storage.foldername(name))[1]
-- INSERT: auth.user_org_id()::text = (storage.foldername(name))[1] AND auth.org_is_active()
-- DELETE: auth.user_org_id()::text = (storage.foldername(name))[1] AND auth.is_manager()


-- ============================================================
-- 8. VIEWS (org-scoped via RLS — views inherit table policies)
-- ============================================================

-- Expiring policies (next 90 days)
CREATE VIEW v_expiring_policies AS
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
CREATE VIEW v_monthly_commission AS
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
CREATE VIEW v_dashboard_stats AS
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


-- ============================================================
-- 9. SEED DATA (default product types & companies for new orgs)
-- ============================================================

-- Called via Edge Function when a new org is created
-- This is a reference — execute via application code, not raw SQL

/*
INSERT INTO product_types (org_id, name, category, requires_vehicle) VALUES
  (:org_id, '2W', 'motor', true),
  (:org_id, 'PVT CAR', 'motor', true),
  (:org_id, 'COMMERCIAL VEHICLE', 'motor', true),
  (:org_id, 'HEALTH', 'health', false),
  (:org_id, 'LIFE', 'life', false),
  (:org_id, 'TERM', 'life', false),
  (:org_id, 'TRAVEL', 'general', false),
  (:org_id, 'FIRE', 'general', false),
  (:org_id, 'MARINE', 'general', false),
  (:org_id, 'PA (Personal Accident)', 'general', false);

INSERT INTO insurance_companies (org_id, name, short_name) VALUES
  (:org_id, 'GO DIGIT GENERAL INSURANCE', 'Go Digit'),
  (:org_id, 'RELIANCE GENERAL INSURANCE', 'Reliance'),
  (:org_id, 'ZURICH KOTAK GENERAL INSURANCE', 'Zurich Kotak'),
  (:org_id, 'SHRIRAM GENERAL INSURANCE', 'Shriram'),
  (:org_id, 'ICICI LOMBARD', 'ICICI Lombard'),
  (:org_id, 'HDFC ERGO', 'HDFC Ergo'),
  (:org_id, 'BAJAJ ALLIANZ', 'Bajaj Allianz'),
  (:org_id, 'TATA AIG', 'Tata AIG'),
  (:org_id, 'NEW INDIA ASSURANCE', 'New India'),
  (:org_id, 'UNITED INDIA INSURANCE', 'United India'),
  (:org_id, 'NATIONAL INSURANCE', 'National'),
  (:org_id, 'LIC', 'LIC'),
  (:org_id, 'SBI LIFE', 'SBI Life'),
  (:org_id, 'MAX LIFE', 'Max Life'),
  (:org_id, 'STAR HEALTH', 'Star Health');
*/


-- ============================================================
-- 10. SIGNUP / ONBOARDING FLOW (Edge Function logic)
-- ============================================================

/*
SIGNUP FLOW:

1. User signs up via Supabase Auth (email + password)
   → auth.users row created automatically

2. Edge Function "handle-new-user" triggered on auth.users INSERT:
   
   a. CREATE organization (name from signup form, slug auto-generated)
   b. CREATE profile (user_id, org_id, role='owner')
   c. UPDATE organization SET owner_id = profile.id
   d. SEED product_types for new org
   e. SEED insurance_companies for new org
   f. CREATE storage folder: documents/{org_id}/

3. User lands on dashboard → 14-day trial active

INVITE FLOW:

1. Owner clicks "Invite Team Member"
2. INSERT into invitations (org_id, email, role)
3. Send invite email (or WhatsApp link) with token
4. Invitee signs up → Edge Function checks invitations table
5. If matching invitation exists:
   a. CREATE profile with invitation's org_id and role
   b. UPDATE invitation SET status = 'accepted'
6. Invitee lands on dashboard within the owner's org

MANUAL BILLING FLOW:

1. Trial expires after 14 days → plan stays 'trial' but auth.org_is_active() returns false
2. App shows "Trial expired" banner with UPI payment instructions
3. Agent pays via UPI / bank transfer
4. YOU (superadmin) run:
   
   UPDATE organizations 
   SET plan = 'pro', 
       plan_active_until = NOW() + INTERVAL '30 days',
       activated_by = 'UPI ₹499 received 01-Mar-2026, txn: ABC123',
       max_customers = NULL,  -- unlimited
       max_storage_mb = 1000
   WHERE slug = 'rajesh-insurance';

5. Agent refreshes → full access restored
*/


-- ============================================================
-- 11. SUPERADMIN QUERY HELPERS
-- ============================================================
-- Run these from Supabase SQL Editor to manage tenants manually

-- View all orgs and their status
-- SELECT id, name, slug, plan, trial_ends_at, plan_active_until, 
--        (SELECT COUNT(*) FROM profiles p WHERE p.org_id = o.id) AS members,
--        (SELECT COUNT(*) FROM policies p WHERE p.org_id = o.id) AS policies,
--        (SELECT COUNT(*) FROM customers c WHERE c.org_id = o.id) AS customers
-- FROM organizations o
-- ORDER BY created_at DESC;

-- Activate a paid org (after receiving payment)
-- UPDATE organizations 
-- SET plan = 'pro', 
--     plan_active_until = NOW() + INTERVAL '30 days',
--     activated_by = 'UPI ₹499, txn: XXX',
--     max_customers = NULL, max_storage_mb = 1000
-- WHERE slug = 'AGENT_SLUG_HERE';

-- Extend subscription
-- UPDATE organizations 
-- SET plan_active_until = plan_active_until + INTERVAL '30 days',
--     activated_by = activated_by || E'\nRenewal: UPI ₹499, txn: YYY'
-- WHERE slug = 'AGENT_SLUG_HERE';

-- Suspend an org
-- UPDATE organizations SET plan = 'suspended' WHERE slug = 'AGENT_SLUG_HERE';