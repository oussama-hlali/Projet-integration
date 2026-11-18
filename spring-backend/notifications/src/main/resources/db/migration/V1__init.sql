CREATE TABLE IF NOT EXISTS notifications.notifications (
    id         VARCHAR(64)  PRIMARY KEY,
    user_id    VARCHAR(64)  NOT NULL,
    type       VARCHAR(32)  NOT NULL,
    message    VARCHAR(500) NOT NULL,
    event_id   VARCHAR(64),
    read       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications.outbox (
    id             VARCHAR(64)  PRIMARY KEY,
    aggregate_type  VARCHAR(64)  NOT NULL,
    aggregate_id   VARCHAR(64)  NOT NULL,
    event_type     VARCHAR(64)  NOT NULL,
    payload        VARCHAR(2000) NOT NULL,
    status         VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
    retries        INT          NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    sent_at        TIMESTAMPTZ
);
