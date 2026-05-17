ALTER TABLE clients
    ADD COLUMN company_name       VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN company_address    VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN company_vat_number VARCHAR(50)  NOT NULL DEFAULT '',
    ADD COLUMN company_iban       VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN company_swift_bic  VARCHAR(20)  NOT NULL DEFAULT '',
    ADD COLUMN company_bank_name  VARCHAR(200) NOT NULL DEFAULT '';
