-- Supabase bootstrap: 6 schemas, one role per service.
-- Run once in the Supabase SQL editor (as postgres / service_role).

-- Schemas
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS campus;
CREATE SCHEMA IF NOT EXISTS engagement;
CREATE SCHEMA IF NOT EXISTS cafeteria;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS ai;

-- One role per service, login enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'identity_user') THEN CREATE ROLE identity_user LOGIN PASSWORD 'change-me-identity'; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'campus_user') THEN CREATE ROLE campus_user LOGIN PASSWORD 'change-me-campus'; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'engagement_user') THEN CREATE ROLE engagement_user LOGIN PASSWORD 'change-me-engagement'; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cafeteria_user') THEN CREATE ROLE cafeteria_user LOGIN PASSWORD 'change-me-cafeteria'; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'notifications_user') THEN CREATE ROLE notifications_user LOGIN PASSWORD 'change-me-notifications'; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ai_user') THEN CREATE ROLE ai_user LOGIN PASSWORD 'change-me-ai'; END IF;
END
$$;

-- Grants: each role owns its schema and can create objects in it
GRANT USAGE, CREATE ON SCHEMA identity       TO identity_user;
GRANT USAGE, CREATE ON SCHEMA campus         TO campus_user;
GRANT USAGE, CREATE ON SCHEMA engagement    TO engagement_user;
GRANT USAGE, CREATE ON SCHEMA cafeteria     TO cafeteria_user;
GRANT USAGE, CREATE ON SCHEMA notifications TO notifications_user;
GRANT USAGE, CREATE ON SCHEMA ai            TO ai_user;

-- Default search_path so Flyway and JPA find the right schema
ALTER ROLE identity_user       SET search_path = identity;
ALTER ROLE campus_user         SET search_path = campus;
ALTER ROLE engagement_user     SET search_path = engagement;
ALTER ROLE cafeteria_user      SET search_path = cafeteria;
ALTER ROLE notifications_user  SET search_path = notifications;
ALTER ROLE ai_user             SET search_path = ai;

-- The gateway never connects to the database; it only validates JWTs.
