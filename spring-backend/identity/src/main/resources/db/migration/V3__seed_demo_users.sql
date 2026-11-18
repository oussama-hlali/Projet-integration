-- Seed demo accounts used by the frontend and smoke tests.
INSERT INTO identity.users (id, full_name, email, password_hash, role, totp_enabled, notifications_enabled)
VALUES
  ('u1', 'Ahmed Wardi', 'ahmed.wardi@campus.tn', '$2a$10$AU8iAnBmFJbsAVmBzZ8XXObVgvE0AmPWFqP7l7fjrFbNvUUO.sqhq', 'STUDENT', FALSE, TRUE),
  ('u3', 'Sami Ben Ali', 'sami.benali@campus.tn', '$2a$10$iMaEoMyibY/y9/Q8V2Fpw.gvo1xA5eoPr4/DY6/piuq.d9Yy0IWuy', 'ADMINISTRATOR', FALSE, TRUE)
ON CONFLICT (email) DO NOTHING;
