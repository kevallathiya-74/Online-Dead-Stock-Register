-- Online Dead Stock Register Complete Database Schema
-- Generated from Supabase PostgreSQL Metadata

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: approvals
CREATE TABLE IF NOT EXISTS approvals (
    request_type TEXT NOT NULL CHECK (request_type = ANY (ARRAY['Repair'::text, 'Upgrade'::text, 'Scrap'::text, 'New Asset'::text, 'Other'::text])),
    asset_id UUID,
    requested_by UUID NOT NULL,
    approver UUID,
    current_approver_id UUID,
    status TEXT CHECK (status = ANY (ARRAY['Pending'::text, 'Accepted'::text, 'Rejected'::text, 'Approved'::text])),
    request_data JSONB,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approval_chain JSONB,
    final_decision TEXT CHECK (final_decision = ANY (ARRAY['Approved'::text, 'Rejected'::text])),
    final_decision_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
);

-- Table: assets
CREATE TABLE IF NOT EXISTS assets (
    unique_asset_id TEXT NOT NULL,
    qr_code TEXT,
    name TEXT,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    location TEXT NOT NULL,
    assigned_user UUID,
    status TEXT CHECK (status = ANY (ARRAY['Active'::text, 'Under Maintenance'::text, 'Available'::text, 'Damaged'::text, 'Ready for Scrap'::text, 'Disposed'::text])),
    department TEXT NOT NULL CHECK (department = ANY (ARRAY['INVENTORY'::text, 'IT'::text, 'ADMIN'::text])),
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    purchase_cost NUMERIC,
    current_value INTEGER,
    warranty_expiry TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_audit_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_audited_by UUID,
    condition TEXT CHECK (condition = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text, 'damaged'::text])),
    notes TEXT,
    vendor UUID,
    images JSONB,
    last_maintenance_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    configuration JSONB,
    expected_lifespan INTEGER,
    quantity INTEGER,
    location_verified BOOLEAN DEFAULT false,
    last_location_verification_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: asset_categories
CREATE TABLE IF NOT EXISTS asset_categories (
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT true,
    created_by UUID,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: asset_issues
CREATE TABLE IF NOT EXISTS asset_issues (
    asset_id UUID NOT NULL,
    unique_asset_id TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    issue_type TEXT CHECK (issue_type = ANY (ARRAY['Damage'::text, 'Missing Part'::text, 'Maintenance Required'::text, 'Performance Issue'::text, 'Other'::text])),
    severity TEXT CHECK (severity = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Critical'::text])),
    status TEXT CHECK (status = ANY (ARRAY['Open'::text, 'In Progress'::text, 'Resolved'::text, 'Closed'::text])),
    reported_by UUID NOT NULL,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_by UUID,
    resolution_notes TEXT,
    scan_location TEXT,
    attachments JSONB,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: asset_requests
CREATE TABLE IF NOT EXISTS asset_requests (
    requester UUID NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type = ANY (ARRAY['Laptop'::text, 'Desktop'::text, 'Mobile'::text, 'Tablet'::text, 'Monitor'::text, 'Printer'::text, 'Other'::text])),
    asset_category TEXT NOT NULL,
    brand_preference TEXT,
    specifications TEXT,
    justification TEXT NOT NULL,
    priority TEXT CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
    expected_usage TEXT,
    required_by_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'fulfilled'::text, 'cancelled'::text])),
    reviewed_by UUID,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    review_comments TEXT,
    assigned_asset UUID,
    fulfilled_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fulfilled_by UUID,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: asset_transfers
