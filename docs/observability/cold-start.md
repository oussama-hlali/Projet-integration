# Cold-start measurement and keep-alive (SCRUM-134)

## Measuring cold start
1. Let a free-tier service sleep (no requests for 15 min).
2. Time the first request:
   ```bash
   time curl -s https://smart-campus-identity.onrender.com/actuator/health
   ```
3. Record the duration. Typical: 30–60s.

## Keep-alive (prevent sleep)
Set up UptimeRobot (free) to ping each service's health endpoint every 14 minutes:
- `https://smart-campus-identity.onrender.com/actuator/health`
- `https://smart-campus-gateway.onrender.com/actuator/health`
- (add campus, engagement, etc. as needed)

Alternatively, use the GitHub Actions cron in `.github/workflows/keep-alive.yml`.

## Runbook
| Symptom | Cause | Fix |
| --- | --- | --- |
| 502/503 on first request | Cold start | Wait 30–60s, retry. Or set up keep-alive. |
| "max clients reached" | Too many connections | Reduce HikariCP pool size (already 2). |
| Flyway migration fails | DB schema mismatch | Check `flyway_schema_history` in Supabase. |
| 401 on all requests | JWKS URL wrong | Verify `IDENTITY_JWKS_URL` on gateway. |
| CORS error in browser | Origin not allowed | Add origin to gateway CORS config. |
