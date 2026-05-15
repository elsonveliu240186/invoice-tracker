CREATE INDEX ix_invoices_status ON invoices (status) WHERE deleted_at IS NULL;
