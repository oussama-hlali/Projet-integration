ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS totp_last_used BIGINT;
ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS theme VARCHAR(16);
ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS language VARCHAR(8);
ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS identity.refresh_tokens (
    id         VARCHAR(128) PRIMARY KEY,
    user_id    VARCHAR(64)  NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    family_id  VARCHAR(64)  NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity.audit_events (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    VARCHAR(64),
    action     VARCHAR(64)  NOT NULL,
    ip         VARCHAR(64),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
