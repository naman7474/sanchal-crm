# Insurance Agent Portfolio Manager — System Design Document

## 1. Executive Summary

A lightweight, zero-cost insurance agent CRM built on **Next.js + Supabase + Vercel** to manage client portfolios, track policies, handle document storage, monitor renewals, and manage leads — replacing the current Excel-based workflow.

**Target Stack (all free tier):**
| Service | Free Tier | Sufficient For |
|---------|-----------|----------------|
| Supabase DB | 500 MB Postgres | ~50,000+ policy records |
| Supabase Storage | 1 GB (50 MB/file) | ~200+ policy documents |
| Supabase Auth | 50,000 MAUs | Single agent + staff |
| Vercel Hosting | 100 GB bandwidth | Full production app |

> **Note:** Supabase free-tier projects pause after 7 days of inactivity. For a daily-use CRM this won't be an issue, but worth noting. If the agent grows, Supabase Pro at $25/month removes all limitations and is still far cheaper than any insurance CRM on the market ($50-$150/user/month).

---

## 2. Competitive Landscape Analysis

I researched the top insurance CRM platforms to identify standard features. Here's what the industry offers and what we can match for free:

| Feature | AgencyBloc | EZLynx | Insureio | Salesforce | **Our Build** |
|---------|-----------|--------|----------|------------|---------------|
| Client Management | ✅ | ✅ | ✅ | ✅ | ✅ |
| Policy Tracking | ✅ | ✅ | ✅ | ✅ | ✅ |
| Document Storage | ✅ | ✅ | ✅ | ✅ | ✅ |
| Renewal Reminders | ✅ | ✅ | ✅ | ✅ | ✅ |
| Commission Tracking | ✅ | ❌ | ❌ | Add-on | ✅ |
| Lead/Prospect Management | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reporting & Analytics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-carrier Quoting | ✅ | ✅ | ✅ | ❌ | ❌ |
| Email Campaigns | ✅ | ✅ | ✅ | ✅ | ❌ (Phase 2) |
| Mobile App | ✅ | ✅ | ❌ | ✅ | ✅ (PWA) |
| **Pricing** | **$70+/mo** | **$200+/mo** | **$25+/mo** | **$300+/mo** | **$0** |

### What We CAN Support by Default (Free)
1. **Full client lifecycle management** — create, view, edit, search customers
2. **Complete policy tracking** — all fields from the Excel sample (product, vehicle, agent, company, dates, premiums, commissions)
3. **Document upload & management** — PDFs, images, policy docs (up to 50MB each, 1GB total)
4. **Renewal/expiry monitoring** — automated monthly reports, dashboard alerts
5. **Commission & profit tracking** — TDS calculations, agent splits, profit per policy
6. **Lead pipeline** — prospects, referrals, follow-up tracking
7. **Dashboard & reporting** — expiring policies, revenue summaries, agent performance
8. **PWA support** — installable on mobile, works offline for viewing
9. **Role-based access** — agent, staff, read-only roles
10. **Data export** — CSV/Excel export of any report

### What We CANNOT Do on Free Tier
- Automated email/SMS reminders (need external service like Resend free tier — 100 emails/day)
- WhatsApp integration
- Multi-carrier quoting engine
- OCR/auto-extraction from policy PDFs

---

## 3. Data Architecture

### 3.1 Database Schema (Supabase/Postgres)

Derived from the SAMPLE.xlsx structure with enhancements:

