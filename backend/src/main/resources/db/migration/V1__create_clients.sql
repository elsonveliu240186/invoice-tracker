CREATE TABLE clients (
    id          UUID         PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(254) NOT NULL,
    phone       VARCHAR(32),
    address     VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    version     BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT clients_name_not_blank CHECK (length(btrim(name)) > 0)
);

CREATE UNIQUE INDEX ux_clients_email_active
    ON clients (lower(email))
    WHERE deleted_at IS NULL;

CREATE INDEX ix_clients_name_lower ON clients (lower(name));
CREATE INDEX ix_clients_created_at ON clients (created_at DESC);
