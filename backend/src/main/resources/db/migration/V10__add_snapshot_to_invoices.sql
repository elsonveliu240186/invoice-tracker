ALTER TABLE invoices
    ADD COLUMN client_name_snapshot       VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN client_address_snapshot    VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN company_name_snapshot      VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN company_address_snapshot   VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN company_vat_snapshot       VARCHAR(50)  NOT NULL DEFAULT '',
    ADD COLUMN company_iban_snapshot      VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN company_swift_snapshot     VARCHAR(20)  NOT NULL DEFAULT '',
    ADD COLUMN company_bank_name_snapshot VARCHAR(200) NOT NULL DEFAULT '';