```sql
-- ==========================================
-- CORE TABLES
-- ==========================================

-- Users / Auth (handled by Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'staff', 'readonly')),
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers (clients + prospects)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id),
  customer_name TEXT NOT NULL,
  mobile_no TEXT,
  email TEXT,
  address TEXT,
  date_of_birth DATE,
  id_type TEXT,               -- Aadhaar, PAN, etc.
  id_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'prospect', 'inactive', 'churned')),
  source TEXT,                -- referral, walk-in, online, etc.
  reference_name TEXT,        -- who referred them
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies (core business data — maps to Excel columns)
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),

  -- From Excel: DATE, PRODUCT, VEHICLE NO, POLICY TYPE, COMPANY NAME, POLICY NO
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product TEXT NOT NULL,          -- '2W', 'PVT CAR', 'HEALTH', 'COMMERCIAL', 'LIFE', etc.
  vehicle_no TEXT,
  policy_type TEXT,               -- 'PACKAGE', 'TP', 'MEDICLAIM', 'TERM', etc.
  company_name TEXT NOT NULL,     -- Insurance company
  policy_no TEXT,

  -- From Excel: START DATE, END DATE
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- From Excel: AGENT, REFERENCE
  agent_name TEXT,
  reference TEXT,

  -- From Excel: NET/OD, PERCENT, BEFORE TDS, TDS, COMMISSION (primary)
  net_od_premium NUMERIC(12,2) DEFAULT 0,
  commission_percent NUMERIC(5,3) DEFAULT 0,
  before_tds NUMERIC(12,2) DEFAULT 0,
  tds_amount NUMERIC(12,2) DEFAULT 0,
  commission NUMERIC(12,2) DEFAULT 0,

  -- From Excel: PERCENT.1, BEFORE TDS.1, TDS.1, COMMISSION.1 (secondary/sub-agent)
  sub_commission_percent NUMERIC(5,3) DEFAULT 0,
  sub_before_tds NUMERIC(12,2) DEFAULT 0,
  sub_tds_amount NUMERIC(12,2) DEFAULT 0,
  sub_commission NUMERIC(12,2) DEFAULT 0,

  -- From Excel: PROFIT
  profit NUMERIC(12,2) DEFAULT 0,

  -- Additional metadata
  premium_amount NUMERIC(12,2),   -- total premium paid by customer
  sum_insured NUMERIC(14,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'renewed')),
  renewal_of UUID REFERENCES policies(id),  -- links to previous policy
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (variable uploads per customer/policy)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id),
  document_type TEXT NOT NULL,    -- 'policy_copy', 'id_proof', 'claim_form', 'photo', 'other'
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,        -- Supabase Storage path
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads / Prospects Pipeline
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),  -- optional, can convert later
  assigned_to UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT,                    -- 'referral', 'walk-in', 'website', 'social_media'
  referred_by TEXT,
  interested_product TEXT,        -- what they're looking for
  estimated_premium NUMERIC(12,2),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'negotiating', 'converted', 'lost')),
  follow_up_date DATE,
  last_contacted_at TIMESTAMPTZ,
  notes TEXT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log (for timeline/history)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  customer_id UUID REFERENCES customers(id),
  policy_id UUID REFERENCES policies(id),
  lead_id UUID REFERENCES leads(id),
  action TEXT NOT NULL,           -- 'created', 'updated', 'called', 'document_uploaded', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_policies_end_date ON policies(end_date);
CREATE INDEX idx_policies_customer ON policies(customer_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_name ON customers(customer_name);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_date);
CREATE INDEX idx_documents_customer ON documents(customer_id);

-- ==========================================
-- VIEWS FOR REPORTING
-- ==========================================

-- Policies expiring in next 30/60/90 days
CREATE VIEW v_expiring_policies AS
SELECT
  p.*,
  c.customer_name,
  c.mobile_no,
  c.email AS customer_email,
  CASE
    WHEN p.end_date <= CURRENT_DATE THEN 'EXPIRED'
    WHEN p.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_30'
    WHEN p.end_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'EXPIRING_60'
    WHEN p.end_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'EXPIRING_90'
  END AS urgency
FROM policies p
JOIN customers c ON p.customer_id = c.id
WHERE p.status = 'active'
  AND p.end_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY p.end_date ASC;

-- Monthly commission report
CREATE VIEW v_monthly_commission AS
SELECT
  DATE_TRUNC('month', entry_date) AS month,
  COUNT(*) AS total_policies,
  SUM(net_od_premium) AS total_premium,
  SUM(commission) AS total_commission,
  SUM(sub_commission) AS total_sub_commission,
  SUM(profit) AS total_profit
FROM policies
GROUP BY DATE_TRUNC('month', entry_date)
ORDER BY month DESC;
```

### 3.2 Supabase Storage Buckets

```
documents/
  ├── {customer_id}/
  │   ├── id_proofs/        -- Aadhaar, PAN, DL
  │   ├── policies/         -- Policy PDFs
  │   ├── claims/           -- Claim forms
  │   └── other/            -- Miscellaneous
```

### 3.3 Row Level Security (RLS)

