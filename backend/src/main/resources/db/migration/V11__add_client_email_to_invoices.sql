ALTER TABLE invoices ADD COLUMN client_email VARCHAR(254);

UPDATE invoices i
SET client_email = (SELECT email FROM clients c WHERE c.id = i.client_id)
WHERE i.deleted_at IS NULL;
