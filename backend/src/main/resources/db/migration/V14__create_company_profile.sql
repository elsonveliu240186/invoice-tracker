-- V14__create_company_profile.sql
-- Singleton company-profile table; the PK is pinned to 1 via a CHECK constraint so that
-- there is never more than one row, and upsert logic is trivially safe.
CREATE TABLE company_profile (
    id          SMALLINT     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name        VARCHAR(200) NOT NULL DEFAULT '',
    address     VARCHAR(500) NOT NULL DEFAULT '',
    phone       VARCHAR(32)  NOT NULL DEFAULT '',
    email       VARCHAR(254) NOT NULL DEFAULT '',
    vat_number  VARCHAR(50)  NOT NULL DEFAULT '',
    iban        VARCHAR(100) NOT NULL DEFAULT '',
    swift_bic   VARCHAR(20)  NOT NULL DEFAULT '',
    bank_name   VARCHAR(200) NOT NULL DEFAULT '',
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version     BIGINT       NOT NULL DEFAULT 0
);

-- Seed the singleton row so that find() always returns a value.
INSERT INTO company_profile (id) VALUES (1) ON CONFLICT DO NOTHING;