CREATE TABLE IF NOT EXISTS asset_transfers (
    transfer_id TEXT NOT NULL,
    asset UUID NOT NULL,
    from_user UUID NOT NULL,
    to_user UUID NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    initiated_by UUID NOT NULL,
    transfer_reason TEXT NOT NULL CHECK (transfer_reason = ANY (ARRAY['employee_relocation'::text, 'department_change'::text, 'temporary_assignment'::text, 'permanent_assignment'::text, 'maintenance_transfer'::text, 'office_relocation'::text, 'project_requirement'::text, 'other'::text])),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'in_transit'::text, 'completed'::text, 'cancelled'::text])),
    priority TEXT CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    rejection_reason TEXT,
    transferred_by UUID,
    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completion_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expected_transfer_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    actual_transfer_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    transfer_conditions TEXT,
    handover_notes TEXT,
    handover_checklist JSONB,
    approval_history JSONB,
    supporting_documents JSONB,
    tracking_notes JSONB,
    created_by UUID NOT NULL,
    last_updated_by UUID,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    user_id UUID,
    performed_by UUID,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    asset_id UUID,
    description TEXT,
    severity TEXT CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'critical'::text])),
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: disposal_records
CREATE TABLE IF NOT EXISTS disposal_records (
    asset_id TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    category TEXT NOT NULL,
    disposal_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    disposal_method TEXT NOT NULL CHECK (disposal_method = ANY (ARRAY['Auction'::text, 'Scrap'::text, 'Donation'::text, 'Recycling'::text, 'Sale'::text, 'Other'::text])),
    disposal_value INTEGER,
    approved_by TEXT,
    document_reference TEXT,
    status TEXT CHECK (status = ANY (ARRAY['completed'::text, 'pending'::text, 'in_progress'::text, 'cancelled'::text])),
    remarks TEXT,
    created_by UUID,
    attachments JSONB,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: documents
CREATE TABLE IF NOT EXISTS documents (
    asset_id UUID,
    document_type TEXT NOT NULL CHECK (document_type = ANY (ARRAY['Invoice'::text, 'Scrap Certificate'::text, 'Repair Bill'::text, 'Other'::text])),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    description TEXT,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: generated_reports
CREATE TABLE IF NOT EXISTS generated_reports (
    report_id TEXT NOT NULL,
    template UUID NOT NULL,
    report_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category = ANY (ARRAY['Inventory'::text, 'Analytics'::text, 'Financial'::text, 'Vendor'::text, 'Compliance'::text, 'Tracking'::text, 'System'::text])),
    generated_by UUID NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT NOT NULL CHECK (status = ANY (ARRAY['completed'::text, 'processing'::text, 'failed'::text])),
    format TEXT NOT NULL CHECK (format = ANY (ARRAY['PDF'::text, 'Excel'::text, 'CSV'::text, 'JSON'::text])),
    file_path TEXT,
    file_size INTEGER,
    download_count INTEGER,
    last_downloaded TIMESTAMP WITH TIME ZONE DEFAULT now(),
    parameters JSONB,
    error_message TEXT,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: invoices
CREATE TABLE IF NOT EXISTS invoices (
    invoice_number TEXT NOT NULL,
    purchase_order UUID NOT NULL,
    vendor UUID NOT NULL,
    invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'received'::text, 'approved'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])),
    items JSONB,
    subtotal INTEGER NOT NULL,
    tax_amount NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    currency TEXT,
    payment_method TEXT CHECK (payment_method = ANY (ARRAY['bank_transfer'::text, 'cheque'::text, 'cash'::text, 'upi'::text, 'credit_card'::text, 'other'::text])),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    payment_reference TEXT,
    vendor_gstin TEXT,
    notes TEXT,
    attachments JSONB,
    created_by UUID NOT NULL,
    approved_by UUID,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: maintenances
CREATE TABLE IF NOT EXISTS maintenances (
    asset_id UUID NOT NULL,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type = ANY (ARRAY['Preventive'::text, 'Corrective'::text, 'Predictive'::text, 'Emergency'::text, 'Inspection'::text, 'Calibration'::text, 'Cleaning'::text])),
    description TEXT,
    cost NUMERIC,
    vendor_id UUID,
    maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    next_maintenance_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    performed_by TEXT,
    priority TEXT CHECK (priority = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Critical'::text])),
    status TEXT CHECK (status = ANY (ARRAY['Scheduled'::text, 'In Progress'::text, 'Completed'::text, 'Overdue'::text, 'Cancelled'::text])),
    estimated_duration INTEGER,
    actual_duration INTEGER,
    downtime_impact TEXT CHECK (downtime_impact = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text])),
    created_by UUID,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
    recipient UUID NOT NULL,
    sender UUID,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text, 'maintenance'::text, 'audit'::text, 'approval'::text, 'asset_assigned'::text, 'asset_returned'::text, 'warranty_expiring'::text, 'system'::text])),
    priority TEXT CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data JSONB,
    action_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_number TEXT NOT NULL,
    vendor UUID NOT NULL,
    requested_by UUID NOT NULL,
    approved_by UUID,
    department TEXT NOT NULL,
    items JSONB,
    subtotal INTEGER NOT NULL,
    tax_amount NUMERIC,
    shipping_cost NUMERIC,
    total_amount NUMERIC NOT NULL,
    currency TEXT,
    status TEXT CHECK (status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text, 'sent_to_vendor'::text, 'acknowledged'::text, 'in_progress'::text, 'partially_received'::text, 'completed'::text, 'cancelled'::text, 'rejected'::text])),
    priority TEXT CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
    expected_delivery_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    actual_delivery_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    payment_terms TEXT,
    payment_method TEXT CHECK (payment_method = ANY (ARRAY['bank_transfer'::text, 'check'::text, 'credit_card'::text, 'cash'::text, 'other'::text])),
    payment_status TEXT CHECK (payment_status = ANY (ARRAY['pending'::text, 'partial'::text, 'paid'::text, 'refunded'::text])),
    notes TEXT,
    attachments JSONB,
    approval_history JSONB,
    received_items JSONB,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: purchase_requests
