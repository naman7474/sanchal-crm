// ============================================================
// TypeScript types matching Supabase/Postgres Schema v2.0
// ============================================================

export interface Organization {
    id: string;
    name: string;
    slug: string;
    owner_id: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    logo_url: string | null;
    plan: "trial" | "free" | "pro" | "suspended";
    trial_ends_at: string | null;
    plan_active_until: string | null;
    activated_by: string | null;
    max_customers: number | null;
    max_storage_mb: number | null;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    org_id: string;
    full_name: string;
    role: "owner" | "admin" | "agent" | "staff" | "readonly";
    phone: string | null;
    email: string | null;
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Customer {
    id: string;
    org_id: string;
    created_by: string | null;
    customer_name: string;
    mobile_no: string | null;
    email: string | null;
    address: string | null;
    date_of_birth: string | null;
    id_type: string | null;
    id_number: string | null;
    status: "active" | "prospect" | "inactive" | "churned";
    source: string | null;
    reference_name: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Policy {
    id: string;
    org_id: string;
    customer_id: string;
    created_by: string | null;
    entry_date: string;
    product: string;
    vehicle_no: string | null;
    policy_type: string | null;
    company_name: string;
    policy_no: string | null;
    agent_name: string | null;
    reference: string | null;
    start_date: string;
    end_date: string;
    net_od_premium: number;
    commission_percent: number;
    before_tds: number;
    tds_amount: number;
    commission: number;
    sub_commission_percent: number;
    sub_before_tds: number;
    sub_tds_amount: number;
    sub_commission: number;
    profit: number;
    premium_amount: number | null;
    sum_insured: number | null;
    status: "active" | "expired" | "cancelled" | "renewed";
    renewal_of: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields (from queries)
    customer_name?: string;
    mobile_no?: string;
    customer_email?: string;
}

export interface Document {
    id: string;
    org_id: string;
    customer_id: string;
    policy_id: string | null;
    uploaded_by: string | null;
    document_type: string;
    document_name: string;
    file_path: string;
    file_size: number | null;
    mime_type: string | null;
    notes: string | null;
    created_at: string;
}

export interface Lead {
    id: string;
    org_id: string;
    customer_id: string | null;
    assigned_to: string | null;
    name: string;
    phone: string | null;
    email: string | null;
    source: string | null;
    referred_by: string | null;
    interested_product: string | null;
    estimated_premium: number | null;
    status: "new" | "contacted" | "quoted" | "negotiating" | "converted" | "lost";
    follow_up_date: string | null;
    last_contacted_at: string | null;
    notes: string | null;
    lost_reason: string | null;
    created_at: string;
    updated_at: string;
}

export interface ActivityLog {
    id: string;
    org_id: string;
    user_id: string | null;
    customer_id: string | null;
    policy_id: string | null;
    lead_id: string | null;
    action: string;
    description: string | null;
    created_at: string;
}

export interface InsuranceCompany {
    id: string;
    org_id: string;
    name: string;
    short_name: string | null;
    default_commission_percent: number | null;
    is_active: boolean;
}

export interface ProductType {
    id: string;
    org_id: string;
    name: string;
    category: string | null;
    requires_vehicle: boolean;
    is_active: boolean;
}

// View types
export interface ExpiringPolicy {
    id: string;
    org_id: string;
    customer_id: string;
    customer_name: string;
    mobile_no: string | null;
    customer_email: string | null;
    product: string;
    vehicle_no: string | null;
    policy_type: string | null;
    company_name: string;
    policy_no: string | null;
    start_date: string;
    end_date: string;
    net_od_premium: number;
    premium_amount: number | null;
    status: string;
    days_until_expiry: number;
    urgency: "EXPIRED" | "CRITICAL" | "EXPIRING_30" | "EXPIRING_60" | "EXPIRING_90";
}

export interface DashboardStats {
    org_id: string;
    active_policies: number;
    expiring_30: number;
    expired: number;
    current_month_premium: number | null;
    current_month_commission: number | null;
    current_month_profit: number | null;
}

export interface MonthlyCommission {
    org_id: string;
    month: string;
    total_policies: number;
    total_premium: number;
    total_commission: number;
    total_sub_commission: number;
    total_profit: number;
    total_tds: number;
}

// Form input types (for creates/updates — without auto-generated fields)
export type CustomerInput = Omit<Customer, "id" | "org_id" | "created_by" | "created_at" | "updated_at">;
export type PolicyInput = Omit<Policy, "id" | "org_id" | "created_by" | "created_at" | "updated_at" | "customer_name" | "mobile_no" | "customer_email">;
export type LeadInput = Omit<Lead, "id" | "org_id" | "created_at" | "updated_at">;
export type DocumentInput = Omit<Document, "id" | "org_id" | "uploaded_by" | "created_at">;
