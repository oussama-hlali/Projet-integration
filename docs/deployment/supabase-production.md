# Supabase production configuration (SCRUM-131)

## Connection pooling
- Use the **session pooler** (port 5432) for Spring Boot services, not the transaction pooler (6543).
- HikariCP max pool size: **2 per service** (12 total across 6 DB-backed services, under the 15 limit).
- Set `DB_URL=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres`.

## Backups
- Supabase free tier: daily backups retained for 7 days.
- Pro tier: point-in-time recovery (PITR) up to 7 days.
- To restore: Dashboard → Database → Backups → select a backup → Restore.

## Production checklist
- [ ] Change default passwords in `init.sql` (don't use `change-me-*`).
- [ ] Run `init.sql` on the production Supabase project.
- [ ] Set `DB_USER`/`DB_PASSWORD` per service in Render env vars.
- [ ] Enable Row Level Security (RLS) on all tables if exposing Supabase directly (not needed — we go through Spring).
- [ ] Set up a read replica if read traffic grows (Pro tier).

## Migrations
- Each service runs its own Flyway migrations on startup.
- Migrations are in `spring-backend/<service>/src/main/resources/db/migration/`.
- Never edit a migration that has already run in production — add a new one.
