CREATE TABLE app_users (
    id              UUID         PRIMARY KEY,
    email           TEXT         NOT NULL,
    display_name    TEXT         NOT NULL,
    password_hash   TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_app_users_email_active
    ON app_users (lower(email))
    WHERE deleted_at IS NULL;

CREATE INDEX ix_app_users_created_at ON app_users (created_at);
