CREATE TABLE invoice_generated_artifacts (
    id            UUID         PRIMARY KEY,
    invoice_id    UUID         NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    format        VARCHAR(8)   NOT NULL CHECK (format IN ('PDF','DOCX')),
    relative_path VARCHAR(512) NOT NULL,
    size_bytes    BIGINT       NOT NULL CHECK (size_bytes >= 0),
    sha256        CHAR(64)     NOT NULL,
    generated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ,
    version       BIGINT       NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX ux_iga_invoice_format_active
    ON invoice_generated_artifacts (invoice_id, format) WHERE deleted_at IS NULL;
CREATE INDEX ix_iga_invoice_id ON invoice_generated_artifacts (invoice_id);
