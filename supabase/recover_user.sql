-- ==============================================================================
-- RECOVERY SCRIPT: Fix incomplete signups
-- Run this script in the Supabase SQL Editor to manually provision the
-- organization, profile, and lookup data for a user whose signup failed halfway.
-- ==============================================================================

DO $$
DECLARE
    -- !!! Replace these with the actual user's details !!!
    v_user_email TEXT := 'supreme.insurance6@gmail.com';  -- The email they used
    v_org_name TEXT := 'Supreme Insurance';               -- The agency name they entered
    v_full_name TEXT := 'Puneet';                         -- Their full name
    
    -- Variables to hold generated IDs
    v_user_id UUID;
    v_org_id UUID;
    v_slug TEXT;
BEGIN
    -- 1. Find the user ID from auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users', v_user_email;
    END IF;

    -- 2. Generate a unique slug for the organization
    v_slug := regexp_replace(lower(v_org_name), '[^a-z0-9]+', '-', 'g');
    v_slug := trim(both '-' from v_slug) || '-' || substr(md5(random()::text), 1, 6);

    -- 3. Create the Organization (owner_id is NULL initially to avoid FK constraint)
    INSERT INTO organizations (name, slug, email)
    VALUES (v_org_name, v_slug, v_user_email)
    RETURNING id INTO v_org_id;

    -- 4. Create the Profile
    INSERT INTO profiles (id, org_id, full_name, role, email)
    VALUES (v_user_id, v_org_id, v_full_name, 'owner', v_user_email);

    -- 5. Set the Organization owner
    UPDATE organizations SET owner_id = v_user_id WHERE id = v_org_id;

    -- 5. Seed Product Types
    INSERT INTO product_types (org_id, name, category, requires_vehicle) VALUES
    (v_org_id, '2W', 'motor', true),
    (v_org_id, 'PVT CAR', 'motor', true),
    (v_org_id, 'COMMERCIAL VEHICLE', 'motor', true),
    (v_org_id, 'HEALTH', 'health', false),
    (v_org_id, 'LIFE', 'life', false),
    (v_org_id, 'TERM', 'life', false),
    (v_org_id, 'TRAVEL', 'general', false),
    (v_org_id, 'FIRE', 'general', false),
    (v_org_id, 'MARINE', 'general', false),
    (v_org_id, 'PA (Personal Accident)', 'general', false);

    -- 6. Seed Insurance Companies
    INSERT INTO insurance_companies (org_id, name, short_name) VALUES
    (v_org_id, 'GO DIGIT GENERAL INSURANCE', 'Go Digit'),
    (v_org_id, 'RELIANCE GENERAL INSURANCE', 'Reliance'),
    (v_org_id, 'ZURICH KOTAK GENERAL INSURANCE', 'Zurich Kotak'),
    (v_org_id, 'SHRIRAM GENERAL INSURANCE', 'Shriram'),
    (v_org_id, 'ICICI LOMBARD', 'ICICI Lombard'),
    (v_org_id, 'HDFC ERGO', 'HDFC Ergo'),
    (v_org_id, 'BAJAJ ALLIANZ', 'Bajaj Allianz'),
    (v_org_id, 'TATA AIG', 'Tata AIG'),
    (v_org_id, 'NEW INDIA ASSURANCE', 'New India'),
    (v_org_id, 'UNITED INDIA INSURANCE', 'United India'),
    (v_org_id, 'NATIONAL INSURANCE', 'National'),
    (v_org_id, 'LIC', 'LIC'),
    (v_org_id, 'SBI LIFE', 'SBI Life'),
    (v_org_id, 'MAX LIFE', 'Max Life'),
    (v_org_id, 'STAR HEALTH', 'Star Health');

    RAISE NOTICE 'Successfully recovered account for % (Org ID: %)', v_user_email, v_org_id;
END $$;
