-- Fields owned by the Angular models that were missing from the first schema.
ALTER TABLE engagement.events
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS room_id VARCHAR(64);

ALTER TABLE engagement.lost_found
    ADD COLUMN IF NOT EXISTS location VARCHAR(120),
    ADD COLUMN IF NOT EXISTS category VARCHAR(64),
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(32);
