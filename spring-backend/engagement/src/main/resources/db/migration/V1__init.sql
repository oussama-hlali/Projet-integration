CREATE TABLE IF NOT EXISTS engagement.events (
    id          VARCHAR(64)  PRIMARY KEY,
    title       VARCHAR(160) NOT NULL,
    description VARCHAR(2000),
    category    VARCHAR(32)  NOT NULL DEFAULT 'ACADEMIC',
    date        TIMESTAMPTZ  NOT NULL,
    location    VARCHAR(160),
    capacity    INT          NOT NULL DEFAULT 0,
    organizer_id VARCHAR(64),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engagement.event_interests (
    id         VARCHAR(64) PRIMARY KEY,
    event_id   VARCHAR(64) NOT NULL REFERENCES engagement.events(id) ON DELETE CASCADE,
    user_id    VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS engagement.event_registrations (
    id         VARCHAR(64) PRIMARY KEY,
    event_id   VARCHAR(64) NOT NULL REFERENCES engagement.events(id) ON DELETE CASCADE,
    user_id    VARCHAR(64) NOT NULL,
    qr_code    VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS engagement.lost_found (
    id          VARCHAR(64)  PRIMARY KEY,
    title       VARCHAR(160) NOT NULL,
    description VARCHAR(2000),
    status      VARCHAR(16)  NOT NULL DEFAULT 'LOST',
    reporter_id VARCHAR(64)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engagement.lost_found_tags (
    item_id VARCHAR(64) NOT NULL REFERENCES engagement.lost_found(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS engagement.lost_found_reactions (
    item_id VARCHAR(64) NOT NULL REFERENCES engagement.lost_found(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS engagement.lost_found_comments (
    id         VARCHAR(64)  PRIMARY KEY,
    post_id    VARCHAR(64)  NOT NULL REFERENCES engagement.lost_found(id) ON DELETE CASCADE,
    author_id  VARCHAR(64)  NOT NULL,
    message    VARCHAR(1000) NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engagement.lost_found_comment_tags (
    comment_id VARCHAR(64) NOT NULL REFERENCES engagement.lost_found_comments(id) ON DELETE CASCADE,
    user_id    VARCHAR(64) NOT NULL
);
