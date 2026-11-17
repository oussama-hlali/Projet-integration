CREATE TABLE IF NOT EXISTS cafeteria.menus (
    id            VARCHAR(64)  PRIMARY KEY,
    building_id   VARCHAR(64),
    building      VARCHAR(120),
    date          TIMESTAMPTZ  NOT NULL,
    meal          VARCHAR(32)  NOT NULL DEFAULT 'Lunch',
    opening_hours VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS cafeteria.menu_items (
    id             VARCHAR(64)  PRIMARY KEY,
    menu_id        VARCHAR(64)  NOT NULL REFERENCES cafeteria.menus(id) ON DELETE CASCADE,
    name           VARCHAR(120) NOT NULL,
    description    VARCHAR(500),
    price          DOUBLE PRECISION NOT NULL,
    dietary_labels VARCHAR(200),
    allergens      VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS cafeteria.orders (
    id              VARCHAR(64)  PRIMARY KEY,
    reference       VARCHAR(32)  NOT NULL UNIQUE,
    user_id         VARCHAR(64)  NOT NULL,
    menu_id         VARCHAR(64)  NOT NULL REFERENCES cafeteria.menus(id),
    item_id         VARCHAR(64)  NOT NULL REFERENCES cafeteria.menu_items(id),
    item_name       VARCHAR(120) NOT NULL,
    menu_label      VARCHAR(120),
    building        VARCHAR(120),
    date            TIMESTAMPTZ  NOT NULL,
    pickup_time     VARCHAR(32),
    price           DOUBLE PRECISION NOT NULL,
    status          VARCHAR(16)  NOT NULL DEFAULT 'CONFIRMED',
    qr_payload      VARCHAR(200) NOT NULL,
    idempotency_key VARCHAR(64)  UNIQUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, menu_id, item_id)
);
