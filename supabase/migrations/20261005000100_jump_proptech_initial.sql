-- Jump PropTech initial production schema.
-- This migration creates a dedicated schema and never drops or rewrites existing objects.
-- Expose `jump_proptech` in Supabase API settings after applying this migration.
BEGIN;

CREATE SCHEMA IF NOT EXISTS jump_proptech;
CREATE SCHEMA IF NOT EXISTS jump_proptech_private;

REVOKE ALL ON SCHEMA jump_proptech FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA jump_proptech TO authenticated;
REVOKE ALL ON SCHEMA jump_proptech_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA jump_proptech_private TO authenticated;

CREATE TABLE IF NOT EXISTS jump_proptech.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  currency text NOT NULL DEFAULT 'ZAR' CHECK (currency = 'ZAR'),
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jump_proptech.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jump_proptech.organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email text,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'tenant', 'handyman')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'revoked')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS organization_memberships_user_status_idx
  ON jump_proptech.organization_memberships (user_id, status);
CREATE INDEX IF NOT EXISTS organization_memberships_invited_by_idx
  ON jump_proptech.organization_memberships (invited_by);

CREATE TABLE IF NOT EXISTS jump_proptech.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  property_type text NOT NULL,
  address text NOT NULL,
  suburb text,
  city text NOT NULL,
  province text NOT NULL,
  postal_code text,
  description text,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS properties_organization_idx ON jump_proptech.properties (organization_id);
CREATE INDEX IF NOT EXISTS properties_created_by_idx ON jump_proptech.properties (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.property_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner', 'manager')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, user_id)
);
CREATE INDEX IF NOT EXISTS property_memberships_user_status_idx
  ON jump_proptech.property_memberships (user_id, status);
CREATE INDEX IF NOT EXISTS property_memberships_organization_idx
  ON jump_proptech.property_memberships (organization_id);
CREATE INDEX IF NOT EXISTS property_memberships_granted_by_idx
  ON jump_proptech.property_memberships (granted_by);

CREATE TABLE IF NOT EXISTS jump_proptech.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  unit_number text NOT NULL CHECK (length(btrim(unit_number)) > 0),
  unit_type text NOT NULL,
  monthly_rent numeric(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_rent >= 0),
  occupancy_status text NOT NULL DEFAULT 'Vacant' CHECK (occupancy_status IN ('Vacant', 'Occupied', 'Maintenance')),
  current_tenant_id uuid,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS units_property_number_uq
  ON jump_proptech.units (property_id, lower(btrim(unit_number)));
CREATE INDEX IF NOT EXISTS units_organization_idx ON jump_proptech.units (organization_id);
CREATE INDEX IF NOT EXISTS units_property_idx ON jump_proptech.units (property_id);
CREATE INDEX IF NOT EXISTS units_current_tenant_idx ON jump_proptech.units (current_tenant_id);
CREATE INDEX IF NOT EXISTS units_created_by_idx ON jump_proptech.units (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL CHECK (length(btrim(display_name)) > 0),
  email text,
  phone text,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS owners_organization_idx ON jump_proptech.owners (organization_id);
CREATE INDEX IF NOT EXISTS owners_user_idx ON jump_proptech.owners (user_id);
CREATE INDEX IF NOT EXISTS owners_created_by_idx ON jump_proptech.owners (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.property_ownership_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  owner_id uuid NOT NULL REFERENCES jump_proptech.owners(id) ON DELETE RESTRICT,
  share_percentage numeric(5, 2) NOT NULL CHECK (share_percentage > 0 AND share_percentage <= 100),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, owner_id)
);
CREATE INDEX IF NOT EXISTS ownership_shares_organization_idx
  ON jump_proptech.property_ownership_shares (organization_id);
CREATE INDEX IF NOT EXISTS ownership_shares_property_idx
  ON jump_proptech.property_ownership_shares (property_id);
CREATE INDEX IF NOT EXISTS ownership_shares_owner_idx
  ON jump_proptech.property_ownership_shares (owner_id);
