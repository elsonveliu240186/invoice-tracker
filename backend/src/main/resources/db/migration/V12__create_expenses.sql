CREATE TABLE expenses (
    id            UUID            PRIMARY KEY,
    amount        NUMERIC(10,2)   NOT NULL,
    category      VARCHAR(50)     NOT NULL,
    description   VARCHAR(500),
    expense_date  DATE            NOT NULL,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ,
    version       BIGINT          NOT NULL DEFAULT 0,
    CONSTRAINT expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT expenses_amount_capped   CHECK (amount <= 9999999.99),
    CONSTRAINT expenses_category_known  CHECK (category IN (
        'FOOD_DRINK','TRANSPORT','HOUSING','HEALTH','ENTERTAINMENT',
        'SHOPPING','TRAVEL','EDUCATION','UTILITIES','OTHER'
    ))
);

CREATE INDEX ix_expenses_date_active     ON expenses (expense_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_expenses_category_active ON expenses (category)          WHERE deleted_at IS NULL;
-- Note: a partial index on date_trunc('month', expense_date) for summary queries is omitted here
-- because H2 (used in unit tests) does not support date_trunc in index expressions.
-- Add it in a follow-up migration once the test stack is migrated to Testcontainers-only.
