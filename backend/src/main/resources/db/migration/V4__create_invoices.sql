CREATE TABLE invoices (
    id            UUID         PRIMARY KEY,
    number        VARCHAR(64)  NOT NULL,
    client_id     UUID         NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    issue_date    DATE         NOT NULL,
    due_date      DATE         NOT NULL,
    tax_rate      NUMERIC(5,4) NOT NULL DEFAULT 0,
    last_sent_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ,
    version       BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT invoices_number_not_blank CHECK (length(btrim(number)) > 0),
    CONSTRAINT invoices_due_after_issue  CHECK (due_date >= issue_date),
    CONSTRAINT invoices_tax_rate_range   CHECK (tax_rate >= 0 AND tax_rate <= 1)
);

CREATE UNIQUE INDEX ux_invoices_number_active
    ON invoices (lower(number)) WHERE deleted_at IS NULL;
CREATE INDEX ix_invoices_client_id      ON invoices (client_id);
CREATE INDEX ix_invoices_issue_date     ON invoices (issue_date DESC);
CREATE INDEX ix_invoices_last_sent_at   ON invoices (last_sent_at);

CREATE TABLE invoice_lines (
    id           UUID          PRIMARY KEY,
    invoice_id   UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description  VARCHAR(500)  NOT NULL,
    quantity     INTEGER       NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
    position     INTEGER       NOT NULL DEFAULT 0
);

CREATE INDEX ix_invoice_lines_invoice_id ON invoice_lines (invoice_id, position);
