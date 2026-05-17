-- Index for monthly expense aggregation queries (expense-stats endpoint).
-- date_trunc on a DATE column cast to timestamp without time zone is immutable.
-- Guarded by IF NOT EXISTS to be idempotent.
CREATE INDEX IF NOT EXISTS ix_expenses_month_active
    ON expenses (date_trunc('month', expense_date::timestamp))
    WHERE deleted_at IS NULL;
