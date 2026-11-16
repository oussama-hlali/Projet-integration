CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS campus.buildings (
    id      VARCHAR(64)  PRIMARY KEY,
    name    VARCHAR(120) NOT NULL,
    address VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS campus.rooms (
    id          VARCHAR(64)  PRIMARY KEY,
    building_id VARCHAR(64)  NOT NULL REFERENCES campus.buildings(id) ON DELETE CASCADE,
    name        VARCHAR(120) NOT NULL,
    capacity    INT          NOT NULL,
    status      VARCHAR(32)  NOT NULL DEFAULT 'AVAILABLE',
    type        VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS campus.reservations (
    id         VARCHAR(64)  PRIMARY KEY,
    room_id    VARCHAR(64)  NOT NULL REFERENCES campus.rooms(id) ON DELETE CASCADE,
    room_name  VARCHAR(120),
    user_id    VARCHAR(64)  NOT NULL,
    start_time TIMESTAMPTZ  NOT NULL,
    end_time   TIMESTAMPTZ  NOT NULL,
    purpose    VARCHAR(200),
    status     VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
    CONSTRAINT reservations_no_overlap EXCLUDE USING gist (
        room_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status IN ('PENDING', 'CONFIRMED'))
);

CREATE TABLE IF NOT EXISTS campus.announcements (
    id         VARCHAR(64)  PRIMARY KEY,
    title      VARCHAR(160) NOT NULL,
    body       VARCHAR(2000) NOT NULL,
    category   VARCHAR(32)  NOT NULL DEFAULT 'GENERAL',
    pinned     BOOLEAN      NOT NULL DEFAULT FALSE,
    author_id  VARCHAR(64),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus.transport_routes (
    id    VARCHAR(64)  PRIMARY KEY,
    name  VARCHAR(120) NOT NULL,
    color VARCHAR(16)
);

CREATE TABLE IF NOT EXISTS campus.transport_stops (
    id       VARCHAR(64)  PRIMARY KEY,
    route_id VARCHAR(64)  NOT NULL REFERENCES campus.transport_routes(id) ON DELETE CASCADE,
    name     VARCHAR(120) NOT NULL,
    sequence INT          NOT NULL
);

CREATE TABLE IF NOT EXISTS campus.transport_departures (
    id            VARCHAR(64)  PRIMARY KEY,
    stop_id       VARCHAR(64)  NOT NULL REFERENCES campus.transport_stops(id) ON DELETE CASCADE,
    departure_time TIME         NOT NULL
);
