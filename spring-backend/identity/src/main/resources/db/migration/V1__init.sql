CREATE TABLE IF NOT EXISTS identity.users (
    id            VARCHAR(64)  PRIMARY KEY,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(32)  NOT NULL,
    totp_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    totp_secret   VARCHAR(64),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