CREATE INDEX IF NOT EXISTS ownership_shares_created_by_idx
  ON jump_proptech.property_ownership_shares (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL CHECK (length(btrim(first_name)) > 0),
  last_name text NOT NULL CHECK (length(btrim(last_name)) > 0),
  email text,
  phone text NOT NULL CHECK (length(btrim(phone)) > 0),
  whatsapp_number text,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenants_organization_idx ON jump_proptech.tenants (organization_id);
CREATE INDEX IF NOT EXISTS tenants_user_idx ON jump_proptech.tenants (user_id);
CREATE INDEX IF NOT EXISTS tenants_created_by_idx ON jump_proptech.tenants (created_by);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_organization_email_uq
  ON jump_proptech.tenants (organization_id, lower(btrim(email)))
  WHERE email IS NOT NULL AND length(btrim(email)) > 0;
CREATE UNIQUE INDEX IF NOT EXISTS tenants_organization_phone_uq
  ON jump_proptech.tenants (organization_id, regexp_replace(phone, '\D', '', 'g'))
  WHERE length(regexp_replace(phone, '\D', '', 'g')) > 0;

ALTER TABLE jump_proptech.units
  ADD CONSTRAINT units_current_tenant_fk
  FOREIGN KEY (current_tenant_id) REFERENCES jump_proptech.tenants(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS jump_proptech.tenant_private_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  tenant_id uuid NOT NULL UNIQUE REFERENCES jump_proptech.tenants(id) ON DELETE RESTRICT,
  id_number_or_passport text,
  emergency_contact text,
  next_of_kin text,
  employer text,
  notes text,
  processing_purpose text NOT NULL DEFAULT 'tenancy-management'
    CHECK (processing_purpose = 'tenancy-management'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenant_private_details_organization_idx
  ON jump_proptech.tenant_private_details (organization_id);
CREATE INDEX IF NOT EXISTS tenant_private_details_tenant_idx
  ON jump_proptech.tenant_private_details (tenant_id);
CREATE INDEX IF NOT EXISTS tenant_private_details_created_by_idx
  ON jump_proptech.tenant_private_details (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES jump_proptech.units(id) ON DELETE RESTRICT,
  tenant_id uuid NOT NULL REFERENCES jump_proptech.tenants(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Declined', 'Withdrawn')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_notes text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS applications_organization_idx ON jump_proptech.applications (organization_id);
CREATE INDEX IF NOT EXISTS applications_property_status_idx ON jump_proptech.applications (property_id, status);
CREATE INDEX IF NOT EXISTS applications_unit_idx ON jump_proptech.applications (unit_id);
CREATE INDEX IF NOT EXISTS applications_tenant_status_idx ON jump_proptech.applications (tenant_id, status);
CREATE INDEX IF NOT EXISTS applications_reviewed_by_idx ON jump_proptech.applications (reviewed_by);

CREATE TABLE IF NOT EXISTS jump_proptech.tenancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES jump_proptech.units(id) ON DELETE RESTRICT,
  tenant_id uuid NOT NULL REFERENCES jump_proptech.tenants(id) ON DELETE RESTRICT,
  application_id uuid REFERENCES jump_proptech.applications(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('Application', 'Active', 'Notice given', 'Ended')),
  move_in_date date NOT NULL,
  lease_start date NOT NULL,
  lease_end date NOT NULL,
  monthly_rent numeric(12, 2) NOT NULL CHECK (monthly_rent >= 0),
  deposit_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  payment_due_day smallint NOT NULL DEFAULT 1 CHECK (payment_due_day BETWEEN 1 AND 31),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (lease_end >= lease_start),
  CHECK (move_in_date <= lease_end),
  UNIQUE (id, organization_id, tenant_id, property_id, unit_id)
);
CREATE INDEX IF NOT EXISTS tenancies_organization_idx ON jump_proptech.tenancies (organization_id);
CREATE INDEX IF NOT EXISTS tenancies_property_status_idx ON jump_proptech.tenancies (property_id, status);
CREATE INDEX IF NOT EXISTS tenancies_unit_status_idx ON jump_proptech.tenancies (unit_id, status);
CREATE INDEX IF NOT EXISTS tenancies_tenant_status_idx ON jump_proptech.tenancies (tenant_id, status);
CREATE INDEX IF NOT EXISTS tenancies_application_idx ON jump_proptech.tenancies (application_id);
CREATE INDEX IF NOT EXISTS tenancies_created_by_idx ON jump_proptech.tenancies (created_by);
CREATE UNIQUE INDEX IF NOT EXISTS tenancies_one_current_per_unit_uq
  ON jump_proptech.tenancies (unit_id)
  WHERE status IN ('Active', 'Notice given');

CREATE TABLE IF NOT EXISTS jump_proptech.leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  tenancy_id uuid NOT NULL REFERENCES jump_proptech.tenancies(id) ON DELETE RESTRICT,
  lease_number text,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Signed', 'Expired', 'Terminated')),
  effective_start date NOT NULL,
  effective_end date NOT NULL,
  signed_at timestamptz,
  signed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_end >= effective_start)
);
CREATE INDEX IF NOT EXISTS leases_organization_idx ON jump_proptech.leases (organization_id);
CREATE INDEX IF NOT EXISTS leases_tenancy_idx ON jump_proptech.leases (tenancy_id);
CREATE INDEX IF NOT EXISTS leases_signed_by_idx ON jump_proptech.leases (signed_by);
CREATE INDEX IF NOT EXISTS leases_created_by_idx ON jump_proptech.leases (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.rent_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  tenancy_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  property_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  invoice_number text NOT NULL,
  invoice_type text NOT NULL DEFAULT 'Rent' CHECK (invoice_type IN ('Rent', 'Deposit', 'Other')),
  period_start date,
  period_end date,
  due_date date NOT NULL,
  total_amount numeric(12, 2) NOT NULL CHECK (total_amount > 0),
  currency text NOT NULL DEFAULT 'ZAR' CHECK (currency = 'ZAR'),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Paid', 'Void')),
  void_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenancy_id, organization_id, tenant_id, property_id, unit_id)
    REFERENCES jump_proptech.tenancies (id, organization_id, tenant_id, property_id, unit_id)
    ON DELETE RESTRICT,
  UNIQUE (organization_id, invoice_number),
  UNIQUE (id, organization_id, tenant_id),
  CHECK (period_end IS NULL OR period_start IS NULL OR period_end >= period_start),
  CHECK (status <> 'Void' OR length(btrim(coalesce(void_reason, ''))) > 0)
);
CREATE INDEX IF NOT EXISTS rent_invoices_organization_idx ON jump_proptech.rent_invoices (organization_id);
CREATE INDEX IF NOT EXISTS rent_invoices_property_due_idx ON jump_proptech.rent_invoices (property_id, due_date);
CREATE INDEX IF NOT EXISTS rent_invoices_unit_idx ON jump_proptech.rent_invoices (unit_id);
CREATE INDEX IF NOT EXISTS rent_invoices_tenancy_period_idx ON jump_proptech.rent_invoices (tenancy_id, period_start);
CREATE INDEX IF NOT EXISTS rent_invoices_tenant_due_idx ON jump_proptech.rent_invoices (tenant_id, due_date);
CREATE INDEX IF NOT EXISTS rent_invoices_created_by_idx ON jump_proptech.rent_invoices (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  tenant_id uuid NOT NULL REFERENCES jump_proptech.tenants(id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'ZAR' CHECK (currency = 'ZAR'),
  payment_method text NOT NULL CHECK (payment_method IN ('Cash', 'EFT', 'Bank transfer', 'Other')),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Recorded', 'Failed', 'Reversed')),
  received_at timestamptz,
  reference text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS payments_organization_idx ON jump_proptech.payments (organization_id);
CREATE INDEX IF NOT EXISTS payments_tenant_received_idx ON jump_proptech.payments (tenant_id, received_at);
CREATE INDEX IF NOT EXISTS payments_recorded_by_idx ON jump_proptech.payments (recorded_by);

CREATE TABLE IF NOT EXISTS jump_proptech.payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (payment_id, organization_id, tenant_id)
    REFERENCES jump_proptech.payments (id, organization_id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (invoice_id, organization_id, tenant_id)
    REFERENCES jump_proptech.rent_invoices (id, organization_id, tenant_id) ON DELETE RESTRICT,
  UNIQUE (payment_id, invoice_id)
);
CREATE INDEX IF NOT EXISTS payment_allocations_organization_idx
  ON jump_proptech.payment_allocations (organization_id);
CREATE INDEX IF NOT EXISTS payment_allocations_payment_idx
  ON jump_proptech.payment_allocations (payment_id);
CREATE INDEX IF NOT EXISTS payment_allocations_invoice_idx
  ON jump_proptech.payment_allocations (invoice_id);
CREATE INDEX IF NOT EXISTS payment_allocations_tenant_idx
  ON jump_proptech.payment_allocations (tenant_id);
CREATE INDEX IF NOT EXISTS payment_allocations_created_by_idx
  ON jump_proptech.payment_allocations (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL UNIQUE,
  tenant_id uuid NOT NULL,
  receipt_number text NOT NULL,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Issued', 'Void')),
  issued_at timestamptz,
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (payment_id, organization_id, tenant_id)
    REFERENCES jump_proptech.payments (id, organization_id, tenant_id) ON DELETE RESTRICT,
  UNIQUE (organization_id, receipt_number)
);
CREATE INDEX IF NOT EXISTS receipts_organization_idx ON jump_proptech.receipts (organization_id);
CREATE INDEX IF NOT EXISTS receipts_tenant_idx ON jump_proptech.receipts (tenant_id);
CREATE INDEX IF NOT EXISTS receipts_issued_by_idx ON jump_proptech.receipts (issued_by);

CREATE TABLE IF NOT EXISTS jump_proptech.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  unit_id uuid REFERENCES jump_proptech.units(id) ON DELETE RESTRICT,
  category text NOT NULL,
  supplier text,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'ZAR' CHECK (currency = 'ZAR'),
  incurred_at date NOT NULL,
  voided_at timestamptz,
  void_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (voided_at IS NULL OR length(btrim(coalesce(void_reason, ''))) > 0)
);
CREATE INDEX IF NOT EXISTS expenses_organization_idx ON jump_proptech.expenses (organization_id);
CREATE INDEX IF NOT EXISTS expenses_property_date_idx ON jump_proptech.expenses (property_id, incurred_at);
CREATE INDEX IF NOT EXISTS expenses_unit_idx ON jump_proptech.expenses (unit_id);
CREATE INDEX IF NOT EXISTS expenses_created_by_idx ON jump_proptech.expenses (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  trade text,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contractors_organization_idx ON jump_proptech.contractors (organization_id);
CREATE INDEX IF NOT EXISTS contractors_user_idx ON jump_proptech.contractors (user_id);
CREATE INDEX IF NOT EXISTS contractors_created_by_idx ON jump_proptech.contractors (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.maintenance_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES jump_proptech.units(id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES jump_proptech.tenants(id) ON DELETE RESTRICT,
  assigned_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contractor_id uuid REFERENCES jump_proptech.contractors(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Assigned', 'In progress', 'Resolved', 'Cancelled')),
  handyman_notes text,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS maintenance_organization_idx ON jump_proptech.maintenance_tickets (organization_id);
CREATE INDEX IF NOT EXISTS maintenance_property_status_idx ON jump_proptech.maintenance_tickets (property_id, status);
CREATE INDEX IF NOT EXISTS maintenance_unit_idx ON jump_proptech.maintenance_tickets (unit_id);
CREATE INDEX IF NOT EXISTS maintenance_tenant_idx ON jump_proptech.maintenance_tickets (tenant_id);
CREATE INDEX IF NOT EXISTS maintenance_assigned_status_idx
  ON jump_proptech.maintenance_tickets (assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS maintenance_contractor_idx ON jump_proptech.maintenance_tickets (contractor_id);
CREATE INDEX IF NOT EXISTS maintenance_created_by_idx ON jump_proptech.maintenance_tickets (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES jump_proptech.units(id) ON DELETE RESTRICT,
  tenancy_id uuid REFERENCES jump_proptech.tenancies(id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES jump_proptech.tenants(id) ON DELETE RESTRICT,
  inspection_type text NOT NULL CHECK (inspection_type IN ('Incoming', 'Routine', 'Outgoing', 'Other')),
  status text NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In progress', 'Completed', 'Cancelled')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inspections_organization_idx ON jump_proptech.inspections (organization_id);
CREATE INDEX IF NOT EXISTS inspections_property_date_idx ON jump_proptech.inspections (property_id, scheduled_at);
CREATE INDEX IF NOT EXISTS inspections_unit_idx ON jump_proptech.inspections (unit_id);
CREATE INDEX IF NOT EXISTS inspections_tenancy_idx ON jump_proptech.inspections (tenancy_id);
CREATE INDEX IF NOT EXISTS inspections_tenant_idx ON jump_proptech.inspections (tenant_id);
CREATE INDEX IF NOT EXISTS inspections_created_by_idx ON jump_proptech.inspections (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  unit_id uuid REFERENCES jump_proptech.units(id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES jump_proptech.tenants(id) ON DELETE RESTRICT,
  application_id uuid REFERENCES jump_proptech.applications(id) ON DELETE RESTRICT,
  tenancy_id uuid REFERENCES jump_proptech.tenancies(id) ON DELETE RESTRICT,
  lease_id uuid REFERENCES jump_proptech.leases(id) ON DELETE RESTRICT,
  maintenance_ticket_id uuid REFERENCES jump_proptech.maintenance_tickets(id) ON DELETE RESTRICT,
  expense_id uuid REFERENCES jump_proptech.expenses(id) ON DELETE RESTRICT,
  inspection_id uuid REFERENCES jump_proptech.inspections(id) ON DELETE RESTRICT,
  document_type text NOT NULL CHECK (document_type IN ('Tenant identity', 'Lease', 'Application', 'Inspection', 'Maintenance', 'Expense', 'Other')),
  original_file_name text NOT NULL,
  content_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  storage_bucket text NOT NULL DEFAULT 'jump-proptech-private'
    CHECK (storage_bucket = 'jump-proptech-private'),
  storage_path text NOT NULL UNIQUE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(property_id, unit_id, tenant_id, application_id, tenancy_id, lease_id, maintenance_ticket_id, expense_id, inspection_id) > 0)
);
CREATE INDEX IF NOT EXISTS documents_organization_idx ON jump_proptech.documents (organization_id);
CREATE INDEX IF NOT EXISTS documents_property_idx ON jump_proptech.documents (property_id);
CREATE INDEX IF NOT EXISTS documents_unit_idx ON jump_proptech.documents (unit_id);
CREATE INDEX IF NOT EXISTS documents_tenant_idx ON jump_proptech.documents (tenant_id);
CREATE INDEX IF NOT EXISTS documents_application_idx ON jump_proptech.documents (application_id);
CREATE INDEX IF NOT EXISTS documents_tenancy_idx ON jump_proptech.documents (tenancy_id);
CREATE INDEX IF NOT EXISTS documents_lease_idx ON jump_proptech.documents (lease_id);
CREATE INDEX IF NOT EXISTS documents_maintenance_idx ON jump_proptech.documents (maintenance_ticket_id);
CREATE INDEX IF NOT EXISTS documents_expense_idx ON jump_proptech.documents (expense_id);
CREATE INDEX IF NOT EXISTS documents_inspection_idx ON jump_proptech.documents (inspection_id);
CREATE INDEX IF NOT EXISTS documents_uploaded_by_idx ON jump_proptech.documents (uploaded_by);

CREATE TABLE IF NOT EXISTS jump_proptech.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  read_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_organization_idx ON jump_proptech.notifications (organization_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_read_created_idx
  ON jump_proptech.notifications (recipient_user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_created_by_idx ON jump_proptech.notifications (created_by);

CREATE TABLE IF NOT EXISTS jump_proptech.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES jump_proptech.organizations(id) ON DELETE RESTRICT,
  property_id uuid REFERENCES jump_proptech.properties(id) ON DELETE RESTRICT,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_fields text[] NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_organization_time_idx
  ON jump_proptech.audit_logs (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_property_time_idx
  ON jump_proptech.audit_logs (property_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_time_idx
  ON jump_proptech.audit_logs (actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_record_idx
  ON jump_proptech.audit_logs (table_name, record_id, occurred_at DESC);

-- Composite keys prevent a valid row in one organization from being linked to a
-- property, tenant, unit, or contractor in another organization.
ALTER TABLE jump_proptech.organization_memberships
  ADD CONSTRAINT organization_memberships_org_user_uq UNIQUE (organization_id, user_id);
ALTER TABLE jump_proptech.properties
  ADD CONSTRAINT properties_id_organization_uq UNIQUE (id, organization_id);
ALTER TABLE jump_proptech.property_memberships
  ADD CONSTRAINT property_memberships_property_organization_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES jump_proptech.properties (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.units
  ADD CONSTRAINT units_id_organization_uq UNIQUE (id, organization_id),
  ADD CONSTRAINT units_id_organization_property_uq UNIQUE (id, organization_id, property_id),
  ADD CONSTRAINT units_property_organization_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES jump_proptech.properties (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.owners
  ADD CONSTRAINT owners_id_organization_uq UNIQUE (id, organization_id);
ALTER TABLE jump_proptech.property_ownership_shares
  ADD CONSTRAINT ownership_shares_property_organization_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES jump_proptech.properties (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT ownership_shares_owner_organization_fk
  FOREIGN KEY (owner_id, organization_id)
  REFERENCES jump_proptech.owners (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.tenants
  ADD CONSTRAINT tenants_id_organization_uq UNIQUE (id, organization_id);
ALTER TABLE jump_proptech.units
  ADD CONSTRAINT units_current_tenant_organization_fk
  FOREIGN KEY (current_tenant_id, organization_id)
  REFERENCES jump_proptech.tenants (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.payments
  ADD CONSTRAINT payments_tenant_organization_fk
  FOREIGN KEY (tenant_id, organization_id)
  REFERENCES jump_proptech.tenants (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.tenant_private_details
  ADD CONSTRAINT tenant_private_details_tenant_organization_fk
  FOREIGN KEY (tenant_id, organization_id)
  REFERENCES jump_proptech.tenants (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.applications
  ADD CONSTRAINT applications_id_organization_uq UNIQUE (id, organization_id),
  ADD CONSTRAINT applications_id_org_tenant_property_unit_uq
  UNIQUE (id, organization_id, tenant_id, property_id, unit_id),
  ADD CONSTRAINT applications_property_organization_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES jump_proptech.properties (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT applications_unit_property_organization_fk
  FOREIGN KEY (unit_id, organization_id, property_id)
  REFERENCES jump_proptech.units (id, organization_id, property_id) ON DELETE RESTRICT,
  ADD CONSTRAINT applications_tenant_organization_fk
  FOREIGN KEY (tenant_id, organization_id)
  REFERENCES jump_proptech.tenants (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.tenancies
  ADD CONSTRAINT tenancies_id_organization_uq UNIQUE (id, organization_id),
  ADD CONSTRAINT tenancies_id_org_tenant_uq UNIQUE (id, organization_id, tenant_id),
  ADD CONSTRAINT tenancies_property_organization_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES jump_proptech.properties (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT tenancies_unit_property_organization_fk
  FOREIGN KEY (unit_id, organization_id, property_id)
  REFERENCES jump_proptech.units (id, organization_id, property_id) ON DELETE RESTRICT,
  ADD CONSTRAINT tenancies_tenant_organization_fk
  FOREIGN KEY (tenant_id, organization_id)
  REFERENCES jump_proptech.tenants (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT tenancies_application_scope_fk
  FOREIGN KEY (application_id, organization_id, tenant_id, property_id, unit_id)
  REFERENCES jump_proptech.applications (id, organization_id, tenant_id, property_id, unit_id)
  ON DELETE RESTRICT;
ALTER TABLE jump_proptech.leases
  ADD CONSTRAINT leases_id_organization_uq UNIQUE (id, organization_id),
  ADD CONSTRAINT leases_tenancy_organization_fk
  FOREIGN KEY (tenancy_id, organization_id)
  REFERENCES jump_proptech.tenancies (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.expenses
  ADD CONSTRAINT expenses_id_organization_uq UNIQUE (id, organization_id),
  ADD CONSTRAINT expenses_property_organization_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES jump_proptech.properties (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT expenses_unit_property_organization_fk
  FOREIGN KEY (unit_id, organization_id, property_id)
  REFERENCES jump_proptech.units (id, organization_id, property_id) ON DELETE RESTRICT,
  ADD CONSTRAINT expenses_unit_requires_property_ck CHECK (unit_id IS NULL OR property_id IS NOT NULL);
ALTER TABLE jump_proptech.contractors
  ADD CONSTRAINT contractors_id_organization_uq UNIQUE (id, organization_id);
ALTER TABLE jump_proptech.maintenance_tickets
  ADD CONSTRAINT maintenance_id_organization_uq UNIQUE (id, organization_id),
  ADD CONSTRAINT maintenance_property_organization_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES jump_proptech.properties (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT maintenance_unit_property_organization_fk
  FOREIGN KEY (unit_id, organization_id, property_id)
  REFERENCES jump_proptech.units (id, organization_id, property_id) ON DELETE RESTRICT,
  ADD CONSTRAINT maintenance_tenant_organization_fk
  FOREIGN KEY (tenant_id, organization_id)
  REFERENCES jump_proptech.tenants (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT maintenance_contractor_organization_fk
  FOREIGN KEY (contractor_id, organization_id)
  REFERENCES jump_proptech.contractors (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.inspections
  ADD CONSTRAINT inspections_id_organization_uq UNIQUE (id, organization_id),
  ADD CONSTRAINT inspections_property_organization_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES jump_proptech.properties (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT inspections_unit_property_organization_fk
  FOREIGN KEY (unit_id, organization_id, property_id)
  REFERENCES jump_proptech.units (id, organization_id, property_id) ON DELETE RESTRICT,
  ADD CONSTRAINT inspections_tenancy_organization_fk
  FOREIGN KEY (tenancy_id, organization_id)
  REFERENCES jump_proptech.tenancies (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT inspections_tenant_organization_fk
  FOREIGN KEY (tenant_id, organization_id)
  REFERENCES jump_proptech.tenants (id, organization_id) ON DELETE RESTRICT;
ALTER TABLE jump_proptech.documents
  ADD CONSTRAINT documents_property_organization_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES jump_proptech.properties (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT documents_unit_property_organization_fk
  FOREIGN KEY (unit_id, organization_id, property_id)
  REFERENCES jump_proptech.units (id, organization_id, property_id) ON DELETE RESTRICT,
  ADD CONSTRAINT documents_tenant_organization_fk
  FOREIGN KEY (tenant_id, organization_id)
  REFERENCES jump_proptech.tenants (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT documents_application_organization_fk
  FOREIGN KEY (application_id, organization_id)
  REFERENCES jump_proptech.applications (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT documents_tenancy_tenant_organization_fk
  FOREIGN KEY (tenancy_id, organization_id, tenant_id)
  REFERENCES jump_proptech.tenancies (id, organization_id, tenant_id) ON DELETE RESTRICT,
  ADD CONSTRAINT documents_lease_organization_fk
  FOREIGN KEY (lease_id, organization_id)
  REFERENCES jump_proptech.leases (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT documents_maintenance_organization_fk
  FOREIGN KEY (maintenance_ticket_id, organization_id)
  REFERENCES jump_proptech.maintenance_tickets (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT documents_expense_organization_fk
  FOREIGN KEY (expense_id, organization_id)
  REFERENCES jump_proptech.expenses (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT documents_inspection_organization_fk
  FOREIGN KEY (inspection_id, organization_id)
  REFERENCES jump_proptech.inspections (id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT documents_unit_requires_property_ck CHECK (unit_id IS NULL OR property_id IS NOT NULL),
  ADD CONSTRAINT documents_tenancy_requires_tenant_ck CHECK (tenancy_id IS NULL OR tenant_id IS NOT NULL);
ALTER TABLE jump_proptech.notifications
  ADD CONSTRAINT notifications_recipient_membership_fk
  FOREIGN KEY (organization_id, recipient_user_id)
  REFERENCES jump_proptech.organization_memberships (organization_id, user_id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION jump_proptech_private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_after jsonb;
  v_before jsonb;
  v_row jsonb;
  v_org_id uuid;
  v_property_id uuid;
  v_record_id uuid;
  v_changed_fields text[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_row := to_jsonb(OLD);
    v_before := v_row;
    v_after := '{}'::jsonb;
  ELSIF TG_OP = 'INSERT' THEN
    v_row := to_jsonb(NEW);
    v_before := '{}'::jsonb;
    v_after := v_row;
  ELSE
    v_row := to_jsonb(NEW);
    v_before := to_jsonb(OLD);
    v_after := v_row;
  END IF;

  v_org_id := nullif(v_row ->> 'organization_id', '')::uuid;
  v_property_id := nullif(v_row ->> 'property_id', '')::uuid;
  v_record_id := nullif(v_row ->> 'id', '')::uuid;
  IF TG_TABLE_NAME = 'organizations' THEN
    v_org_id := v_record_id;
  END IF;

  SELECT coalesce(array_agg(k ORDER BY k), '{}')
    INTO v_changed_fields
    FROM jsonb_object_keys(v_after) AS keys(k)
   WHERE v_before -> k IS DISTINCT FROM v_after -> k;

  INSERT INTO jump_proptech.audit_logs (
    organization_id, property_id, actor_user_id, table_name, record_id, action, changed_fields
  ) VALUES (
    v_org_id, v_property_id, auth.uid(), TG_TABLE_NAME, v_record_id, TG_OP, coalesce(v_changed_fields, '{}')
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.is_org_member(p_organization_id uuid, p_roles text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.organization_memberships m
     WHERE m.organization_id = p_organization_id
       AND m.user_id = (SELECT auth.uid())
       AND m.status = 'active'
       AND (p_roles IS NULL OR m.role = ANY (p_roles))
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.is_org_owner(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jump_proptech_private.is_org_member(p_organization_id, ARRAY['owner']::text[]);
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_manage_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.properties p
      JOIN jump_proptech.organization_memberships om
        ON om.organization_id = p.organization_id
       AND om.user_id = (SELECT auth.uid())
       AND om.status = 'active'
       AND om.role = 'owner'
     WHERE p.id = p_property_id
  ) OR EXISTS (
    SELECT 1
      FROM jump_proptech.property_memberships pm
      JOIN jump_proptech.organization_memberships om
        ON om.organization_id = pm.organization_id
       AND om.user_id = pm.user_id
       AND om.status = 'active'
       AND om.role IN ('owner', 'manager')
     WHERE pm.property_id = p_property_id
       AND pm.user_id = (SELECT auth.uid())
       AND pm.status = 'active'
       AND pm.role IN ('owner', 'manager')
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_manage_any_org_property(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.properties p
     WHERE p.organization_id = p_organization_id
       AND jump_proptech_private.can_manage_property(p.id)
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.is_tenant_user(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.tenants t
     WHERE t.id = p_tenant_id
       AND t.user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_manage_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.tenancies t
     WHERE t.tenant_id = p_tenant_id
       AND jump_proptech_private.can_manage_property(t.property_id)
  ) OR EXISTS (
    SELECT 1
      FROM jump_proptech.applications a
     WHERE a.tenant_id = p_tenant_id
       AND jump_proptech_private.can_manage_property(a.property_id)
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_access_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jump_proptech_private.is_tenant_user(p_tenant_id)
      OR jump_proptech_private.can_manage_tenant(p_tenant_id);
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_access_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jump_proptech_private.can_manage_property(p_property_id)
      OR EXISTS (
        SELECT 1
          FROM jump_proptech.tenancies t
          JOIN jump_proptech.tenants tenant ON tenant.id = t.tenant_id
         WHERE t.property_id = p_property_id
           AND t.status IN ('Active', 'Notice given')
           AND tenant.user_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1
          FROM jump_proptech.maintenance_tickets mt
          JOIN jump_proptech.organization_memberships om
            ON om.organization_id = mt.organization_id
           AND om.user_id = (SELECT auth.uid())
           AND om.status = 'active'
           AND om.role = 'handyman'
         WHERE mt.property_id = p_property_id
           AND mt.assigned_to_user_id = (SELECT auth.uid())
      );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_access_tenancy(p_tenancy_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.tenancies t
     WHERE t.id = p_tenancy_id
       AND (
         jump_proptech_private.can_manage_property(t.property_id)
         OR jump_proptech_private.is_tenant_user(t.tenant_id)
       )
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_access_ticket(p_ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.maintenance_tickets mt
     WHERE mt.id = p_ticket_id
       AND (
         jump_proptech_private.can_manage_property(mt.property_id)
         OR (mt.tenant_id IS NOT NULL AND jump_proptech_private.is_tenant_user(mt.tenant_id))
         OR (
           mt.assigned_to_user_id = (SELECT auth.uid())
           AND jump_proptech_private.is_org_member(mt.organization_id, ARRAY['handyman']::text[])
         )
       )
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_access_owner(p_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.owners o
     WHERE o.id = p_owner_id
       AND o.user_id = (SELECT auth.uid())
  ) OR EXISTS (
    SELECT 1
      FROM jump_proptech.property_ownership_shares s
     WHERE s.owner_id = p_owner_id
       AND jump_proptech_private.can_manage_property(s.property_id)
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_access_document(p_document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.documents d
     WHERE d.id = p_document_id
       AND (
         (d.property_id IS NOT NULL AND jump_proptech_private.can_manage_property(d.property_id))
         OR (d.tenant_id IS NOT NULL AND jump_proptech_private.is_tenant_user(d.tenant_id))
         OR (
           d.tenant_id IS NOT NULL
           AND d.document_type <> 'Tenant identity'
           AND jump_proptech_private.can_manage_tenant(d.tenant_id)
         )
         OR (
           d.maintenance_ticket_id IS NOT NULL
           AND d.document_type <> 'Tenant identity'
           AND jump_proptech_private.can_access_ticket(d.maintenance_ticket_id)
         )
       )
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.can_access_document_path(p_storage_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jump_proptech.documents d
     WHERE d.storage_path = p_storage_path
       AND jump_proptech_private.can_access_document(d.id)
  );
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.sync_unit_occupancy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_unit_status text;
BEGIN
  IF NEW.status IN ('Active', 'Notice given') THEN
    SELECT u.occupancy_status
      INTO v_unit_status
      FROM jump_proptech.units u
     WHERE u.id = NEW.unit_id
     FOR UPDATE;
    IF v_unit_status = 'Maintenance' THEN
      RAISE EXCEPTION 'A unit marked for maintenance cannot be assigned an active tenancy'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP <> 'INSERT'
     AND (OLD.unit_id IS DISTINCT FROM NEW.unit_id
          OR (OLD.status IN ('Active', 'Notice given') AND NEW.status NOT IN ('Active', 'Notice given'))) THEN
    UPDATE jump_proptech.units u
       SET occupancy_status = CASE WHEN u.occupancy_status = 'Maintenance' THEN 'Maintenance' ELSE 'Vacant' END,
           current_tenant_id = NULL
     WHERE u.id = OLD.unit_id
       AND NOT EXISTS (
         SELECT 1 FROM jump_proptech.tenancies other
          WHERE other.unit_id = OLD.unit_id
            AND other.id <> NEW.id
            AND other.status IN ('Active', 'Notice given')
       );
  END IF;

  IF NEW.status IN ('Active', 'Notice given') THEN
    UPDATE jump_proptech.units
       SET occupancy_status = 'Occupied',
           current_tenant_id = NEW.tenant_id
     WHERE id = NEW.unit_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.enforce_allocation_bounds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment_amount numeric(12, 2);
  v_invoice_amount numeric(12, 2);
  v_payment_status text;
  v_allocated numeric(12, 2);
BEGIN
  IF TG_OP = 'UPDATE'
     AND (OLD.payment_id IS DISTINCT FROM NEW.payment_id OR OLD.invoice_id IS DISTINCT FROM NEW.invoice_id) THEN
    RAISE EXCEPTION 'An allocation cannot be moved to a different payment or invoice'
      USING ERRCODE = '23514';
  END IF;

  -- Stable payment-then-invoice lock order keeps concurrent single-allocation writes consistent.
  PERFORM pg_advisory_xact_lock(hashtextextended('payment:' || NEW.payment_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('invoice:' || NEW.invoice_id::text, 0));

  SELECT p.amount, p.status
    INTO v_payment_amount, v_payment_status
    FROM jump_proptech.payments p
   WHERE p.id = NEW.payment_id
   FOR UPDATE;
  IF NOT FOUND OR v_payment_status <> 'Recorded' THEN
    RAISE EXCEPTION 'Only manually recorded payments can be allocated'
      USING ERRCODE = '23514';
  END IF;

  SELECT i.total_amount
    INTO v_invoice_amount
    FROM jump_proptech.rent_invoices i
   WHERE i.id = NEW.invoice_id
     AND i.status <> 'Void'
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot allocate to a missing or void invoice'
      USING ERRCODE = '23514';
  END IF;

  SELECT coalesce(sum(a.amount), 0)
    INTO v_allocated
    FROM jump_proptech.payment_allocations a
   WHERE a.payment_id = NEW.payment_id
     AND (TG_OP <> 'UPDATE' OR a.id <> NEW.id);
  IF v_allocated + NEW.amount > v_payment_amount THEN
    RAISE EXCEPTION 'Allocations cannot exceed the recorded payment amount'
      USING ERRCODE = '23514';
  END IF;

  SELECT coalesce(sum(a.amount), 0)
    INTO v_allocated
    FROM jump_proptech.payment_allocations a
   WHERE a.invoice_id = NEW.invoice_id
     AND (TG_OP <> 'UPDATE' OR a.id <> NEW.id);
  IF v_allocated + NEW.amount > v_invoice_amount THEN
    RAISE EXCEPTION 'Allocations cannot exceed the invoice balance'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.prevent_financial_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Financial records are retained; use the supported void or reversal fields instead of deleting'
    USING ERRCODE = '23514';
END;
$$;

CREATE OR REPLACE FUNCTION jump_proptech_private.validate_receipt_issue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment_status text;
BEGIN
  IF NEW.status = 'Issued' THEN
    SELECT p.status INTO v_payment_status
      FROM jump_proptech.payments p
     WHERE p.id = NEW.payment_id;
    IF v_payment_status IS DISTINCT FROM 'Recorded' THEN
      RAISE EXCEPTION 'A receipt can only be issued for a manually recorded payment'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.issued_at IS NULL THEN
      NEW.issued_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION jump_proptech.create_organization(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_organization_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in before creating a workspace' USING ERRCODE = '28000';
  END IF;
  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Workspace name is required' USING ERRCODE = '23514';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('organization:' || v_user_id::text, 0));
  SELECT m.organization_id
    INTO v_organization_id
    FROM jump_proptech.organization_memberships m
   WHERE m.user_id = v_user_id
     AND m.role = 'owner'
     AND m.status = 'active'
   ORDER BY m.created_at
   LIMIT 1;
  IF v_organization_id IS NOT NULL THEN
    RETURN v_organization_id;
  END IF;

  INSERT INTO jump_proptech.organizations (name, created_by)
  VALUES (btrim(p_name), v_user_id)
  RETURNING id INTO v_organization_id;

  INSERT INTO jump_proptech.user_profiles (id)
  VALUES (v_user_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO jump_proptech.organization_memberships (organization_id, user_id, role, status)
  VALUES (v_organization_id, v_user_id, 'owner', 'active');
  RETURN v_organization_id;
END;
$$;

CREATE OR REPLACE FUNCTION jump_proptech.update_assigned_maintenance_ticket_status(
  p_ticket_id uuid,
  p_status text,
  p_handyman_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_assigned_to uuid;
  v_organization_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in before updating an assigned case' USING ERRCODE = '28000';
  END IF;
  IF p_status NOT IN ('Assigned', 'In progress', 'Resolved') THEN
    RAISE EXCEPTION 'Unsupported maintenance status' USING ERRCODE = '23514';
  END IF;

  SELECT t.assigned_to_user_id, t.organization_id
    INTO v_assigned_to, v_organization_id
    FROM jump_proptech.maintenance_tickets t
   WHERE t.id = p_ticket_id
   FOR UPDATE;
  IF NOT FOUND
     OR v_assigned_to IS DISTINCT FROM auth.uid()
     OR NOT jump_proptech_private.is_org_member(v_organization_id, ARRAY['handyman']::text[]) THEN
    RAISE EXCEPTION 'This maintenance case is not assigned to the signed-in handyman'
      USING ERRCODE = '42501';
  END IF;

  UPDATE jump_proptech.maintenance_tickets
     SET status = p_status,
         handyman_notes = p_handyman_notes,
         completed_at = CASE WHEN p_status = 'Resolved' THEN coalesce(completed_at, now()) ELSE NULL END
   WHERE id = p_ticket_id;
END;
$$;

CREATE OR REPLACE FUNCTION jump_proptech.health_check()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object('ok', true, 'schema_version', '20261005000100');
$$;

CREATE OR REPLACE VIEW jump_proptech.rent_invoice_balances
WITH (security_invoker = true)
AS
SELECT
  i.id,
  i.organization_id,
  i.tenancy_id,
  i.tenant_id,
  i.property_id,
  i.unit_id,
  i.invoice_number,
  i.invoice_type,
  i.period_start,
  i.period_end,
  i.due_date,
  i.total_amount,
  i.currency,
  i.status AS invoice_status,
  coalesce(sum(a.amount) FILTER (WHERE p.status = 'Recorded'), 0)::numeric(12, 2) AS amount_received,
  greatest(
    i.total_amount - coalesce(sum(a.amount) FILTER (WHERE p.status = 'Recorded'), 0),
    0
  )::numeric(12, 2) AS balance_due,
  CASE
    WHEN i.status = 'Void' THEN 'Void'
    WHEN greatest(i.total_amount - coalesce(sum(a.amount) FILTER (WHERE p.status = 'Recorded'), 0), 0) = 0 THEN 'Paid'
    WHEN coalesce(sum(a.amount) FILTER (WHERE p.status = 'Recorded'), 0) > 0 THEN
      CASE WHEN i.due_date < current_date THEN 'Overdue' ELSE 'Partially paid' END
    WHEN i.due_date < current_date THEN 'Overdue'
    ELSE 'Open'
  END AS balance_status
FROM jump_proptech.rent_invoices i
LEFT JOIN jump_proptech.payment_allocations a ON a.invoice_id = i.id
LEFT JOIN jump_proptech.payments p ON p.id = a.payment_id
GROUP BY i.id;

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON jump_proptech.organizations
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON jump_proptech.user_profiles
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER organization_memberships_updated_at BEFORE UPDATE ON jump_proptech.organization_memberships
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON jump_proptech.properties
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER property_memberships_updated_at BEFORE UPDATE ON jump_proptech.property_memberships
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER units_updated_at BEFORE UPDATE ON jump_proptech.units
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER owners_updated_at BEFORE UPDATE ON jump_proptech.owners
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER ownership_shares_updated_at BEFORE UPDATE ON jump_proptech.property_ownership_shares
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON jump_proptech.tenants
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER tenant_private_details_updated_at BEFORE UPDATE ON jump_proptech.tenant_private_details
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON jump_proptech.applications
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER tenancies_updated_at BEFORE UPDATE ON jump_proptech.tenancies
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER leases_updated_at BEFORE UPDATE ON jump_proptech.leases
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER rent_invoices_updated_at BEFORE UPDATE ON jump_proptech.rent_invoices
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON jump_proptech.payments
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER payment_allocations_updated_at BEFORE UPDATE ON jump_proptech.payment_allocations
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER receipts_updated_at BEFORE UPDATE ON jump_proptech.receipts
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON jump_proptech.expenses
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER contractors_updated_at BEFORE UPDATE ON jump_proptech.contractors
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER maintenance_tickets_updated_at BEFORE UPDATE ON jump_proptech.maintenance_tickets
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER inspections_updated_at BEFORE UPDATE ON jump_proptech.inspections
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON jump_proptech.documents
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();
CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON jump_proptech.notifications
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.set_updated_at();

CREATE TRIGGER tenancies_sync_unit_occupancy AFTER INSERT OR UPDATE ON jump_proptech.tenancies
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.sync_unit_occupancy();
CREATE TRIGGER payment_allocations_check_bounds BEFORE INSERT OR UPDATE ON jump_proptech.payment_allocations
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.enforce_allocation_bounds();
CREATE TRIGGER receipts_validate_issue BEFORE INSERT OR UPDATE ON jump_proptech.receipts
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.validate_receipt_issue();

CREATE TRIGGER rent_invoices_no_delete BEFORE DELETE ON jump_proptech.rent_invoices
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.prevent_financial_delete();
CREATE TRIGGER payments_no_delete BEFORE DELETE ON jump_proptech.payments
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.prevent_financial_delete();
CREATE TRIGGER payment_allocations_no_delete BEFORE DELETE ON jump_proptech.payment_allocations
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.prevent_financial_delete();
CREATE TRIGGER receipts_no_delete BEFORE DELETE ON jump_proptech.receipts
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.prevent_financial_delete();
CREATE TRIGGER expenses_no_delete BEFORE DELETE ON jump_proptech.expenses
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.prevent_financial_delete();
CREATE TRIGGER audit_logs_no_delete BEFORE DELETE ON jump_proptech.audit_logs
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.prevent_financial_delete();
CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON jump_proptech.audit_logs
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.prevent_financial_delete();

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'organizations', 'user_profiles', 'organization_memberships', 'properties',
    'property_memberships', 'units', 'owners', 'property_ownership_shares',
    'tenants', 'tenant_private_details', 'applications', 'tenancies', 'leases',
    'rent_invoices', 'payments', 'payment_allocations', 'receipts', 'expenses',
    'contractors', 'maintenance_tickets', 'inspections', 'documents',
    'notifications', 'audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE jump_proptech.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('ALTER TABLE jump_proptech.%I FORCE ROW LEVEL SECURITY', v_table);
  END LOOP;
END;
$$;

CREATE POLICY user_profiles_select_self ON jump_proptech.user_profiles
FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY user_profiles_insert_self ON jump_proptech.user_profiles
FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY user_profiles_update_self ON jump_proptech.user_profiles
FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY organizations_select_member ON jump_proptech.organizations
FOR SELECT TO authenticated
USING (jump_proptech_private.is_org_member(id, NULL));
CREATE POLICY organizations_update_owner ON jump_proptech.organizations
FOR UPDATE TO authenticated
USING (jump_proptech_private.is_org_owner(id))
WITH CHECK (jump_proptech_private.is_org_owner(id));

CREATE POLICY organization_memberships_select_scoped ON jump_proptech.organization_memberships
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR jump_proptech_private.is_org_member(organization_id, ARRAY['owner', 'manager']::text[])
);
CREATE POLICY organization_memberships_insert_owner ON jump_proptech.organization_memberships
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.is_org_owner(organization_id));
CREATE POLICY organization_memberships_update_owner ON jump_proptech.organization_memberships
FOR UPDATE TO authenticated
USING (jump_proptech_private.is_org_owner(organization_id))
WITH CHECK (jump_proptech_private.is_org_owner(organization_id));

CREATE POLICY properties_select_scoped ON jump_proptech.properties
FOR SELECT TO authenticated
USING (jump_proptech_private.can_access_property(id));
CREATE POLICY properties_insert_owner ON jump_proptech.properties
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.is_org_owner(organization_id));
CREATE POLICY properties_update_manager ON jump_proptech.properties
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_property(id))
WITH CHECK (jump_proptech_private.can_manage_property(id));

CREATE POLICY property_memberships_select_scoped ON jump_proptech.property_memberships
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR jump_proptech_private.can_manage_property(property_id)
);
CREATE POLICY property_memberships_insert_owner ON jump_proptech.property_memberships
FOR INSERT TO authenticated
WITH CHECK (
  jump_proptech_private.is_org_owner(organization_id)
  AND jump_proptech_private.can_manage_property(property_id)
);
CREATE POLICY property_memberships_update_owner ON jump_proptech.property_memberships
FOR UPDATE TO authenticated
USING (jump_proptech_private.is_org_owner(organization_id))
WITH CHECK (jump_proptech_private.is_org_owner(organization_id));

CREATE POLICY units_select_scoped ON jump_proptech.units
FOR SELECT TO authenticated
USING (
  jump_proptech_private.can_manage_property(property_id)
  OR EXISTS (
    SELECT 1
      FROM jump_proptech.tenancies t
      JOIN jump_proptech.tenants tenant ON tenant.id = t.tenant_id
     WHERE t.unit_id = units.id
       AND t.status IN ('Active', 'Notice given')
       AND tenant.user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1
      FROM jump_proptech.maintenance_tickets mt
      JOIN jump_proptech.organization_memberships om
        ON om.organization_id = mt.organization_id
       AND om.user_id = (SELECT auth.uid())
       AND om.status = 'active'
       AND om.role = 'handyman'
     WHERE mt.unit_id = units.id
       AND mt.assigned_to_user_id = (SELECT auth.uid())
  )
);
CREATE POLICY units_insert_manager ON jump_proptech.units
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_property(property_id));
CREATE POLICY units_update_manager ON jump_proptech.units
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_property(property_id))
WITH CHECK (jump_proptech_private.can_manage_property(property_id));

CREATE POLICY owners_select_scoped ON jump_proptech.owners
FOR SELECT TO authenticated
USING (
  (user_id = (SELECT auth.uid()))
  OR jump_proptech_private.can_manage_any_org_property(organization_id)
  OR EXISTS (
    SELECT 1
      FROM jump_proptech.property_ownership_shares s
     WHERE s.owner_id = id
       AND jump_proptech_private.can_manage_property(s.property_id)
  )
);
CREATE POLICY owners_insert_manager ON jump_proptech.owners
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_any_org_property(organization_id));
CREATE POLICY owners_update_manager ON jump_proptech.owners
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_any_org_property(organization_id))
WITH CHECK (jump_proptech_private.can_manage_any_org_property(organization_id));

CREATE POLICY ownership_shares_select_scoped ON jump_proptech.property_ownership_shares
FOR SELECT TO authenticated
USING (jump_proptech_private.can_manage_property(property_id));
CREATE POLICY ownership_shares_insert_manager ON jump_proptech.property_ownership_shares
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_property(property_id));
CREATE POLICY ownership_shares_update_manager ON jump_proptech.property_ownership_shares
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_property(property_id))
WITH CHECK (jump_proptech_private.can_manage_property(property_id));

CREATE POLICY tenants_select_self_or_manager ON jump_proptech.tenants
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR jump_proptech_private.can_manage_tenant(id)
);
CREATE POLICY tenants_insert_manager ON jump_proptech.tenants
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_any_org_property(organization_id));
CREATE POLICY tenants_update_self_or_manager ON jump_proptech.tenants
FOR UPDATE TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR jump_proptech_private.can_manage_tenant(id)
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR jump_proptech_private.can_manage_tenant(id)
);

CREATE POLICY tenant_private_details_select_authorized ON jump_proptech.tenant_private_details
FOR SELECT TO authenticated
USING (jump_proptech_private.can_access_tenant(tenant_id));
CREATE POLICY tenant_private_details_insert_authorized ON jump_proptech.tenant_private_details
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_access_tenant(tenant_id));
CREATE POLICY tenant_private_details_update_authorized ON jump_proptech.tenant_private_details
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_access_tenant(tenant_id))
WITH CHECK (jump_proptech_private.can_access_tenant(tenant_id));

CREATE POLICY applications_select_applicant_or_manager ON jump_proptech.applications
FOR SELECT TO authenticated
USING (
  jump_proptech_private.is_tenant_user(tenant_id)
  OR jump_proptech_private.can_manage_property(property_id)
);
CREATE POLICY applications_insert_manager ON jump_proptech.applications
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_property(property_id));
CREATE POLICY applications_update_manager ON jump_proptech.applications
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_property(property_id))
WITH CHECK (jump_proptech_private.can_manage_property(property_id));

CREATE POLICY tenancies_select_tenant_or_manager ON jump_proptech.tenancies
FOR SELECT TO authenticated
USING (jump_proptech_private.can_access_tenancy(id));
CREATE POLICY tenancies_insert_manager ON jump_proptech.tenancies
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_property(property_id));
CREATE POLICY tenancies_update_manager ON jump_proptech.tenancies
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_property(property_id))
WITH CHECK (jump_proptech_private.can_manage_property(property_id));

CREATE POLICY leases_select_tenant_or_manager ON jump_proptech.leases
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jump_proptech.tenancies t
     WHERE t.id = tenancy_id
       AND jump_proptech_private.can_access_tenancy(t.id)
  )
);
CREATE POLICY leases_insert_manager ON jump_proptech.leases
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jump_proptech.tenancies t
     WHERE t.id = tenancy_id
       AND jump_proptech_private.can_manage_property(t.property_id)
  )
);
CREATE POLICY leases_update_manager ON jump_proptech.leases
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jump_proptech.tenancies t
     WHERE t.id = tenancy_id
       AND jump_proptech_private.can_manage_property(t.property_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jump_proptech.tenancies t
     WHERE t.id = tenancy_id
       AND jump_proptech_private.can_manage_property(t.property_id)
  )
);

CREATE POLICY rent_invoices_select_tenant_or_manager ON jump_proptech.rent_invoices
FOR SELECT TO authenticated
USING (
  jump_proptech_private.is_tenant_user(tenant_id)
  OR jump_proptech_private.can_manage_property(property_id)
);
CREATE POLICY rent_invoices_insert_manager ON jump_proptech.rent_invoices
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_property(property_id));
CREATE POLICY rent_invoices_update_manager ON jump_proptech.rent_invoices
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_property(property_id))
WITH CHECK (jump_proptech_private.can_manage_property(property_id));

CREATE POLICY payments_select_tenant_or_manager ON jump_proptech.payments
FOR SELECT TO authenticated
USING (
  jump_proptech_private.is_tenant_user(tenant_id)
  OR jump_proptech_private.can_manage_any_org_property(organization_id)
);
CREATE POLICY payments_insert_manager ON jump_proptech.payments
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_any_org_property(organization_id));
CREATE POLICY payments_update_manager ON jump_proptech.payments
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_any_org_property(organization_id))
WITH CHECK (jump_proptech_private.can_manage_any_org_property(organization_id));

CREATE POLICY payment_allocations_select_tenant_or_manager ON jump_proptech.payment_allocations
FOR SELECT TO authenticated
USING (
  jump_proptech_private.is_tenant_user(tenant_id)
  OR EXISTS (
    SELECT 1 FROM jump_proptech.rent_invoices i
     WHERE i.id = invoice_id
       AND jump_proptech_private.can_manage_property(i.property_id)
  )
);
CREATE POLICY payment_allocations_insert_manager ON jump_proptech.payment_allocations
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jump_proptech.rent_invoices i
     WHERE i.id = invoice_id
       AND jump_proptech_private.can_manage_property(i.property_id)
  )
);
CREATE POLICY payment_allocations_update_manager ON jump_proptech.payment_allocations
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jump_proptech.rent_invoices i
     WHERE i.id = invoice_id
       AND jump_proptech_private.can_manage_property(i.property_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jump_proptech.rent_invoices i
     WHERE i.id = invoice_id
       AND jump_proptech_private.can_manage_property(i.property_id)
  )
);

CREATE POLICY receipts_select_tenant_or_manager ON jump_proptech.receipts
FOR SELECT TO authenticated
USING (
  jump_proptech_private.is_tenant_user(tenant_id)
  OR jump_proptech_private.can_manage_any_org_property(organization_id)
);
CREATE POLICY receipts_insert_manager ON jump_proptech.receipts
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_any_org_property(organization_id));
CREATE POLICY receipts_update_manager ON jump_proptech.receipts
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_any_org_property(organization_id))
WITH CHECK (jump_proptech_private.can_manage_any_org_property(organization_id));

CREATE POLICY expenses_select_manager ON jump_proptech.expenses
FOR SELECT TO authenticated
USING (
  (property_id IS NOT NULL AND jump_proptech_private.can_manage_property(property_id))
  OR (property_id IS NULL AND jump_proptech_private.can_manage_any_org_property(organization_id))
);
CREATE POLICY expenses_insert_manager ON jump_proptech.expenses
FOR INSERT TO authenticated
WITH CHECK (
  (property_id IS NOT NULL AND jump_proptech_private.can_manage_property(property_id))
  OR (property_id IS NULL AND jump_proptech_private.can_manage_any_org_property(organization_id))
);
CREATE POLICY expenses_update_manager ON jump_proptech.expenses
FOR UPDATE TO authenticated
USING (
  (property_id IS NOT NULL AND jump_proptech_private.can_manage_property(property_id))
  OR (property_id IS NULL AND jump_proptech_private.can_manage_any_org_property(organization_id))
)
WITH CHECK (
  (property_id IS NOT NULL AND jump_proptech_private.can_manage_property(property_id))
  OR (property_id IS NULL AND jump_proptech_private.can_manage_any_org_property(organization_id))
);

CREATE POLICY contractors_select_org_or_self ON jump_proptech.contractors
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR jump_proptech_private.is_org_member(organization_id, ARRAY['owner', 'manager']::text[])
);
CREATE POLICY contractors_insert_manager ON jump_proptech.contractors
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.is_org_member(organization_id, ARRAY['owner', 'manager']::text[]));
CREATE POLICY contractors_update_manager ON jump_proptech.contractors
FOR UPDATE TO authenticated
USING (jump_proptech_private.is_org_member(organization_id, ARRAY['owner', 'manager']::text[]))
WITH CHECK (jump_proptech_private.is_org_member(organization_id, ARRAY['owner', 'manager']::text[]));

CREATE POLICY maintenance_tickets_select_assigned_tenant_or_manager ON jump_proptech.maintenance_tickets
FOR SELECT TO authenticated
USING (jump_proptech_private.can_access_ticket(id));
CREATE POLICY maintenance_tickets_insert_tenant_or_manager ON jump_proptech.maintenance_tickets
FOR INSERT TO authenticated
WITH CHECK (
  jump_proptech_private.can_manage_property(property_id)
  OR (
    tenant_id IS NOT NULL
    AND jump_proptech_private.is_tenant_user(tenant_id)
    AND EXISTS (
      SELECT 1 FROM jump_proptech.tenancies t
       WHERE t.tenant_id = maintenance_tickets.tenant_id
         AND t.unit_id = maintenance_tickets.unit_id
         AND t.property_id = maintenance_tickets.property_id
         AND t.status IN ('Active', 'Notice given')
    )
  )
);
CREATE POLICY maintenance_tickets_update_manager ON jump_proptech.maintenance_tickets
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_property(property_id))
WITH CHECK (jump_proptech_private.can_manage_property(property_id));

CREATE POLICY inspections_select_tenant_or_manager ON jump_proptech.inspections
FOR SELECT TO authenticated
USING (
  (tenant_id IS NOT NULL AND jump_proptech_private.is_tenant_user(tenant_id))
  OR jump_proptech_private.can_manage_property(property_id)
);
CREATE POLICY inspections_insert_manager ON jump_proptech.inspections
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.can_manage_property(property_id));
CREATE POLICY inspections_update_manager ON jump_proptech.inspections
FOR UPDATE TO authenticated
USING (jump_proptech_private.can_manage_property(property_id))
WITH CHECK (jump_proptech_private.can_manage_property(property_id));

CREATE POLICY documents_select_authorized ON jump_proptech.documents
FOR SELECT TO authenticated
USING (
  jump_proptech_private.can_access_document(id)
);
CREATE POLICY documents_insert_authorized ON jump_proptech.documents
FOR INSERT TO authenticated
WITH CHECK (
  (property_id IS NOT NULL AND jump_proptech_private.can_manage_property(property_id))
  OR (tenant_id IS NOT NULL AND jump_proptech_private.is_tenant_user(tenant_id))
  OR (
    maintenance_ticket_id IS NOT NULL
    AND document_type <> 'Tenant identity'
    AND jump_proptech_private.can_access_ticket(maintenance_ticket_id)
  )
);
CREATE POLICY documents_update_manager ON jump_proptech.documents
FOR UPDATE TO authenticated
USING (
  (property_id IS NOT NULL AND jump_proptech_private.can_manage_property(property_id))
  OR (tenant_id IS NOT NULL AND jump_proptech_private.can_manage_tenant(tenant_id))
)
WITH CHECK (
  (property_id IS NOT NULL AND jump_proptech_private.can_manage_property(property_id))
  OR (tenant_id IS NOT NULL AND jump_proptech_private.can_manage_tenant(tenant_id))
);

CREATE POLICY notifications_select_recipient ON jump_proptech.notifications
FOR SELECT TO authenticated
USING (recipient_user_id = (SELECT auth.uid()));
CREATE POLICY notifications_insert_manager ON jump_proptech.notifications
FOR INSERT TO authenticated
WITH CHECK (jump_proptech_private.is_org_member(organization_id, ARRAY['owner', 'manager']::text[]));
CREATE POLICY notifications_update_recipient ON jump_proptech.notifications
FOR UPDATE TO authenticated
USING (recipient_user_id = (SELECT auth.uid()))
WITH CHECK (recipient_user_id = (SELECT auth.uid()));

CREATE POLICY audit_logs_select_authorized ON jump_proptech.audit_logs
FOR SELECT TO authenticated
USING (
  actor_user_id = (SELECT auth.uid())
  OR (property_id IS NOT NULL AND jump_proptech_private.can_manage_property(property_id))
  OR (organization_id IS NOT NULL AND jump_proptech_private.is_org_owner(organization_id))
);

CREATE TRIGGER audit_organizations AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.organizations
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_user_profiles AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.user_profiles
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_organization_memberships AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.organization_memberships
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_properties AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.properties
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_property_memberships AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.property_memberships
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_units AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.units
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_owners AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.owners
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_property_ownership_shares AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.property_ownership_shares
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.tenants
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_tenant_private_details AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.tenant_private_details
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_applications AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.applications
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_tenancies AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.tenancies
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_leases AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.leases
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_rent_invoices AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.rent_invoices
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.payments
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_payment_allocations AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.payment_allocations
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_receipts AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.receipts
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.expenses
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_contractors AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.contractors
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_maintenance_tickets AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.maintenance_tickets
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_inspections AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.inspections
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.documents
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();
CREATE TRIGGER audit_notifications AFTER INSERT OR UPDATE OR DELETE ON jump_proptech.notifications
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.audit_row_change();

CREATE TRIGGER tenants_no_delete BEFORE DELETE ON jump_proptech.tenants
FOR EACH ROW EXECUTE FUNCTION jump_proptech_private.prevent_financial_delete();

REVOKE ALL ON ALL TABLES IN SCHEMA jump_proptech FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jump_proptech FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON
  jump_proptech.user_profiles,
  jump_proptech.organization_memberships,
  jump_proptech.properties,
  jump_proptech.property_memberships,
  jump_proptech.units,
  jump_proptech.owners,
  jump_proptech.property_ownership_shares,
  jump_proptech.tenants,
  jump_proptech.tenant_private_details,
  jump_proptech.applications,
  jump_proptech.tenancies,
  jump_proptech.leases,
  jump_proptech.rent_invoices,
  jump_proptech.payments,
  jump_proptech.payment_allocations,
  jump_proptech.receipts,
  jump_proptech.expenses,
  jump_proptech.contractors,
  jump_proptech.maintenance_tickets,
  jump_proptech.inspections,
  jump_proptech.documents,
  jump_proptech.notifications
TO authenticated;
GRANT SELECT ON jump_proptech.organizations, jump_proptech.audit_logs,
  jump_proptech.rent_invoice_balances TO authenticated;

GRANT EXECUTE ON FUNCTION jump_proptech.health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech.create_organization(text) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech.update_assigned_maintenance_ticket_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.is_org_member(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.is_org_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_manage_property(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_manage_any_org_property(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.is_tenant_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_manage_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_access_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_access_property(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_access_tenancy(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_access_ticket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_access_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_access_document(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jump_proptech_private.can_access_document_path(text) TO authenticated;
-- Keep the generated identity fingerprint private by not storing it; uniqueness for ID documents
-- remains an application validation until a server-side confidential verification flow is added.

-- Supabase Storage bucket is private. If it already exists as public, stop rather than exposing it.
INSERT INTO storage.buckets (id, name, public)
VALUES ('jump-proptech-private', 'jump-proptech-private', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets
     WHERE id = 'jump-proptech-private'
       AND public = true
  ) THEN
    RAISE EXCEPTION 'The jump-proptech-private bucket already exists as public; secure it before continuing';
  END IF;
END;
$$;

CREATE POLICY jump_proptech_private_documents_read ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'jump-proptech-private'
  AND jump_proptech_private.can_access_document_path(name)
);
CREATE POLICY jump_proptech_private_documents_upload ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'jump-proptech-private'
  AND EXISTS (
    SELECT 1 FROM jump_proptech.documents d
     WHERE d.storage_path = name
       AND jump_proptech_private.can_access_document(d.id)
  )
);

COMMIT;