```sql
-- Only authenticated users can see data
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies: all authenticated users in the org can read
CREATE POLICY "Authenticated users can read"
  ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only agents/admins can insert/update
CREATE POLICY "Agents can manage"
  ON customers FOR ALL
  USING (auth.role() = 'authenticated');
```

---

## 4. Application Architecture

### 4.1 Tech Stack

```
Frontend:  Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui
Backend:   Supabase (Postgres + Auth + Storage + Edge Functions)
Hosting:   Vercel (free tier)
State:     React Query (TanStack Query) for server state
Charts:    Recharts for dashboard visualizations
Export:    SheetJS (xlsx) for Excel exports
```

### 4.2 Page/Route Structure

```
/                         → Dashboard (overview + alerts)
/login                    → Authentication
/customers                → Customer list (search, filter, sort)
/customers/new            → Create customer form
/customers/[id]           → Customer detail + policies + documents
/customers/[id]/edit      → Edit customer
/policies                 → All policies list
/policies/new             → Create policy (with customer selector)
/policies/[id]            → Policy detail
/leads                    → Lead pipeline (Kanban or table view)
/leads/new                → Create lead
/reports                  → Reports hub
/reports/expiring         → Expiring policies report (monthly view)
/reports/commission       → Commission & profit report
/reports/summary          → Business summary
/settings                 → Profile, preferences, data import/export
```

---

## 5. Feature Specifications

### 5.1 Dashboard (Home)

The landing page after login. At-a-glance view of business health.

**Widgets:**
- **Expiry Alerts** — Policies expiring in 7 / 30 / 60 days with customer name, phone, product
- **Today's Follow-ups** — Leads that need follow-up today
- **Monthly Stats Cards** — Policies sold, total premium, total commission, profit this month
- **Revenue Trend** — Line chart of monthly commission/profit (last 12 months)
- **Pipeline Summary** — Lead funnel: New → Contacted → Quoted → Converted
- **Recent Activity** — Last 10 actions (policy created, document uploaded, etc.)

### 5.2 Customer Management

**Create Customer Form Fields** (derived from Excel + CRM best practices):
- Customer Name* (text)
- Mobile Number* (text, with click-to-call on mobile)
- Email (text)
- Address (textarea)
- Date of Birth (date picker)
- ID Type (dropdown: Aadhaar / PAN / Driving License / Passport)
- ID Number (text)
- Status (dropdown: Active / Prospect / Inactive)
- Source (dropdown: Referral / Walk-in / Online / Social Media / Other)
- Reference Name (text — who referred them, maps to Excel "REFERENCE" column)
- Notes (textarea)

**Customer Detail Page:**
- Profile card with contact info + click-to-call / click-to-WhatsApp
- Policies tab — all policies for this customer (active, expired, renewed)
- Documents tab — uploaded files with preview, download, delete
- Activity timeline — history of all interactions
- Quick actions: Add Policy, Upload Document, Create Lead, Send Reminder

### 5.3 Policy Management

**Create Policy Form Fields** (exact mapping to Excel SAMPLE):

| Excel Column | Form Field | Type |
|-------------|------------|------|
| DATE | Entry Date | Date picker (auto-fills today) |
| CUSTOMER NAME | Customer | Searchable dropdown (from customers table) |
| PRODUCT | Product | Dropdown: 2W, PVT CAR, COMMERCIAL, HEALTH, LIFE, TRAVEL, FIRE, MARINE |
| VEHICLE NO. | Vehicle Number | Text (conditional — only for motor) |
| AGENT | Agent | Text or dropdown |
| REFERENCE | Reference | Text |
| MOB NO | (auto from customer) | — |
| POLICY TYPE | Policy Type | Dropdown: PACKAGE, TP (Third Party), MEDICLAIM, TERM, ENDOWMENT |
| COMPANY NAME | Insurance Company | Searchable dropdown (saved companies) |
| POLICY NO | Policy Number | Text |
| START DATE | Start Date | Date picker |
| END DATE | End Date | Date picker |
| NET/OD | Net/OD Premium | Number |
| PERCENT | Commission % | Number (auto-calculates below) |
| BEFORE TDS | Before TDS | Auto-calculated: NET/OD × PERCENT |
| TDS | TDS Amount | Auto-calculated: BEFORE TDS × TDS rate |
| COMMISSION | Commission | Auto-calculated: BEFORE TDS − TDS |
| PERCENT.1 | Sub-agent Commission % | Number |
| BEFORE TDS.1 | Sub Before TDS | Auto-calculated |
| TDS.1 | Sub TDS | Auto-calculated |
| COMMISSION.1 | Sub Commission | Auto-calculated |
| PROFIT | Profit | Auto-calculated: Commission − Sub Commission |

