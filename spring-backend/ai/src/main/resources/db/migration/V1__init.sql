CREATE TABLE IF NOT EXISTS ai.ai_messages (
    id         VARCHAR(64)  PRIMARY KEY,
    user_id    VARCHAR(64)  NOT NULL,
    role       VARCHAR(16)  NOT NULL,
    content    VARCHAR(4000) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai.ai_proposals (
    id         VARCHAR(64)  PRIMARY KEY,
    user_id    VARCHAR(64)  NOT NULL,
    kind       VARCHAR(64)  NOT NULL,
    payload    VARCHAR(2000) NOT NULL,
    status     VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai.ai_embeddings (
    id          VARCHAR(64)  PRIMARY KEY,
    source_type VARCHAR(32)  NOT NULL,
    source_id   VARCHAR(64)  NOT NULL,
    text        VARCHAR(1000) NOT NULL,
    vector      VARCHAR(4000) NOT NULL
);

CREATE TABLE IF NOT EXISTS ai.ai_usage (
    id         VARCHAR(64) PRIMARY KEY,
    user_id    VARCHAR(64) NOT NULL,
    tokens     INT         NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