CREATE TABLE IF NOT EXISTS purchase_requests (
    request_number TEXT NOT NULL,
    requester UUID NOT NULL,
    department TEXT NOT NULL,
    purpose TEXT NOT NULL,
    items JSONB,
    total_estimated_cost NUMERIC NOT NULL,
    budget_code TEXT,
    priority TEXT CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
    required_by_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text, 'converted_to_po'::text])),
    reviewed_by UUID,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    review_comments TEXT,
    converted_po UUID,
    preferred_vendors JSONB,
    attachments JSONB,
    approval_workflow JSONB,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: report_templates
CREATE TABLE IF NOT EXISTS report_templates (
    template_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category = ANY (ARRAY['Inventory'::text, 'Analytics'::text, 'Financial'::text, 'Vendor'::text, 'Compliance'::text, 'Tracking'::text, 'System'::text])),
    frequency TEXT NOT NULL CHECK (frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text, 'on-demand'::text])),
    type TEXT NOT NULL CHECK (type = ANY (ARRAY['summary'::text, 'detailed'::text, 'analytics'::text, 'compliance'::text])),
    parameters JSONB,
    status TEXT CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])),
    format JSONB,
    is_scheduled BOOLEAN DEFAULT false,
    last_generated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    generation_count INTEGER,
    created_by UUID,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: saved_filters
CREATE TABLE IF NOT EXISTS saved_filters (
    name TEXT NOT NULL,
    description TEXT,
    filter_config JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    is_preset BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    usage_count INTEGER,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    category TEXT CHECK (category = ANY (ARRAY['status'::text, 'condition'::text, 'location'::text, 'date'::text, 'user'::text, 'maintenance'::text, 'financial'::text, 'custom'::text])),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
);

-- Table: scheduled_audits
CREATE TABLE IF NOT EXISTS scheduled_audits (
    name TEXT NOT NULL,
    description TEXT,
    recurrence_type TEXT NOT NULL CHECK (recurrence_type = ANY (ARRAY['once'::text, 'daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])),
    cron_expression TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    next_run_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_run_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    audit_type TEXT CHECK (audit_type = ANY (ARRAY['full'::text, 'partial'::text, 'spot_check'::text, 'condition'::text, 'location'::text])),
    scope_type TEXT NOT NULL CHECK (scope_type = ANY (ARRAY['all'::text, 'department'::text, 'location'::text, 'category'::text, 'custom_filter'::text])),
    scope_config JSONB,
    assigned_auditors JSONB,
    auto_assign BOOLEAN DEFAULT false,
    status TEXT CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text])),
    total_runs INTEGER,
    completed_runs INTEGER,
    failed_runs INTEGER,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    checklist_items JSONB,
    notification_recipients JSONB,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
);

-- Table: scheduled_audit_runs
CREATE TABLE IF NOT EXISTS scheduled_audit_runs (
    scheduled_audit_id UUID NOT NULL,
    run_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
    assets_to_audit JSONB,
    total_assets INTEGER,
    audited_assets JSONB,
    assets_found INTEGER,
    assets_not_found INTEGER,
    assets_damaged INTEGER,
    assets_missing INTEGER,
    completion_percentage INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_auditors JSONB,
    reminders_sent JSONB,
    summary_notes TEXT,
    issues_found JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
);