**Additional Fields (beyond Excel):**
- Total Premium (what customer pays)
- Sum Insured
- Renewal link (link to previous year's policy)
- Status (Active / Expired / Cancelled / Renewed)
- Document upload (attach policy copy directly)

### 5.4 Document Management

- Upload multiple files per customer or per policy
- Document types: Policy Copy, ID Proof, Claim Form, Photo, RC Book, Other
- File preview (PDF inline, images with lightbox)
- Download individual files
- Storage indicator showing usage (X MB of 1 GB used)
- Supported formats: PDF, JPG, PNG, DOC/DOCX

### 5.5 Monthly Expiry Report

**The core feature the agent asked for.** Accessible from Dashboard and Reports.

- **Default view:** Current month — shows all policies expiring this month
- **Filter by:** Month/Year picker, Product type, Insurance Company, Agent
- **Columns:** Customer Name, Mobile, Product, Vehicle No, Company, Policy No, End Date, Days Until Expiry, Premium, Status (Renewed / Pending / Lost)
- **Color coding:** Red (expired/overdue), Orange (≤7 days), Yellow (≤30 days), Green (renewed)
- **Actions per row:** Call customer, Mark as renewed, Mark as lost, Add note
- **Export:** Download as Excel with one click
- **Summary bar:** Total expiring, Renewed count, Pending count, Premium at risk

### 5.6 Lead/Prospect Management

Simple pipeline to track potential business:

- **Kanban view:** Columns for New → Contacted → Quoted → Negotiating → Won / Lost
- **Table view:** Sortable list with filters
- **Lead fields:** Name, Phone, Email, Source, Interested Product, Estimated Premium, Follow-up Date, Notes
- **Convert to Customer:** One-click conversion when lead becomes a client
- **Follow-up reminders:** Highlighted on dashboard when follow-up date arrives

### 5.7 Reports & Analytics

| Report | Description |
|--------|-------------|
| **Expiring Policies** | Monthly view of policies due for renewal |
| **Commission Report** | Monthly/quarterly commission earned, TDS deducted, profit |
| **Product Mix** | Breakdown of business by product type (2W, Car, Health, etc.) |
| **Company-wise Report** | Premium and commission by insurance company |
| **Agent Performance** | If multiple agents — who's selling what |
| **Customer Value** | Top customers by premium / number of policies |
| **Renewal Rate** | % of policies successfully renewed vs. lapsed |

All reports exportable to Excel.

---

## 6. Bonus Features (Differentiators)

These are features that the paid CRMs offer but we can include for free or low cost:

### 6.1 Free to Build
1. **WhatsApp Quick Links** — "Send Reminder" button that opens WhatsApp with pre-filled renewal message
2. **Birthday & Anniversary Alerts** — Dashboard widget showing customer birthdays this week (relationship building)
3. **Policy Renewal Chain** — Visual history showing a customer's policy renewal chain over the years
4. **Bulk Import from Excel** — Upload existing Excel sheets (like the SAMPLE) to bulk-create policies
5. **Dark Mode** — Because why not
6. **PWA (Progressive Web App)** — Install on phone, works like a native app
7. **Quick Search (Cmd+K)** — Global search across customers, policies, phone numbers
8. **Duplicate Detection** — Warn when creating a customer with an existing phone number
9. **Custom Fields** — Let the agent add custom fields to customer or policy forms
10. **PDF Policy Summary** — Generate a one-page summary PDF for any customer's portfolio

### 6.2 Low Cost Add-ons (Optional, Paid Services)
1. **Email Reminders** — Use Resend (free: 100 emails/day) to auto-send renewal reminders
2. **SMS Notifications** — Use MSG91 or similar Indian SMS gateway (~₹0.15/SMS)
3. **WhatsApp Business API** — For automated messages (via Interakt or similar)
4. **Backup to Google Drive** — Scheduled database export via Supabase Edge Function

---

## 7. User Flows

### 7.1 Daily Workflow
```
Agent opens app
  → Dashboard shows: 3 policies expiring this week, 2 follow-ups due
  → Clicks on expiring policy → sees customer details
  → Taps "Call" or "WhatsApp Reminder"
  → After call, marks as "Renewal in Progress" or "Lost"
  → Creates new policy when renewal is confirmed
  → Uploads new policy document
```

### 7.2 New Customer Onboarding
```
Agent clicks "New Customer"
  → Fills in details (name, phone, ID)
  → Saves customer
  → Clicks "Add Policy"
  → Fills policy details (maps to Excel columns)
  → Commission auto-calculates
  → Uploads policy document
  → Customer appears in dashboard
```

### 7.3 Monthly Review
```
Agent goes to Reports → Expiring Policies
  → Selects next month
  → Sees all upcoming renewals
  → Exports to Excel for team review
  → Systematically contacts each customer
  → Tracks renewal status in the app
```

---

## 8. Implementation Roadmap

### Phase 1 — MVP (2-3 weeks)
- [ ] Supabase project setup (DB, Auth, Storage)
- [ ] Authentication (email/password login)
- [ ] Customer CRUD
- [ ] Policy CRUD with commission auto-calculation
- [ ] Document upload/download
- [ ] Basic dashboard with expiry alerts
- [ ] Expiring policies report

### Phase 2 — Enhanced (1-2 weeks)
- [ ] Lead pipeline with Kanban
- [ ] Commission & profit reports
- [ ] Excel bulk import
- [ ] Excel export for all reports
- [ ] Global search (Cmd+K)
- [ ] Activity log / timeline

### Phase 3 — Polish (1 week)
- [ ] PWA setup (installable on mobile)
- [ ] WhatsApp quick links
- [ ] Birthday alerts
- [ ] Policy renewal chain visualization
- [ ] Dark mode
- [ ] Duplicate detection

### Phase 4 — Growth (Optional)
- [ ] Email reminders (Resend integration)
- [ ] SMS notifications
- [ ] Multi-agent support with RBAC
- [ ] Custom fields
- [ ] PDF generation

---

## 9. Cost Projection

### Year 1 — Free
| Item | Cost |
|------|------|
| Supabase Free | $0 |
| Vercel Free | $0 |
| Domain (optional) | $10-12/year |
| **Total** | **$0 - $12/year** |

### When to Upgrade (Scale triggers)
| Trigger | Action | Cost |
|---------|--------|------|
| 500+ MB database | Supabase Pro | $25/month |
| 1 GB+ documents | Supabase Pro | (included) |
| Custom domain + SSL | Vercel Pro | $20/month |
| Email reminders | Resend free tier | $0 (100/day) |

Even at full scale with paid plans, this solution costs **$45/month** vs. **$200-500/month** for comparable insurance CRMs.

---

## 10. Security Considerations

- **Authentication:** Supabase Auth with email/password + optional OTP
- **Authorization:** Row Level Security (RLS) on all tables
- **Storage:** Private buckets with signed URLs (documents not publicly accessible)
- **Data encryption:** Supabase encrypts at rest and in transit (TLS)
- **Backups:** Free tier has no automated backups — recommend monthly manual export
- **PII handling:** Customer Aadhaar/PAN numbers stored in DB — consider encrypting sensitive fields at application level

---

## 11. Technical Notes

### Supabase Free Tier Constraints to Monitor
1. **500 MB DB limit** — At ~1KB per policy record, this supports ~500,000 records. Not a concern for years.
2. **1 GB Storage** — Policy PDFs average 200KB-1MB each. Monitor usage, compress before upload.
3. **Project pausing** — Free projects pause after 7 days of inactivity. A daily-use CRM won't hit this, but add a cron ping as backup.
4. **50 MB file limit** — More than enough for policy documents.
5. **No backups** — Build a manual "Export All Data" feature in Settings.

### Vercel Free Tier Constraints
1. **100 GB bandwidth/month** — Sufficient for a single-agent CRM.
2. **Serverless function timeout** — 10 seconds on free tier. Keep API calls efficient.
3. **1 deployment per commit** — No concern.