-- Table: settings
CREATE TABLE IF NOT EXISTS settings (
    lastmodifiedby UUID,
    lastmodifiedat TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: settings_histories
CREATE TABLE IF NOT EXISTS settings_histories (
    category TEXT NOT NULL CHECK (category = ANY (ARRAY['security'::text, 'database'::text, 'email'::text, 'application'::text, 'all'::text])),
    field TEXT NOT NULL,
    oldvalue JSONB NOT NULL,
    newvalue JSONB NOT NULL,
    changedby UUID NOT NULL,
    ipaddress TEXT,
    useragent TEXT,
    reason TEXT,
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    asset_id UUID NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type = ANY (ARRAY['Asset Assignment'::text, 'Asset Transfer'::text, 'Check-out'::text, 'Check-in'::text, 'Maintenance'::text, 'Return'::text])),
    from_user UUID,
    to_user UUID,
    from_location TEXT,
    to_location TEXT,
    quantity INTEGER,
    notes TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_by UUID,
    status TEXT CHECK (status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Completed'::text])),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role = ANY (ARRAY['ADMIN'::text, 'INVENTORY_MANAGER'::text, 'IT_MANAGER'::text, 'AUDITOR'::text, 'VENDOR'::text])),
    department TEXT NOT NULL CHECK (department = ANY (ARRAY['INVENTORY'::text, 'IT'::text, 'ADMIN'::text, 'VENDOR'::text])),
    employee_id TEXT,
    vendor_id UUID,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resetpasswordtoken TEXT,
    resetpasswordexpires TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: vendors
CREATE TABLE IF NOT EXISTS vendors (
    company_name TEXT NOT NULL,
    vendor_name TEXT,
    vendor_code TEXT,
    contact_person TEXT,
    email TEXT,
    contact_email TEXT,
    phone TEXT,
    profile_photo TEXT,
    payment_terms TEXT,
    vendor_type TEXT,
    rating INTEGER,
    performance_rating INTEGER,
    is_active BOOLEAN DEFAULT true,
    category JSONB,
    categories JSONB,
    gst_number TEXT,
    pan_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
);

-- Foreign Key Constraints
ALTER TABLE approvals ADD CONSTRAINT fk_approvals_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE approvals ADD CONSTRAINT fk_approvals_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE approvals ADD CONSTRAINT fk_approvals_approver FOREIGN KEY (approver) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE approvals ADD CONSTRAINT fk_approvals_current_approver_id FOREIGN KEY (current_approver_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE assets ADD CONSTRAINT fk_assets_assigned_user FOREIGN KEY (assigned_user) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_issues ADD CONSTRAINT fk_asset_issues_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE assets ADD CONSTRAINT fk_assets_last_audited_by FOREIGN KEY (last_audited_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE documents ADD CONSTRAINT fk_documents_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE asset_transfers ADD CONSTRAINT fk_asset_transfers_asset FOREIGN KEY (asset) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE maintenances ADD CONSTRAINT fk_maintenances_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE asset_requests ADD CONSTRAINT fk_asset_requests_assigned_asset FOREIGN KEY (assigned_asset) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE assets ADD CONSTRAINT fk_assets_vendor FOREIGN KEY (vendor) REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE asset_categories ADD CONSTRAINT fk_asset_categories_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_issues ADD CONSTRAINT fk_asset_issues_reported_by FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_issues ADD CONSTRAINT fk_asset_issues_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_requests ADD CONSTRAINT fk_asset_requests_fulfilled_by FOREIGN KEY (fulfilled_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_requests ADD CONSTRAINT fk_asset_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_requests ADD CONSTRAINT fk_asset_requests_requester FOREIGN KEY (requester) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_transfers ADD CONSTRAINT fk_asset_transfers_to_user FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_transfers ADD CONSTRAINT fk_asset_transfers_initiated_by FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_transfers ADD CONSTRAINT fk_asset_transfers_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_transfers ADD CONSTRAINT fk_asset_transfers_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_transfers ADD CONSTRAINT fk_asset_transfers_transferred_by FOREIGN KEY (transferred_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_transfers ADD CONSTRAINT fk_asset_transfers_last_updated_by FOREIGN KEY (last_updated_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE asset_transfers ADD CONSTRAINT fk_asset_transfers_from_user FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_performed_by FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE disposal_records ADD CONSTRAINT fk_disposal_records_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE documents ADD CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE generated_reports ADD CONSTRAINT fk_generated_reports_template FOREIGN KEY (template) REFERENCES report_templates(id) ON DELETE SET NULL;
ALTER TABLE generated_reports ADD CONSTRAINT fk_generated_reports_generated_by FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_purchase_order FOREIGN KEY (purchase_order) REFERENCES purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_vendor FOREIGN KEY (vendor) REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE maintenances ADD CONSTRAINT fk_maintenances_vendor_id FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE maintenances ADD CONSTRAINT fk_maintenances_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_sender FOREIGN KEY (sender) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE purchase_orders ADD CONSTRAINT fk_purchase_orders_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE purchase_orders ADD CONSTRAINT fk_purchase_orders_vendor FOREIGN KEY (vendor) REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE purchase_orders ADD CONSTRAINT fk_purchase_orders_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE purchase_requests ADD CONSTRAINT fk_purchase_requests_converted_po FOREIGN KEY (converted_po) REFERENCES purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE purchase_requests ADD CONSTRAINT fk_purchase_requests_requester FOREIGN KEY (requester) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE purchase_requests ADD CONSTRAINT fk_purchase_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE report_templates ADD CONSTRAINT fk_report_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE saved_filters ADD CONSTRAINT fk_saved_filters_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE scheduled_audit_runs ADD CONSTRAINT fk_scheduled_audit_runs_scheduled_audit_id FOREIGN KEY (scheduled_audit_id) REFERENCES scheduled_audits(id) ON DELETE SET NULL;
ALTER TABLE scheduled_audits ADD CONSTRAINT fk_scheduled_audits_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE settings ADD CONSTRAINT fk_settings_lastmodifiedby FOREIGN KEY (lastmodifiedby) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE settings_histories ADD CONSTRAINT fk_settings_histories_changedby FOREIGN KEY (changedby) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_to_user FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_from_user FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_vendor_id FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_assets_unique_id ON assets(unique_asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_maintenances_asset ON maintenances(asset_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
